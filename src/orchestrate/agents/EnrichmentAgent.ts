/**
 * Enrichment Agent
 * 
 * This agent enhances tasks with AI-generated content including:
 * - Default descriptions for tasks without them
 * - Unit test suggestions
 * - Priority estimation
 * - Effort estimation
 * - Tag suggestions
 * - Dependency detection
 */

import { AgentContext, EnrichmentResult, TaskStaging } from '../../types';
import { logger } from '../../utils/logger';

export interface EnrichmentAgentConfig {
  enableUnitTests?: boolean;
  enablePriorityEstimation?: boolean;
  enableEffortEstimation?: boolean;
  enableTagSuggestions?: boolean;
  enableDependencyDetection?: boolean;
}

export class EnrichmentAgent {
  private config: EnrichmentAgentConfig;

  constructor(config: EnrichmentAgentConfig = {}) {
    this.config = {
      enableUnitTests: true,
      enablePriorityEstimation: true,
      enableEffortEstimation: true,
      enableTagSuggestions: true,
      enableDependencyDetection: true,
      ...config
    };
  }

  /**
   * Main enrichment function that processes a task
   */
  async enrichTask(context: AgentContext): Promise<EnrichmentResult> {
    const startTime = Date.now();
    
    try {
      logger.info('🎯 EnrichmentAgent: Starting task enrichment', {
        taskId: context.request.taskId,
        flowId: context.flowId
      });

      // Get task from the request metadata or use a default task structure
      const taskData = context.request.metadata?.taskData || context.request.metadata?.task;
      if (!taskData) {
        throw new Error('No task data provided in context');
      }

      // Perform enrichment steps
      const enrichedTask = await this.performEnrichment(taskData, context);

      // Calculate confidence score based on enrichment quality
      const confidenceScore = this.calculateConfidenceScore(enrichedTask, taskData);

      const processingTime = Date.now() - startTime;

      const result: EnrichmentResult = {
        uuid: taskData.uuid || taskData.id || 'unknown',
        enriched_task: enrichedTask,
        confidence_score: confidenceScore,
        processing_time: processingTime
      };

      logger.info('✅ EnrichmentAgent: Task enrichment completed', {
        taskId: taskData.uuid || taskData.id,
        confidenceScore,
        processingTime
      });

      return result;

    } catch (error) {
      logger.error('EnrichmentAgent execution error:', error instanceof Error ? error : new Error(String(error)));
      return {
        uuid: '',
        enriched_task: {
          title: '',
          description: '',
          priority: 0,
          tags: [],
        },
        confidence_score: 0,
        processing_time: 0,
        // Indicate failure
        // Optionally, you can add a custom error property if needed
      };
    }
  }

  /**
   * Perform the actual enrichment steps
   */
  private async performEnrichment(task: TaskStaging, context: AgentContext) {
    const enrichedTask = {
      title: task.title,
      description: task.description || 'No description provided',
      priority: 3, // Default medium priority
      estimated_hours: 2, // Default 2 hours
      dependencies: [] as string[],
      assignee_suggestions: [] as string[],
      tags: [...(task.tags || [])],
      unit_tests: [] as string[]
    };

    // Step 1: Enhance description if missing
    if (!enrichedTask.description || enrichedTask.description.trim() === '') {
      enrichedTask.description = this.generateDefaultDescription(task.title);
    }

    // Step 2: Add unit tests if enabled
    if (this.config.enableUnitTests) {
      enrichedTask.unit_tests = this.generateUnitTests(task.title, enrichedTask.description);
    }

    // Step 3: Estimate priority if enabled
    if (this.config.enablePriorityEstimation) {
      enrichedTask.priority = this.estimatePriority(task.title, enrichedTask.description);
    }

    // Step 4: Estimate effort if enabled
    if (this.config.enableEffortEstimation) {
      enrichedTask.estimated_hours = this.estimateEffort(task.title, enrichedTask.description);
    }

    // Step 5: Suggest tags if enabled
    if (this.config.enableTagSuggestions) {
      const suggestedTags = this.suggestTags(task.title, enrichedTask.description);
      enrichedTask.tags = [...new Set([...enrichedTask.tags, ...suggestedTags])];
    }

    // Step 6: Detect dependencies if enabled
    if (this.config.enableDependencyDetection) {
      enrichedTask.dependencies = this.detectDependencies(task.title, enrichedTask.description);
    }

    // Step 7: Suggest assignees
    enrichedTask.assignee_suggestions = this.suggestAssignees(task.title, enrichedTask.description, enrichedTask.tags);

    return enrichedTask;
  }

  /**
   * Generate a default description based on task title
   */
  private generateDefaultDescription(title: string): string {
    const titleLower = title.toLowerCase();
    
    // Simple rule-based description generation
    if (titleLower.includes('implement') || titleLower.includes('create')) {
      return `Implement the ${title.toLowerCase().replace('implement ', '').replace('create ', '')} functionality according to project requirements.`;
    }
    
    if (titleLower.includes('test') || titleLower.includes('testing')) {
      return `Create comprehensive tests for ${title.toLowerCase().replace('test ', '').replace('testing ', '')} to ensure quality and reliability.`;
    }
    
    if (titleLower.includes('fix') || titleLower.includes('bug')) {
      return `Investigate and resolve the issue described in the task title. Ensure the fix is properly tested and documented.`;
    }
    
    if (titleLower.includes('design') || titleLower.includes('ui')) {
      return `Design and create the user interface components for ${title.toLowerCase().replace('design ', '').replace('ui ', '')}.`;
    }
    
    if (titleLower.includes('deploy') || titleLower.includes('release')) {
      return `Prepare and execute the deployment process for ${title.toLowerCase().replace('deploy ', '').replace('release ', '')}.`;
    }
    
    // Default description
    return `Complete the task: ${title}. Ensure all requirements are met and the implementation follows project standards.`;
  }

  /**
   * Generate unit tests for the task
   */
  private generateUnitTests(title: string, description: string): string[] {
    const tests = [
      "should pass basic validation",
      "should link to valid project"
    ];

    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();

    // Add specific tests based on task type
    if (titleLower.includes('api') || descLower.includes('api')) {
      tests.push("should return correct HTTP status codes");
      tests.push("should handle error cases gracefully");
    }

    if (titleLower.includes('auth') || descLower.includes('authentication')) {
      tests.push("should validate user credentials");
      tests.push("should handle unauthorized access");
    }

    if (titleLower.includes('database') || descLower.includes('database')) {
      tests.push("should maintain data integrity");
      tests.push("should handle database connection errors");
    }

    if (titleLower.includes('ui') || titleLower.includes('frontend')) {
      tests.push("should render correctly on different screen sizes");
      tests.push("should handle user interactions properly");
    }

    if (titleLower.includes('test') || titleLower.includes('testing')) {
      tests.push("should have adequate test coverage");
      tests.push("should run within acceptable time limits");
    }

    return tests;
  }

  /**
   * Estimate task priority (1-5, where 1 is highest)
   */
  private estimatePriority(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    
    // High priority indicators
    if (text.includes('urgent') || text.includes('critical') || text.includes('blocker')) {
      return 1;
    }
    
    if (text.includes('bug') || text.includes('fix') || text.includes('error')) {
      return 2;
    }
    
    if (text.includes('security') || text.includes('auth')) {
      return 2;
    }
    
    // Medium priority indicators
    if (text.includes('feature') || text.includes('implement')) {
      return 3;
    }
    
    if (text.includes('test') || text.includes('documentation')) {
      return 4;
    }
    
    // Low priority indicators
    if (text.includes('nice to have') || text.includes('optional')) {
      return 5;
    }
    
    // Default medium priority
    return 3;
  }

  /**
   * Estimate effort in hours
   */
  private estimateEffort(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();
    
    // Simple rule-based estimation
    if (text.includes('simple') || text.includes('quick') || text.includes('minor')) {
      return 1;
    }
    
    if (text.includes('complex') || text.includes('major') || text.includes('refactor')) {
      return 8;
    }
    
    if (text.includes('api') || text.includes('integration')) {
      return 4;
    }
    
    if (text.includes('ui') || text.includes('design')) {
      return 3;
    }
    
    if (text.includes('test') || text.includes('documentation')) {
      return 2;
    }
    
    // Default 2 hours
    return 2;
  }

  /**
   * Suggest relevant tags
   */
  private suggestTags(title: string, description: string): string[] {
    const tags: string[] = [];
    const text = `${title} ${description}`.toLowerCase();
    
    // Technology tags
    if (text.includes('api') || text.includes('rest')) tags.push('api');
    if (text.includes('frontend') || text.includes('ui') || text.includes('react')) tags.push('frontend');
    if (text.includes('backend') || text.includes('server')) tags.push('backend');
    if (text.includes('database') || text.includes('sql')) tags.push('database');
    if (text.includes('auth') || text.includes('security')) tags.push('security');
    if (text.includes('test') || text.includes('testing')) tags.push('testing');
    if (text.includes('deploy') || text.includes('ci/cd')) tags.push('devops');
    if (text.includes('bug') || text.includes('fix')) tags.push('bugfix');
    
    // Priority tags
    if (text.includes('urgent') || text.includes('critical')) tags.push('high-priority');
    if (text.includes('nice to have')) tags.push('low-priority');
    
    // Type tags
    if (text.includes('feature')) tags.push('feature');
    if (text.includes('documentation')) tags.push('documentation');
    if (text.includes('refactor')) tags.push('refactor');
    
    return tags;
  }

  /**
   * Detect task dependencies
   */
  private detectDependencies(title: string, description: string): string[] {
    const dependencies: string[] = [];
    const text = `${title} ${description}`.toLowerCase();
    
    // Simple dependency detection based on keywords
    if (text.includes('depends on') || text.includes('requires')) {
      // Extract dependency information (simplified)
      dependencies.push('dependency-1');
    }
    
    if (text.includes('after') || text.includes('following')) {
      dependencies.push('prerequisite-task');
    }
    
    return dependencies;
  }

  /**
   * Suggest assignees based on task content
   */
  private suggestAssignees(title: string, description: string, tags: string[]): string[] {
    const suggestions: string[] = [];
    const text = `${title} ${description}`.toLowerCase();
    
    // Role-based suggestions
    if (text.includes('frontend') || text.includes('ui') || tags.includes('frontend')) {
      suggestions.push('frontend-developer');
    }
    
    if (text.includes('backend') || text.includes('api') || tags.includes('backend')) {
      suggestions.push('backend-developer');
    }
    
    if (text.includes('database') || text.includes('sql') || tags.includes('database')) {
      suggestions.push('database-admin');
    }
    
    if (text.includes('security') || text.includes('auth') || tags.includes('security')) {
      suggestions.push('security-engineer');
    }
    
    if (text.includes('test') || text.includes('testing') || tags.includes('testing')) {
      suggestions.push('qa-engineer');
    }
    
    if (text.includes('deploy') || text.includes('devops') || tags.includes('devops')) {
      suggestions.push('devops-engineer');
    }
    
    // Default suggestion if no specific role detected
    if (suggestions.length === 0) {
      suggestions.push('full-stack-developer');
    }
    
    return suggestions;
  }

  /**
   * Calculate confidence score for the enrichment
   */
  private calculateConfidenceScore(enrichedTask: any, originalTask: TaskStaging): number {
    let score = 0.5; // Base score
    
    // Boost score for good description generation
    if (enrichedTask.description && enrichedTask.description.length > 50) {
      score += 0.2;
    }
    
    // Boost score for relevant unit tests
    if (enrichedTask.unit_tests && enrichedTask.unit_tests.length >= 2) {
      score += 0.1;
    }
    
    // Boost score for relevant tags
    if (enrichedTask.tags && enrichedTask.tags.length > 0) {
      score += 0.1;
    }
    
    // Boost score for reasonable effort estimation
    if (enrichedTask.estimated_hours && enrichedTask.estimated_hours > 0) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
}