import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { GeneratedItinerary } from '@/lib/domain/trip';
import { parseOpenAIChunk } from '@/lib/ai/openai-client';
import { parseItineraryFromRawContent, requestOpenAIStream } from '@/lib/ai/openai-itinerary';

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    const body = (await request.json()) as {
      prompt?: string;
      existingItinerary?: GeneratedItinerary;
      refinementMode?: 'canvas_refine' | 'regenerate';
    };

    const prompt = body.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ error: '请输入行程需求。' }, { status: 400 });
    }

    const upstream = await requestOpenAIStream({
      prompt,
      existingItinerary: body.existingItinerary,
      refinementMode: body.refinementMode,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const reader = upstream.body!.getReader();
    let buffer = '';
    let fullContent = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
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
              if (!delta) continue;
              fullContent += delta;
              push('delta', { text: delta });
            }
          }

          const itinerary = parseItineraryFromRawContent(fullContent);
          push('itinerary', { itinerary });
          push('done', { requestId });
          controller.close();
        } catch (error) {
          console.error(`[AI_STREAM_ERROR:${requestId}]`, error);
          push('error', { message: '生成失败，请稍后重试。' });
          controller.close();
        } finally {
          reader.releaseLock();
        }
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
    console.error(`[AI_ROUTE_ERROR:${requestId}]`, error);
    return NextResponse.json(
      {
        error: '系统暂时繁忙，请稍后重试。',
        requestId,
      },
      { status: 500 },
    );
  }
}
