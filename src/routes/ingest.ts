import { Env } from '../types';
import { logger } from '../utils/logger';

interface UsagePayload {
  coderId?: string;
  data: unknown;
}

export async function ingest(request: Request, env: Env): Promise<Response> {
  try {
    const body: UsagePayload = await request.json();
    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const id = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO usage_data (id, coder_id, payload) VALUES (?, ?, ?)'
    ).bind(id, body.coderId ?? null, JSON.stringify(body.data)).run();
    logger.info('Usage data ingested', { id, coderId: body.coderId });
    return Response.json({ success: true, id });
  } catch (err) {
    logger.error('ingest error', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ error: 'Failed to ingest' }, { status: 500 });
  }
}

