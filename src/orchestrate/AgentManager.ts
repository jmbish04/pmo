/**
 * Agent Manager
 * 
 * Manages the execution of orchestration flows and coordinates between agents.
 * Handles flow routing, context management, and result aggregation.
 */

import { logger } from '../utils/logger';
import { generateUUID } from '../utils/uuid';
import { EnrichmentAgent } from './agents/EnrichmentAgent';
import { ReviewAgent } from './agents/ReviewAgent';
import { ProjectAgent } from './agents/ProjectAgent';
import { TemplateAgent } from './agents/TemplateAgent';
import { 
  AgentContext, 
  OrchestrationRequest, 
  OrchestrationResult, 
  FlowConfig,
  AgentResult
} from '../types';

export class AgentManager {
  private env: any;
  private agents: Map<string, any>;
  private flows: Map<string, FlowConfig>;

  constructor(env: any) {
    this.env = env;
    this.agents = new Map();
    this.flows = new Map();
    this.initializeAgents();
    this.initializeFlows();
  }

  /**
   * Initialize all available agents
   */
  private initializeAgents(): void {
    this.agents.set('enrichment', new EnrichmentAgent(this.env));
    this.agents.set('review', new ReviewAgent(this.env));
    this.agents.set('project', new ProjectAgent(this.env));
    this.agents.set('template', new TemplateAgent(this.env));
    
    logger.info('🤖 Agents initialized', {
      count: this.agents.size,
      agents: Array.from(this.agents.keys())
    });
  }

  /**
   * Initialize orchestration flows
   */
  private initializeFlows(): void {
    // Sync flow
    this.flows.set('sync', {
      name: 'sync',
      agents: ['sync'],
      triggers: ['manual', 'scheduled'],
      enabled: true,
      steps: [
        { agent: 'sync', step: 'syncAllProjects' }
      ]
    });

    // Review staged tasks flow
    this.flows.set('reviewStagedTasks', {
      name: 'reviewStagedTasks',
      agents: ['review'],
      triggers: ['manual', 'scheduled'],
      enabled: true,
      steps: [
        { agent: 'review', step: 'reviewStagedTasks' }
      ]
    });

    // Enrich task flow
    this.flows.set('enrichTask', {
      name: 'enrichTask',
      agents: ['enrichment'],
      triggers: ['manual', 'task_created'],
      enabled: true,
      steps: [
        { agent: 'enrichment', step: 'enrichTask' }
      ]
    });

    // New project flow
    this.flows.set('newProject', {
      name: 'newProject',
      agents: ['template', 'project', 'review'],
      triggers: ['manual', 'project_created'],
      enabled: true,
      steps: [
        { agent: 'template', step: 'createProjectTemplate' },
        { agent: 'project', step: 'generateProjectStructure' },
        { agent: 'review', step: 'validateProject' }
      ]
    });

    logger.info('🔄 Flows initialized', {
      count: this.flows.size,
      flows: Array.from(this.flows.keys())
    });
  }

  /**
   * Execute a specific flow
   */
  async executeFlow(flowName: string, request: OrchestrationRequest): Promise<OrchestrationResult> {
    const flowId = generateUUID();
    const flow = this.flows.get(flowName);

    if (!flow) {
      throw new Error(`Flow '${flowName}' not found`);
    }

    logger.info('🚀 Executing flow', {
      flowId,
      flowName,
      stepCount: flow.steps?.length || 0
    });

    const context: AgentContext = {
      flowId,
      request,
      results: [],
      metadata: {
        startTime: new Date().toISOString(),
        flowName
      }
    };

    try {
      // Execute each step in the flow
      const steps = flow.steps || [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const agent = this.agents.get(step.agent);

        if (!agent) {
          throw new Error(`Agent '${step.agent}' not found for step ${i + 1}`);
        }

        logger.info('⚡ Executing step', {
          flowId,
          stepNumber: i + 1,
          agent: step.agent,
          method: step.step
        });

        // Execute the agent method
        const result = await agent[step.step](context);
        context.results.push(result);

        // Update context with result
        context.currentResult = result;
        context.stepIndex = i;
      }

      logger.info('✅ Flow completed successfully', {
        flowId,
        flowName,
        resultCount: context.results.length
      });

      return {
        success: true,
        flowId,
        results: context.results,
        metadata: {
          ...context.metadata,
          endTime: new Date().toISOString(),
          duration: Date.now() - new Date(context.metadata.startTime).getTime()
        }
      };

    } catch (error) {
      logger.error('❌ Flow execution failed', error instanceof Error ? error : new Error(String(error)));

      return {
        success: false,
        flowId,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: context.results,
        metadata: {
          ...context.metadata,
          endTime: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  /**
   * Get health status of all agents
   */
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const health: { [key: string]: boolean } = {};

    for (const [name, agent] of this.agents) {
      try {
        // Check if agent has a health check method
        if (typeof agent.healthCheck === 'function') {
          health[name] = await agent.healthCheck();
        } else {
          health[name] = true; // Assume healthy if no health check method
        }
      } catch (error) {
        logger.error(`Health check failed for agent ${name}:`, error instanceof Error ? error : new Error(String(error)));
        health[name] = false;
      }
    }

    return health;
  }

  /**
   * Handle new project creation
   */
  async handleNewProject(request: OrchestrationRequest): Promise<OrchestrationResult> {
    return this.executeFlow('newProject', request);
  }

  /**
   * Handle task enrichment
   */
  async handleEnrichTask(request: OrchestrationRequest): Promise<OrchestrationResult> {
    return this.executeFlow('enrichTask', request);
  }

  /**
   * Handle staged task review
   */
  async handleReviewStagedTasks(request: OrchestrationRequest): Promise<OrchestrationResult> {
    return this.executeFlow('reviewStagedTasks', request);
  }

  /**
   * Get available flows
   */
  getAvailableFlows(): string[] {
    return Array.from(this.flows.keys());
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }
} 