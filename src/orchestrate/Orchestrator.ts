/**
 * Orchestrator
 * 
 * Main orchestration class that handles routing and delegates to AgentManager.
 * Manages the flow of tasks through the AI-enriched, multi-agent planner system.
 */

import { AgentManager } from './AgentManager';
import { logger } from '../utils/logger';
import { generateUUID } from '../utils/uuid';
import { OrchestrationRequest, AgentContext } from '../types';

export interface OrchestrationResponse {
  success: boolean;
  flowId: string;
  result?: any;
  error?: string;
  processingTime: number;
  timestamp: string;
}

export class Orchestrator {
  private agentManager: AgentManager;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.agentManager = new AgentManager(env);
  }

  /**
   * Main request handler for orchestration routes
   */
  async handleRequest(request: Request): Promise<Response> {
    const startTime = Date.now();
    const flowId = this.generateFlowId();

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      logger.info('🎯 Orchestrator: Processing request', {
        flowId,
        path,
        method: request.method
      });

      // Parse request body for POST requests
      let orchestrationRequest: OrchestrationRequest = {
        flowName: 'unknown',
        taskId: undefined,
        config: {},
        metadata: {}
      };

      if (request.method === 'POST') {
        try {
          const body: any = await request.json();
          orchestrationRequest = {
            flowName: body.flowName || body.action || 'unknown',
            taskId: body.taskId,
            config: body.config || {},
            metadata: body.metadata || {}
          };
        } catch (error) {
          logger.error('Failed to parse request body:', error instanceof Error ? error : new Error(String(error)));
          return this.createErrorResponse('Invalid request body', 400, flowId, startTime);
        }
      }

      // Route to appropriate handler
      let result: any;
      
      if (path === '/orchestrate/sync') {
        result = await this.handleSync(orchestrationRequest, flowId);
      } else if (path === '/orchestrate/new-project') {
        result = await this.handleNewProject(orchestrationRequest, flowId);
      } else if (path === '/orchestrate/review-staged-tasks') {
        result = await this.handleReviewStagedTasks(orchestrationRequest, flowId);
      } else if (path === '/orchestrate/enrich-task') {
        result = await this.handleEnrichTask(orchestrationRequest, flowId);
      } else if (path === '/orchestrate/webhook') {
        result = await this.handleWebhook(orchestrationRequest, flowId);
      } else {
        return this.createErrorResponse('Invalid orchestration route', 404, flowId, startTime);
      }

      // Log successful operation
      await this.logOperation(flowId, orchestrationRequest.flowName, 'completed', {
        processingTime: Date.now() - startTime,
        result: result
      });

      return this.createSuccessResponse(result, flowId, startTime);

    } catch (error) {
      logger.error('Orchestrator error:', error instanceof Error ? error : new Error(String(error)));
      
      // Log failed operation
      await this.logOperation(flowId, 'unknown', 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500,
        flowId,
        startTime
      );
    }
  }

  /**
   * Handle synchronization requests
   */
  async handleSync(request: OrchestrationRequest, flowId: string): Promise<any> {
    logger.info('🔄 Orchestrator: Starting sync operation', { flowId });

    const result = await this.agentManager.executeFlow('sync', request);
    
    // Log sync operation
    await this.logSyncOperation(flowId, result);

    return result;
  }

  /**
   * Handle new project creation
   */
  async handleNewProject(request: OrchestrationRequest, flowId: string): Promise<any> {
    logger.info('🆕 Orchestrator: Starting new project creation', { flowId });

    const result = await this.agentManager.executeFlow('newProject', request);
    
    return result;
  }

  /**
   * Handle review of staged tasks
   */
  async handleReviewStagedTasks(request: OrchestrationRequest, flowId: string): Promise<any> {
    logger.info('🔍 Orchestrator: Starting staged tasks review', { flowId });

    const result = await this.agentManager.executeFlow('reviewStagedTasks', request);
    
    return result;
  }

  /**
   * Handle task enrichment
   */
  async handleEnrichTask(request: OrchestrationRequest, flowId: string): Promise<any> {
    logger.info('🧠 Orchestrator: Starting task enrichment', { flowId });

    const result = await this.agentManager.executeFlow('enrichTask', request);
    
    return result;
  }

  /**
   * Handle webhook processing
   */
  async handleWebhook(request: OrchestrationRequest, flowId: string): Promise<any> {
    logger.info('📥 Orchestrator: Processing webhook', { flowId });

    // Determine webhook type and route accordingly
    const webhookData = request.metadata;
    const eventType = webhookData?.event || 'unknown';

    let result: any;

    switch (eventType) {
      case 'taskCreated':
        result = await this.agentManager.executeFlow('webhookTaskCreated', request);
        break;
      case 'taskUpdated':
        result = await this.agentManager.executeFlow('webhookTaskUpdated', request);
        break;
      case 'projectCreated':
        result = await this.agentManager.executeFlow('webhookProjectCreated', request);
        break;
      default:
        result = await this.agentManager.executeFlow('webhookGeneric', request);
    }

    return result;
  }

  /**
   * AI Task Enrichment Stub
   * This will be replaced with actual AI integration later
   */
  async enrichTask(task: any, config: any = {}): Promise<any> {
    logger.info('🧠 Enriching task with AI', { taskId: task.id });

    // Mock AI enrichment - replace with actual AI calls later
    const enrichedData = {
      description: task.description || `Autogenerated description for: ${task.title}`,
      unit_tests: [
        `should complete ${task.title} successfully`,
        `should handle errors gracefully`,
        `should sync to ClickUp properly`
      ],
      tags: task.tags || ['ai-enriched', 'auto-generated'],
      priority: task.priority || 3,
      effort_estimate: Math.floor(Math.random() * 8) + 1, // 1-8 hours
      dependencies: [],
      assignees: task.assignees || [],
      success_criteria: [
        `Task "${task.title}" is completed`,
        `All acceptance criteria are met`,
        `Code is reviewed and approved`
      ],
      confidence_score: 0.85 + (Math.random() * 0.15), // 0.85-1.0
      ai_metadata: {
        enriched_at: new Date().toISOString(),
        model_used: 'mock-ai-model',
        enrichment_version: '1.0.0'
      }
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    logger.info('✅ Task enrichment completed', {
      taskId: task.id,
      confidenceScore: enrichedData.confidence_score
    });

    return enrichedData;
  }

  /**
   * Generate unique flow ID
   */
  generateFlowId(): string {
    return `flow_${Date.now()}_${generateUUID().substring(0, 8)}`;
  }

  /**
   * Log operation to agent_status table
   */
  async logOperation(flowId: string, action: string, state: string, metadata: any): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT OR REPLACE INTO agent_status (
          flow_id, step_name, state, metadata, updated_at
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        flowId,
        action,
        state,
        JSON.stringify(metadata),
        new Date().toISOString()
      ).run();

      logger.info('📊 Operation logged', { flowId, action, state });
    } catch (error) {
      logger.error('Failed to log operation:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Log sync operation to sync_log table
   */
  async logSyncOperation(flowId: string, result: any): Promise<void> {
    try {
      const summary = {
        flowId,
        success: result.success,
        projectsSynced: result.data?.projectsSynced || 0,
        tasksSynced: result.data?.tasksSynced || 0,
        errors: result.data?.errors || [],
        processingTime: result.metadata?.processingTime || 0
      };

      await this.env.DB.prepare(`
        INSERT INTO sync_log (
          timestamp, summary, success
        ) VALUES (?, ?, ?)
      `).bind(
        new Date().toISOString(),
        JSON.stringify(summary),
        result.success
      ).run();

      logger.info('📊 Sync operation logged', summary);
    } catch (error) {
      logger.error('Failed to log sync operation:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create success response
   */
  private createSuccessResponse(result: any, flowId: string, startTime: number): Response {
    const response: OrchestrationResponse = {
      success: true,
      flowId,
      result,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(error: string, status: number, flowId: string, startTime: number): Response {
    const response: OrchestrationResponse = {
      success: false,
      flowId,
      error,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Health check for the orchestrator
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Check if agent manager is healthy
      const agentManagerHealthy = await this.agentManager.healthCheck();
      
      // Check database connectivity
      const dbCheck = await this.env.DB.prepare('SELECT 1').run();
      
      return agentManagerHealthy && dbCheck !== null;
    } catch (error) {
      logger.error('Orchestrator health check failed:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
} 