/**
 * Core Orchestrator Class
 * 
 * This is the main orchestrator that manages the flow of operations
 * between different agents in the ClickUp Planner Worker system.
 * 
 * Responsibilities:
 * - Routes requests to appropriate agents
 * - Manages agent lifecycle and state
 * - Coordinates multi-step workflows
 * - Handles error recovery and retries
 * - Provides unified interface for all orchestration operations
 */

import { AgentManager } from './AgentManager';
import type { AgentContext, FlowStep } from './types';
import type { OrchestrationRequest } from '../types';
import { logger } from '../utils/logger';

export class Orchestrate {
  private agentManager: AgentManager;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.agentManager = new AgentManager(env);
  }

  /**
   * Main request handler for orchestration endpoints
   */
  async handleRequest(request: Request, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // New project creation flow
      if (path === '/orchestrate/new-project' && request.method === 'POST') {
        return await this.handleNewProject(request, ctx);
      }

      // Sync flow
      if (path === '/orchestrate/sync' && request.method === 'POST') {
        return await this.handleSync(request, ctx);
      }

      // Get orchestration status
      if (path.startsWith('/orchestrate/status/') && request.method === 'GET') {
        const flowId = path.split('/').pop() || '';
        // getFlowStatus is not implemented in AgentManager, so return 501
        logger.error('getFlowStatus is not implemented in AgentManager.');
        return new Response(JSON.stringify({ error: 'Not implemented', flowId }), { status: 501, headers: { 'Content-Type': 'application/json' } });
        // If you implement getFlowStatus, replace the above with:
        // return await this.getFlowStatus(flowId);
      }

      return new Response('Orchestration endpoint not found', { status: 404 });

    } catch (error) {
      logger.error('Orchestrate error:', error instanceof Error ? error : new Error(String(error)));
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  /**
   * Handle new project creation workflow
   */
  private async handleNewProject(request: Request, ctx: ExecutionContext): Promise<Response> {
    const payload: OrchestrationRequest = { ...(await request.json() as any), flowName: 'newProject' };
    const context: AgentContext = {
      flowId: this.generateFlowId(),
      request: payload,
      env: this.env,
      metadata: {}
    };

    try {
      // Start the new project flow
      const result = await this.agentManager.executeFlow('newProject', context.request);
      
      return new Response(JSON.stringify({
        flowId: context.flowId,
        status: 'started',
        result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('New project flow error:', error instanceof Error ? error : new Error(String(error)));
      return new Response(JSON.stringify({
        error: 'Failed to start new project flow',
        details: error instanceof Error ? error.message : String(error)
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  /**
   * Handle sync workflow
   */
  private async handleSync(request: Request, ctx: ExecutionContext): Promise<Response> {
    const payload: OrchestrationRequest = { ...(await request.json() as any), flowName: 'sync' };
    const context: AgentContext = {
      flowId: this.generateFlowId(),
      request: payload,
      env: this.env,
      metadata: {}
    };

    try {
      // Start the sync flow
      const result = await this.agentManager.executeFlow('sync', context.request);
      
      return new Response(JSON.stringify({
        flowId: context.flowId,
        status: 'started',
        result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      logger.error('Sync flow error:', error instanceof Error ? error : new Error(String(error)));
      return new Response(JSON.stringify({
        error: 'Failed to start sync flow',
        details: error instanceof Error ? error.message : String(error)
      }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  /**
   * Generate a unique flow ID
   */
  private generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 