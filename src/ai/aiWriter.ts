/**
 * AI Writer Module
 * 
 * Handles the creation and management of .agent.md files in R2 storage.
 * These files serve as task assignments for AI agents to collaborate on.
 */

import { logger } from '../utils/logger';
import { generateUUID } from '../utils/uuid';

export interface AgentTask {
  title: string;
  description: string;
  tags?: string[];
  relatedFile?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: string;
  status?: 'assigned' | 'in-progress' | 'completed' | 'reviewed';
  metadata?: Record<string, any>;
}

export async function writeAgentFile({
  title,
  file,
  goal,
  details = [],
  env
}: {
  title: string;
  file: string;
  goal: string;
  details?: string[];
  env: any;
}): Promise<{
  success: boolean;
  fileKey: string;
  presignedUrl?: string;
  metadata: Record<string, any>;
  error?: string;
}> {
  try {
    const content = `# Task: ${title}

**File:** ${file}
**Goal:** ${goal}

**Details:**
${details.map((d) => `- ${d}`).join('\n')}
`;

    const uuid = crypto.randomUUID();
    const filename = `cursor-task-${uuid}.agent.md`;
    const kvKey = `cursor-tasks/${filename}`;

    await env.R2.put(kvKey, content, {
      httpMetadata: { contentType: 'text/markdown' }
    });

    logger.info('Agent file written', { key: kvKey });
    return { success: true, fileKey: kvKey, metadata: { title, goal, details } };
  } catch (err) {
    logger.error('writeAgentFile failed', err instanceof Error ? err : new Error(String(err)));
    return {
      success: false,
      fileKey: '',
      error: err instanceof Error ? err.message : String(err),
      metadata: { title, goal, details }
    };
  }
}
