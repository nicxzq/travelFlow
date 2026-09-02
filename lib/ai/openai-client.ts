type ChatArgs = {
  system: string;
  user: string;
  temperature: number;
  signal?: AbortSignal;
};

export class OpenAIConfigError extends Error {
  constructor() {
    super('AI service is not configured');
  }
}

export class OpenAIUpstreamError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`AI upstream error: ${status}`);
    this.status = status;
  }
}

function getRequestConfig() {
  const baseUrl = process.env.OPENAI_BASE_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!baseUrl || !apiKey || !model) throw new OpenAIConfigError();

  return { endpoint: `${baseUrl.replace(/\/$/, '')}/chat/completions`, apiKey, model };
}

async function requestChatCompletion({ system, user, temperature, signal, stream }: ChatArgs & { stream: boolean }) {
  const { endpoint, apiKey, model } = getRequestConfig();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature,
      stream,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    cache: 'no-store',
    signal,
  });

  if (!response.ok) throw new OpenAIUpstreamError(response.status);

  return response;
}

export async function completeChat(args: ChatArgs): Promise<string> {
  const response = await requestChatCompletion({ ...args, stream: false });
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI empty content');

  return content;
}

export async function streamChat(args: ChatArgs): Promise<Response> {
  const response = await requestChatCompletion({ ...args, stream: true });
  if (!response.body) throw new OpenAIUpstreamError(response.status);

  return response;
}

export function parseOpenAIChunk(line: string): string {
  if (!line.startsWith('data:')) return '';
  const data = line.slice(5).trim();
  if (!data || data === '[DONE]') return '';

  try {
    const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
    return parsed.choices?.[0]?.delta?.content ?? '';
  } catch {
    return '';
  }
}
