import { logger } from '../utils/logger';

export async function stageTask(req: Request, env: any): Promise<Response> {
  const data: any = await req.json();
  const taskId = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(`
      INSERT INTO task_staging (uuid, title, description, created_at, needs_enrichment)
      VALUES (?, ?, ?, ?, ?)
    `).bind(taskId, data.title, data.description || "", now, true).run();

    return Response.json({ status: "staged", taskId });
  } catch (error) {
    logger.error('Task route error:', error instanceof Error ? error : new Error(String(error)));
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      data: null
    });
  }
}

export async function finalizeTask(req: Request, env: any): Promise<Response> {
  const data: any = await req.json();
  const now = new Date().toISOString();

  const stmt = env.DB.prepare(`
    INSERT INTO project_tasks (uuid, project_uuid, title, description, enriched_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  if (data && Array.isArray(data.tasks)) {
    for (const task of data.tasks) {
      await stmt.bind(task.uuid, task.project_uuid, task.title, task.description || "", now).run();
    }
  }

  // Optional: Clean staging table
  const cleanupStmt = env.DB.prepare("DELETE FROM task_staging WHERE uuid = ?");
  if (data && Array.isArray(data.tasks)) {
    for (const task of data.tasks) {
      await cleanupStmt.bind(task.uuid).run();
    }
  }

  return Response.json({ status: "finalized", count: data && Array.isArray(data.tasks) ? data.tasks.length : 0 });
}