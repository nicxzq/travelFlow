import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { OpenAIConfigError, OpenAIUpstreamError, parseOpenAIChunk, streamChat } from '@/lib/ai/openai-client';
import { takeRateLimitToken } from '@/lib/ai/rate-limit';
import { getCurrentUser } from '@/lib/auth/current-user';

export const runtime = 'nodejs';

/** Deliberately URL-free: the model gets an index it can echo back, never an address. */
type ReviewPhoto = {
  index: number;
  dayIndex: number;
  stopTitle: string;
};

const MAX_TITLE_LENGTH = 200;
const MAX_FACTS_BYTES = 32 * 1024;
const MAX_BODY_BYTES = 64 * 1024;
const MAX_PHOTOS = 24;
const MAX_STOP_TITLE_LENGTH = 120;
const UPSTREAM_TIMEOUT_MS = 60_000;

const SYSTEM_PROMPT = `你是旅行复盘撰稿人，只能依据用户提供的事实数据写中文结论。

输出语法严格限制为：
1. 二级标题，写成“## 标题”。
2. 空行分隔的自然段。
3. 照片占位符，写成“[[photo:N]]”，N 必须是照片数组里的整数索引。
不得输出列表、表格、引用、代码块、链接、图片网址、HTML 或其他 Markdown。

事实约束：
1. 不得编造数据中不存在的地点、时间、费用、评价、天气或因果关系。
2. 需要推断时必须写明“可能是”。
3. 只在能说明结论的位置插入照片占位符。
4. 照片数组为空时，完全不要输出照片占位符。`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clientIp(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

function readPhotos(value: unknown): ReviewPhoto[] | string {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return '照片数据格式不正确。';
  if (value.length > MAX_PHOTOS) return `照片最多 ${MAX_PHOTOS} 张。`;

  const photos: ReviewPhoto[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      !Number.isInteger(item.index) ||
      !Number.isInteger(item.dayIndex) ||
      typeof item.stopTitle !== 'string'
    ) {
      return '照片数据格式不正确。';
    }

    photos.push({
      index: item.index as number,
      dayIndex: item.dayIndex as number,
      stopTitle: item.stopTitle.trim().slice(0, MAX_STOP_TITLE_LENGTH),
    });
  }

  return photos;
}

function buildUserPrompt(title: string, factsJson: string, catalogue: ReviewPhoto[]) {
  return [
    `行程标题：${title}`,
    '',
    '事实数据：',
    factsJson,
    '',
    '可用照片数组：',
    JSON.stringify(catalogue),
    '',
    '请写出图文复盘结论：原计划与实际执行的关键差异、已经验证的经验，以及下次规划可复用的规则。',
  ].join('\n');
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const fail = (message: string, status: number) => NextResponse.json({ error: message, requestId }, { status });

  // 第二道防线。middleware 已经拦过一次，但它不是安全边界（设计文档 §10.2），
  // 且必须在开流之前判定——响应头一旦随流发出就无法再写。
  if (!(await getCurrentUser())) {
    return fail('请先登录后使用。', 401);
  }

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return fail('请求体过大。', 413);
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return fail('请求体过大。', 413);
    body = JSON.parse(raw);
  } catch {
    return fail('请求体不是合法 JSON。', 400);
  }

  try {
    if (!isRecord(body)) return fail('请求参数无效。', 400);

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title || title.length > MAX_TITLE_LENGTH) return fail(`标题不能为空，且不超过 ${MAX_TITLE_LENGTH} 字。`, 400);

    const factsJson = JSON.stringify(body.facts ?? null);
    if (new TextEncoder().encode(factsJson).length > MAX_FACTS_BYTES) return fail('复盘数据过大，请精简后重试。', 400);

    const photos = readPhotos(body.photos);
    if (typeof photos === 'string') return fail(photos, 400);

    if (!takeRateLimitToken(clientIp(request))) return fail('请求过于频繁，请稍后再试。', 429);

    // Abort the upstream when the browser hangs up or stalls; otherwise the model
    // keeps generating — and billing — into a stream nobody reads.
    const upstreamAbort = new AbortController();
    const timeout = setTimeout(() => upstreamAbort.abort(), UPSTREAM_TIMEOUT_MS);
    request.signal.addEventListener('abort', () => upstreamAbort.abort(), { once: true });

    let upstream: Response;
    try {
      upstream = await streamChat({
        system: SYSTEM_PROMPT,
        user: buildUserPrompt(title, factsJson, photos),
        temperature: 0.4,
        signal: upstreamAbort.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.body!.getReader();
    let buffer = '';
    let closed = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (event: string, data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true;
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              const delta = parseOpenAIChunk(line.trim());
              if (delta) push('delta', { text: delta });
            }
          }

          push('done', { requestId });
        } catch (error) {
          console.error(`[AI_REVIEW_STREAM_ERROR:${requestId}]`, error);
          push('error', { message: '生成中断，已保留已经写出的内容。' });
        } finally {
          clearTimeout(timeout);
          reader.releaseLock();
          if (!closed) {
            closed = true;
            controller.close();
          }
        }
      },
      cancel() {
        closed = true;
        clearTimeout(timeout);
        upstreamAbort.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof OpenAIConfigError) return fail('AI 服务未配置，请先设置模型环境变量。', 503);
    if (error instanceof OpenAIUpstreamError) return fail('AI 服务暂时不可用，请稍后重试。', 502);

    console.error(`[AI_REVIEW_ROUTE_ERROR:${requestId}]`, error);
    return fail('系统暂时繁忙，请稍后重试。', 500);
  }
}
