/**
 * AI Writer Module
 * 
 * Handles the creation and management of .agent.md files in R2 storage.
 * These files serve as task assignments for AI agents to collaborate on.
 */

import { logger } from './logger';
import { generateUUID } from './uuid';

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
  }): Promise<void> {
    const content = `# Task: ${title}
  
  **File:** ${file}  
  **Goal:** ${goal}  
  
  **Details:**
  ${details.map((d) => `- ${d}`).join("\n")}
  `;
  
    const uuid = crypto.randomUUID();
    const filename = `cursor-task-${uuid}.agent.md`;
    const kvKey = `cursor-tasks/${filename}`;
  
    await env.R2.put(kvKey, content, {
      httpMetadata: { contentType: "text/markdown" }
    });
  
    console.log(`🧠 Cursor task written to R2 as ${kvKey}`);
  }