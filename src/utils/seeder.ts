import { parse } from 'csv-parse/sync';
import { logger } from './logger';
import type { Env } from '../types';

export async function ensureTables(env: Env): Promise<void> {
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
  project_id?: string | null;
}

export async function seedFromCSV(csvText: string, env: Env): Promise<void> {
  const records = parse(csvText, { columns: true, skip_empty_lines: true });
  const statements: D1PreparedStatement[] = [];
  for (const rec of records) {
    const task: SeedTask = {
      id: crypto.randomUUID(),
      name: rec['Task Name'] || rec.name,
      description: rec['Description'] || '',
      status: rec['Status'] || 'to do',
      priority: rec['Priority'] || 'Medium',
      project_id: rec['Project ID'] || null
    };
    statements.push(
      env.DB.prepare(
        'INSERT INTO tasks (id, name, description, status, priority, project_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(task.id, task.name, task.description, task.status, task.priority, task.project_id)
    );
  }
  await env.DB.batch(statements);
  logger.info('Seeded tasks from CSV', { count: records.length });
}

export async function seedFromJSON(jsonText: string, env: Env): Promise<void> {
  const tasks: SeedTask[] = JSON.parse(jsonText);
  const statements = tasks.map((task) =>
    env.DB.prepare(
      'INSERT INTO tasks (id, name, description, status, priority, project_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(task.id, task.name, task.description, task.status, task.priority, task.project_id ?? null)
  );
  await env.DB.batch(statements);
  logger.info('Seeded tasks from JSON', { count: tasks.length });
}
