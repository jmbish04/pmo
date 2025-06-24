import { logger } from '../utils/logger';
import type { Env } from '../types';

interface CoderRequest {
  coderId: string;
  taskId: string;
  error?: string;
}

export async function startTask(req: Request, env: Env): Promise<Response> {
  const body: CoderRequest = await req.json();
  try {
    await env.DB.prepare(
      'UPDATE tasks SET status = ? WHERE id = ?'
    ).bind('in_progress', body.taskId).run();
    logger.info('Coder started task', { coderId: body.coderId, taskId: body.taskId });
    return Response.json({ success: true });
  } catch (err) {
    logger.error('startTask error', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function completeTask(req: Request, env: Env): Promise<Response> {
  const body: CoderRequest = await req.json();
  try {
    await env.DB.prepare(
      'UPDATE tasks SET status = ? WHERE id = ?'
    ).bind('completed', body.taskId).run();
    logger.info('Coder completed task', { coderId: body.coderId, taskId: body.taskId });
    return Response.json({ success: true });
  } catch (err) {
    logger.error('completeTask error', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function reportError(req: Request, env: Env): Promise<Response> {
  const body: CoderRequest = await req.json();
  try {

    if (!body.error) {
      return Response.json({ success: false, error: 'The "error" field is required.' }, { status: 400 });
    }


    const errorSuffix = body.error ? `\n\nError: ${body.error}` : '';

    await env.DB.prepare(
      "UPDATE tasks SET status = ?, description = coalesce(description, '') || ? WHERE id = ?"
    ).bind('error', errorSuffix, body.taskId).run();
    logger.info('Coder reported error', { coderId: body.coderId, taskId: body.taskId });
    return Response.json({ success: true });
  } catch (err) {
    logger.error('reportError error', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function nextTask(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const coderType = url.searchParams.get('coderType') || 'codex';
  const projectId = url.searchParams.get('projectId');
  try {
    let query = 'SELECT * FROM tasks WHERE status = ?';
    const params: any[] = ['to do'];
    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    if (coderType) {
      query += ' AND type = ?';
      params.push(coderType);
    }
    query += ' ORDER BY priority DESC LIMIT 1';
    const result = await env.DB.prepare(query).bind(...params).first();
    if (!result) {
      return Response.json({ task: null });
    }
    logger.info('Next task fetched', { coderType, projectId, taskId: result.id });
    return Response.json({ task: result });
  } catch (err) {
    logger.error('nextTask error', err instanceof Error ? err : new Error(String(err)));
    return Response.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function handleCoderRoutes(
  request: Request,
  env: Env
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/coder/start-task' && request.method === 'POST') {
    return startTask(request, env);
  }
  if (path === '/api/coder/complete-task' && request.method === 'POST') {
    return completeTask(request, env);
  }
  if (path === '/api/coder/report-error' && request.method === 'POST') {
    return reportError(request, env);
  }
  if (path === '/api/next-task' && request.method === 'GET') {
    return nextTask(request, env);
  }

  return null;
}
