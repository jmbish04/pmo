/**
 * Sync Agent
 * 
 * This agent handles synchronization between ClickUp and D1 database.
 * It pulls projects and tasks from ClickUp API and stages them for processing.
 */

import { AgentContext, ClickUpTask, ClickUpProject } from '../../types';
import { logger } from '../../utils/logger';

export interface SyncResult {
  projectsSynced: number;
  tasksSynced: number;
  errors: string[];
  processingTime: number;
}

export interface StagingTask {
  id: string;
  clickup_task_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  assignees?: string[];
  tags?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  sync_status: 'pending' | 'enriched' | 'promoted' | 'error';
}

export interface ProjectTask {
  id: string;
  clickup_task_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  assignees?: string[];
  tags?: string[];
  due_date?: string;
  enriched_data?: string; // JSON string of enriched data
  created_at: string;
  updated_at: string;
}

export class SyncAgent {
  private env: any;
  private clickupToken: string;
  private teamId: string;

  constructor(env: any) {
    this.env = env;
    this.clickupToken = env.CLICKUP_TOKEN || '';
    this.teamId = env.CLICKUP_TEAM_ID || '';
  }

  /**
   * Main sync method for agent execution
   */
  async execute(context: AgentContext): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🔄 SyncAgent: Starting synchronization', {
        flowId: context.flowId
      });

      const result = await this.syncAllProjects();

      logger.info('✅ SyncAgent: Synchronization completed', {
        projectsSynced: result.projectsSynced,
        tasksSynced: result.tasksSynced,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error('❌ SyncAgent: Synchronization failed', error instanceof Error ? error : new Error(String(error)));
      
      return {
        projectsSynced: 0,
        tasksSynced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Sync all projects from ClickUp
   */
  async syncAllProjects(): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let projectsSynced = 0;
    let tasksSynced = 0;

    try {
      // Get all projects from ClickUp
      const projects = await this.fetchClickUpProjects();
      
      for (const project of projects) {
        try {
          const projectResult = await this.syncProjectById(project.id);
          projectsSynced++;
          tasksSynced += projectResult.tasksSynced;
        } catch (error) {
          const errorMsg = `Failed to sync project ${project.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      // Log sync summary
      await this.logSyncSummary({
        projectsSynced,
        tasksSynced,
        errors,
        processingTime: Date.now() - startTime
      });

      return {
        projectsSynced,
        tasksSynced,
        errors,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMsg = `Failed to sync all projects: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      
      return {
        projectsSynced,
        tasksSynced,
        errors,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Sync a specific project by ID
   */
  async syncProjectById(projectId: string): Promise<{ tasksSynced: number; errors: string[] }> {
    const errors: string[] = [];
    let tasksSynced = 0;

    try {
      logger.info(`🔄 Syncing project: ${projectId}`);

      // Fetch project details
      const project = await this.fetchClickUpProject(projectId);
      
      // Store/update project in D1
      await this.storeProject(project);

      // Fetch all tasks for the project
      const tasks = await this.fetchClickUpTasks(projectId);
      
      // Stage tasks for processing
      for (const task of tasks) {
        try {
          await this.stageTask(task, projectId);
          tasksSynced++;
        } catch (error) {
          const errorMsg = `Failed to stage task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      logger.info(`✅ Project ${projectId} synced successfully`, {
        tasksSynced,
        errors: errors.length
      });

      return { tasksSynced, errors };

    } catch (error) {
      const errorMsg = `Failed to sync project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      return { tasksSynced, errors };
    }
  }

  /**
   * Fetch all projects from ClickUp
   */
  private async fetchClickUpProjects(): Promise<ClickUpProject[]> {
    if (!this.clickupToken || !this.teamId) {
      throw new Error('ClickUp token or team ID not configured');
    }

    try {
      const response = await fetch(`https://api.clickup.com/api/v2/team/${this.teamId}/project`, {
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data && typeof data === 'object' && 'projects' in data) {
        return (data as any).projects || [];
      }
      return [];

    } catch (error) {
      logger.error('Failed to fetch ClickUp projects:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Fetch a specific project from ClickUp
   */
  private async fetchClickUpProject(projectId: string): Promise<ClickUpProject> {
    if (!this.clickupToken) {
      throw new Error('ClickUp token not configured');
    }

    try {
      const response = await fetch(`https://api.clickup.com/api/v2/project/${projectId}`, {
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      logger.error(`Failed to fetch ClickUp project ${projectId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Fetch all tasks for a project from ClickUp
   */
  private async fetchClickUpTasks(projectId: string): Promise<ClickUpTask[]> {
    if (!this.clickupToken) {
      throw new Error('ClickUp token not configured');
    }

    try {
      const response = await fetch(`https://api.clickup.com/api/v2/project/${projectId}/task`, {
        headers: {
          'Authorization': this.clickupToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`ClickUp API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data && typeof data === 'object' && 'tasks' in data) {
        return (data as any).tasks || [];
      }
      return [];

    } catch (error) {
      logger.error(`Failed to fetch ClickUp tasks for project ${projectId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Store project in D1
   */
  private async storeProject(project: ClickUpProject): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO projects (
          id, name, description, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        project.id,
        project.name,
        project.description || '',
        project.status,
        project.created_at,
        project.updated_at
      ).run();

      logger.info(`📁 Project stored: ${project.name} (${project.id})`);

    } catch (error) {
      logger.error(`Failed to store project ${project.id}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Stage a task for processing
   */
  private async stageTask(task: ClickUpTask, projectId: string): Promise<void> {
    try {
      const stagingTask: StagingTask = {
        id: generateUUID(),
        clickup_task_id: task.id,
        project_id: projectId,
        title: task.name,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignees: task.assignees || [],
        tags: task.tags || [],
        due_date: task.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending'
      };

      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO staging_tasks (
          id, clickup_task_id, project_id, title, description, status, priority,
          assignees, tags, due_date, created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        stagingTask.id,
        stagingTask.clickup_task_id,
        stagingTask.project_id,
        stagingTask.title,
        stagingTask.description,
        stagingTask.status,
        stagingTask.priority,
        JSON.stringify(stagingTask.assignees),
        JSON.stringify(stagingTask.tags),
        stagingTask.due_date,
        stagingTask.created_at,
        stagingTask.updated_at,
        stagingTask.sync_status
      ).run();

      logger.info(`📝 Task staged: ${task.name} (${task.id})`);

    } catch (error) {
      logger.error(`Failed to stage task ${task.id}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Log sync summary to D1
   */
  private async logSyncSummary(summary: {
    projectsSynced: number;
    tasksSynced: number;
    errors: string[];
    processingTime: number;
  }): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO sync_log (
          timestamp, summary, success
        ) VALUES (?, ?, ?)
      `).bind(
        new Date().toISOString(),
        JSON.stringify(summary),
        summary.errors.length === 0
      ).run();

      logger.info('📊 Sync summary logged', summary);

    } catch (error) {
      logger.error('Failed to log sync summary:', error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Generate UUID helper function
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return pattern.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 