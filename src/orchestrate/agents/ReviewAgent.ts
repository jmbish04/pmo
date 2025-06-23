/**
 * Review Agent
 * 
 * This agent reads from staging_tasks, enriches tasks with AI, and promotes them to project_tasks.
 * It handles the review and enrichment workflow for staged tasks.
 */

import { AgentContext, StagingTask, ProjectTask } from '../../types';
import { logger } from '../../utils/logger';
import { generateUUID } from '../../utils/uuid';

export interface ReviewResult {
  tasksReviewed: number;
  tasksEnriched: number;
  tasksPromoted: number;
  errors: string[];
  processingTime: number;
}

export interface EnrichmentData {
  description?: string;
  unit_tests?: string[];
  tags?: string[];
  priority?: number;
  effort_estimate?: number;
  dependencies?: string[];
  assignees?: string[];
  success_criteria?: string[];
  confidence_score?: number;
  ai_metadata?: any;
}

export class ReviewAgent {
  private env: any;
  private orchestrator: any;

  constructor(env: any, orchestrator?: any) {
    this.env = env;
    this.orchestrator = orchestrator;
  }

  /**
   * Main execution method for agent
   */
  async execute(context: AgentContext): Promise<ReviewResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🔍 ReviewAgent: Starting task review process', {
        flowId: context.flowId
      });

      const result = await this.reviewStagedTasks(context);

      logger.info('✅ ReviewAgent: Task review completed', {
        flowId: context.flowId,
        tasksReviewed: result.tasksReviewed,
        tasksPromoted: result.tasksPromoted,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      logger.error('❌ ReviewAgent: Task review failed', error instanceof Error ? error : new Error(String(error)));
      
      return {
        tasksReviewed: 0,
        tasksEnriched: 0,
        tasksPromoted: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Review all staged tasks
   */
  async reviewStagedTasks(context: AgentContext): Promise<ReviewResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let tasksReviewed = 0;
    let tasksEnriched = 0;
    let tasksPromoted = 0;

    try {
      // Get all pending staged tasks
      const stagedTasks = await this.getStagedTasks();
      
      if (stagedTasks.length === 0) {
        logger.info('📋 No staged tasks to review');
        return {
          tasksReviewed: 0,
          tasksEnriched: 0,
          tasksPromoted: 0,
          errors: [],
          processingTime: Date.now() - startTime
        };
      }

      logger.info(`📋 Found ${stagedTasks.length} staged tasks to review`);

      // Process each staged task
      for (const task of stagedTasks) {
        try {
          const taskResult = await this.reviewSingleTask(task, context);
          tasksReviewed++;
          
          if (taskResult.enriched) {
            tasksEnriched++;
          }
          
          if (taskResult.promoted) {
            tasksPromoted++;
          }

        } catch (error) {
          const errorMsg = `Failed to review task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      return {
        tasksReviewed,
        tasksEnriched,
        tasksPromoted,
        errors,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMsg = `Failed to review staged tasks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      logger.error(errorMsg);
      
      return {
        tasksReviewed,
        tasksEnriched,
        tasksPromoted,
        errors,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Review a single staged task
   */
  async reviewSingleTask(task: StagingTask, context: AgentContext): Promise<{
    enriched: boolean;
    promoted: boolean;
    error?: string;
  }> {
    try {
      logger.info(`🔍 Reviewing task: ${task.title} (${task.id})`);

      let enriched = false;
      let promoted = false;

      // Check if task needs enrichment
      const needsEnrichment = this.needsEnrichment(task);
      
      if (needsEnrichment) {
        logger.info(`🧠 Enriching task: ${task.title}`);
        
        // Enrich the task
        const enrichmentData = await this.enrichTask(task, context);
        
        if (enrichmentData) {
          // Update task with enriched data
          await this.updateStagedTask(task.id, enrichmentData);
          enriched = true;
          
          logger.info(`✅ Task enriched: ${task.title}`, {
            confidenceScore: enrichmentData.confidence_score
          });
        }
      }

      // Validate task before promotion
      const isValid = await this.validateTask(task);
      
      if (isValid) {
        // Promote task to project_tasks
        await this.promoteTask(task);
        promoted = true;
        
        // Mark staged task as inactive
        await this.markStagedTaskInactive(task.id);
        
        logger.info(`🚀 Task promoted: ${task.title}`);
      } else {
        logger.warn(`⚠️ Task validation failed: ${task.title}`);
      }

      return { enriched, promoted };

    } catch (error) {
      const errorMsg = `Failed to review task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error(errorMsg);
      return { enriched: false, promoted: false, error: errorMsg };
    }
  }

  /**
   * Get all staged tasks that need review
   */
  async getStagedTasks(): Promise<StagingTask[]> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM staging_tasks 
        WHERE sync_status = 'pending' 
        ORDER BY created_at ASC
      `).all();

      return result.results || [];

    } catch (error) {
      logger.error('Failed to get staged tasks:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if task needs enrichment
   */
  needsEnrichment(task: StagingTask): boolean {
    return !task.description || 
           !task.unit_tests || 
           task.tags?.length === 0 ||
           !task.effort_estimate ||
           !task.success_criteria;
  }

  /**
   * Enrich task with AI
   */
  async enrichTask(task: StagingTask, context: AgentContext): Promise<EnrichmentData | null> {
    try {
      // Use orchestrator's enrichTask method if available
      if (this.orchestrator && typeof this.orchestrator.enrichTask === 'function') {
        return await this.orchestrator.enrichTask(task, context.request?.config);
      }

      // Fallback to local enrichment
      return await this.localEnrichTask(task);

    } catch (error) {
      logger.error(`Failed to enrich task ${task.id}:`, error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Local task enrichment (fallback)
   */
  async localEnrichTask(task: StagingTask): Promise<EnrichmentData> {
    logger.info(`🧠 Local enrichment for task: ${task.title}`);

    // Mock AI enrichment - replace with actual AI calls later
    const enrichedData: EnrichmentData = {
      description: task.description || `Autogenerated description for: ${task.title}`,
      unit_tests: [
        `should complete ${task.title} successfully`,
        `should handle errors gracefully`,
        `should sync to ClickUp properly`,
        `should meet all acceptance criteria`
      ],
      tags: task.tags || ['ai-enriched', 'auto-generated', 'reviewed'],
      priority: task.priority || 3,
      effort_estimate: Math.floor(Math.random() * 8) + 1, // 1-8 hours
      dependencies: [],
      assignees: task.assignees || [],
      success_criteria: [
        `Task "${task.title}" is completed`,
        `All acceptance criteria are met`,
        `Code is reviewed and approved`,
        `Tests pass successfully`
      ],
      confidence_score: 0.85 + (Math.random() * 0.15), // 0.85-1.0
      ai_metadata: {
        enriched_at: new Date().toISOString(),
        model_used: 'local-mock-model',
        enrichment_version: '1.0.0',
        review_agent: 'ReviewAgent'
      }
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    return enrichedData;
  }

  /**
   * Validate task before promotion
   */
  async validateTask(task: StagingTask): Promise<boolean> {
    try {
      // Basic validation checks
      const validations = [
        task.title && task.title.length > 0,
        task.project_id && task.project_id.length > 0,
        task.clickup_task_id && task.clickup_task_id.length > 0,
        task.status && task.status.length > 0
      ];

      const isValid = validations.every(v => v === true);

      if (!isValid) {
        logger.warn(`Task validation failed for ${task.id}:`, {
          hasTitle: !!task.title,
          hasProjectId: !!task.project_id,
          hasClickUpId: !!task.clickup_task_id,
          hasStatus: !!task.status
        });
      }

      return isValid;

    } catch (error) {
      logger.error(`Task validation error for ${task.id}:`, error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }

  /**
   * Update staged task with enriched data
   */
  async updateStagedTask(taskId: string, enrichmentData: EnrichmentData): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE staging_tasks 
        SET 
          description = ?,
          tags = ?,
          priority = ?,
          effort_estimate = ?,
          dependencies = ?,
          assignees = ?,
          success_criteria = ?,
          unit_tests = ?,
          sync_status = 'enriched',
          updated_at = ?
        WHERE id = ?
      `).bind(
        enrichmentData.description || '',
        JSON.stringify(enrichmentData.tags || []),
        enrichmentData.priority || 3,
        enrichmentData.effort_estimate || 1,
        JSON.stringify(enrichmentData.dependencies || []),
        JSON.stringify(enrichmentData.assignees || []),
        JSON.stringify(enrichmentData.success_criteria || []),
        JSON.stringify(enrichmentData.unit_tests || []),
        new Date().toISOString(),
        taskId
      ).run();

      logger.info(`📝 Updated staged task ${taskId} with enriched data`);

    } catch (error) {
      logger.error(`Failed to update staged task ${taskId}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Promote task to project_tasks
   */
  async promoteTask(task: StagingTask): Promise<void> {
    try {
      const projectTask: ProjectTask = {
        id: generateUUID(),
        clickup_task_id: task.clickup_task_id,
        project_id: task.project_id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assignees: task.assignees || [],
        tags: task.tags || [],
        due_date: task.due_date,
        enriched_data: JSON.stringify({
          unit_tests: task.unit_tests || [],
          effort_estimate: task.effort_estimate || 1,
          dependencies: task.dependencies || [],
          success_criteria: task.success_criteria || [],
          ai_metadata: {
            promoted_at: new Date().toISOString(),
            review_agent: 'ReviewAgent'
          }
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.env.DB.prepare(`
        INSERT INTO project_tasks (
          id, clickup_task_id, project_id, title, description, status, priority,
          assignees, tags, due_date, enriched_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectTask.id,
        projectTask.clickup_task_id,
        projectTask.project_id,
        projectTask.title,
        projectTask.description,
        projectTask.status,
        projectTask.priority,
        JSON.stringify(projectTask.assignees),
        JSON.stringify(projectTask.tags),
        projectTask.due_date,
        projectTask.enriched_data,
        projectTask.created_at,
        projectTask.updated_at
      ).run();

      logger.info(`🚀 Promoted task ${task.id} to project_tasks`);

    } catch (error) {
      logger.error(`Failed to promote task ${task.id}:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Mark staged task as inactive
   */
  async markStagedTaskInactive(taskId: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        UPDATE staging_tasks 
        SET sync_status = 'promoted', updated_at = ?
        WHERE id = ?
      `).bind(
        new Date().toISOString(),
        taskId
      ).run();

      logger.info(`🏁 Marked staged task ${taskId} as promoted`);

    } catch (error) {
      logger.error(`Failed to mark staged task ${taskId} as inactive:`, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Health check for the review agent
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check database connectivity
      const result = await this.env.DB.prepare('SELECT COUNT(*) as count FROM staging_tasks WHERE sync_status = "pending"').first();
      return result !== null;
    } catch (error) {
      logger.error('ReviewAgent health check failed:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
} 