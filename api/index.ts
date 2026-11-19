import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../src/lib/studioApi.ts';

interface VercelLikeRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelLikeResponse extends ServerResponse {
  status?: (code: number) => VercelLikeResponse;
  json?: (payload: unknown) => void;
  send?: (payload: string) => void;
}

async function readJsonBody(req: VercelLikeRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(
  req: VercelLikeRequest,
  res: VercelLikeResponse,
) {
  const parsedUrl = new URL(req.url || '/api/health', 'http://localhost');
  const query: Record<string, string | undefined> = {};
  parsedUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const headers: Record<string, string | undefined> = {};
  for (const [key, val] of Object.entries(req.headers || {})) {
    headers[key.toLowerCase()] = Array.isArray(val) ? val[0] : val;
  }

  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await readJsonBody(req);

  const result = await handleApiRequest({
    method: req.method || 'GET',
    pathname: parsedUrl.pathname,
    query,
    headers,
    body,
    ip:
      (headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown',
  });

  if (result.headers) {
    for (const [k, v] of Object.entries(result.headers)) {
      res.setHeader(k, v);
    }
  }

  if (result.rawText !== undefined) {
    res.statusCode = result.status;
    res.end(result.rawText);
    return;
  }

  res.statusCode = result.status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(result.body));
}
