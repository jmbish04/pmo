import { parse } from 'csv-parse/sync';
import { logger } from './logger';

export async function ensureTables(env: any): Promise<void> {
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS coders (id TEXT PRIMARY KEY, type TEXT, name TEXT, assigned_project_id TEXT, config TEXT)'
  ).run();
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, name TEXT, description TEXT, status TEXT, priority TEXT, project_id TEXT)'
  ).run();
}

interface SeedTask {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
}

export async function seedFromCSV(csvText: string, env: any): Promise<void> {
  const records = parse(csvText, { columns: true, skip_empty_lines: true });
  const stmt = env.DB.prepare(
    'INSERT INTO tasks (id, name, description, status, priority) VALUES (?, ?, ?, ?, ?)'
  );
  const bindings = records.map(rec => {
    const task: SeedTask = {
      id: crypto.randomUUID(),
      name: rec['Task Name'] || rec.name,
      description: rec['Description'] || '',
      status: rec['Status'] || 'to do',
      priority: rec['Priority'] || 'Medium'
    };
    return stmt.bind(task.id, task.name, task.description, task.status, task.priority);
  });

  if (bindings.length > 0) {
    await env.DB.batch(bindings);
  }
  logger.info('Seeded tasks from CSV', { count: records.length });
}

export async function seedFromJSON(jsonText: string, env: any): Promise<void> {
  const tasks: SeedTask[] = JSON.parse(jsonText);
  for (const task of tasks) {
    await env.DB.prepare(
      'INSERT INTO tasks (id, name, description, status, priority) VALUES (?, ?, ?, ?, ?)'
    ).bind(task.id, task.name, task.description, task.status, task.priority).run();
  }
  logger.info('Seeded tasks from JSON', { count: tasks.length });
}
