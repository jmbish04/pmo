// Utility functions for D1, KV, and AI integration in Cloudflare Worker

/**
 * Log a transaction to the D1 database
 */
export async function logTransaction(env: any, type: string, details: any) {
  await env.DB.prepare(
    'INSERT INTO transactions (type, details) VALUES (?, ?)' 
  ).bind(type, details).run();
}

/**
 * Upsert a task into the D1 database
 */
export async function upsertTask(env: any, taskId: string, data: any) {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO tasks (id, data, last_synced) VALUES (?, ?, CURRENT_TIMESTAMP)'
  ).bind(taskId, JSON.stringify(data)).run();
}

/**
 * Add a note to the D1 database
 */
export async function addNote(env: any, taskId: string, note: string) {
  await env.DB.prepare(
    'INSERT INTO notes (task_id, note) VALUES (?, ?)'
  ).bind(taskId, note).run();
}

/**
 * Store a token in KV
 */
export async function storeToken(env: any, key: string, token: string) {
  await env.KV.put(key, token);
}

/**
 * Retrieve a token from KV
 */
export async function getToken(env: any, key: string) {
  return await env.KV.get(key);
}

/**
 * Run AI analysis on a task change
 */
export async function analyzeTaskChange(env: any, change: any) {
  // Example: call AI binding with change data
  // Replace with actual AI API usage as needed
  if (!env.AI) return null;
  // This is a placeholder; actual API will depend on your AI binding
  return await env.AI.run('analyze-task-change', { change });
}

/**
 * Exchange ClickUp OAuth code for access and refresh tokens
 */
export async function exchangeClickUpCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://api.clickup.com/api/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.status} ${await response.text()}`);
  }
  return await response.json();
}

/**
 * Search ClickUp for reusable features/apps based on project details
 */
export async function searchReusableFeatures(env: any, projectDetails: any) {
  // TODO: Implement ClickUp API search and AI analysis
  return { summary: 'Stub: No reusable features found (implement search logic).' };
}

/**
 * Check if unit testing is mentioned in notes/comments for a task
 */
export async function checkUnitTestingInNotes(env: any, taskId: string) {
  // TODO: Implement ClickUp API fetch and AI analysis of notes/comments
  return false; // Stub: always returns false
}

/**
 * Reopen a task or create a subtask for unit test coverage
 */
export async function reopenOrCreateSubtask(env: any, taskId: string, message: string) {
  // TODO: Implement ClickUp API call to reopen or create subtask
  return true; // Stub
}

/**
 * Check for prior tasks not marked complete before a task moves to in progress
 */
export async function checkPriorTasksCompletion(env: any, taskId: string) {
  // TODO: Implement ClickUp API fetch and logic to check prior tasks
  return true; // Stub
} 