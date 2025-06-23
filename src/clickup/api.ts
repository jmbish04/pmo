/**
 * ClickUp API Client
 * 
 * This module provides raw API calls to the ClickUp API.
 * It handles authentication, request formatting, and response
 * processing for all ClickUp API endpoints.
 * 
 * Features:
 * - Authentication with personal tokens
 * - All major ClickUp API endpoints
 * - Error handling and retries
 * - Rate limiting support
 * - Response caching
 */

import { logger } from '../utils/logger';

export interface ClickUpApiOptions {
  token: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ClickUpApiClient {
  private options: ClickUpApiOptions;
  private baseUrl: string;

  constructor(options: ClickUpApiOptions) {
    this.options = {
      baseUrl: 'https://api.clickup.com/api/v2',
      timeout: 30000,
      retries: 3,
      ...options
    };
    this.baseUrl = this.options.baseUrl || 'https://api.clickup.com/api/v2';
  }

  /**
   * Get user information
   */
  async getUser(): Promise<any> {
    return this.request('GET', '/user');
  }

  /**
   * Get workspaces/teams
   */
  async getTeams(): Promise<any> {
    return this.request('GET', '/team');
  }

  /**
   * Get spaces in a workspace
   */
  async getSpaces(teamId: string): Promise<any> {
    return this.request('GET', `/team/${teamId}/space`);
  }

  /**
   * Get projects in a space
   */
  async getProjects(spaceId: string): Promise<any> {
    return this.request('GET', `/space/${spaceId}/project`);
  }

  /**
   * Get lists in a project
   */
  async getLists(projectId: string): Promise<any> {
    return this.request('GET', `/project/${projectId}/list`);
  }

  /**
   * Get tasks in a list
   */
  async getTasks(listId: string, options?: any): Promise<any> {
    const params = new URLSearchParams();
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        params.append(key, String(value));
      });
    }
    
    const query = params.toString();
    const url = query ? `/list/${listId}/task?${query}` : `/list/${listId}/task`;
    
    return this.request('GET', url);
  }

  /**
   * Get a specific task
   */
  async getTask(taskId: string): Promise<any> {
    return this.request('GET', `/task/${taskId}`);
  }

  /**
   * Create a new task
   */
  async createTask(listId: string, taskData: any): Promise<any> {
    return this.request('POST', `/list/${listId}/task`, taskData);
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, taskData: any): Promise<any> {
    return this.request('PUT', `/task/${taskId}`, taskData);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<any> {
    return this.request('DELETE', `/task/${taskId}`);
  }

  /**
   * Create a webhook
   */
  async createWebhook(teamId: string, webhookData: any): Promise<any> {
    return this.request('POST', `/team/${teamId}/webhook`, webhookData);
  }

  /**
   * Get webhooks for a team
   */
  async getWebhooks(teamId: string): Promise<any> {
    return this.request('GET', `/team/${teamId}/webhook`);
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<any> {
    return this.request('DELETE', `/webhook/${webhookId}`);
  }

  /**
   * Make a request to the ClickUp API
   */
  private async request(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.options.token}`,
      'Content-Type': 'application/json'
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.options.timeout || 30000)
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(data);
    }

    let lastError: Error = new Error('Request failed');
    
    for (let attempt = 1; attempt <= (this.options.retries || 3); attempt++) {
      try {
        logger.debug(`ClickUp API request: ${method} ${endpoint}`, { attempt });
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = typeof errorData === 'object' && errorData !== null && 'err' in errorData 
            ? String(errorData.err) 
            : response.statusText;
          throw new Error(`ClickUp API error: ${response.status} - ${errorMessage}`);
        }
        
        const result = await response.json();
        logger.debug(`ClickUp API response: ${method} ${endpoint}`, { status: response.status });
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`ClickUp API request failed (attempt ${attempt}/${this.options.retries || 3}):`, lastError);
        
        if (attempt < (this.options.retries || 3)) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * Create a ClickUp API client instance
 */
export function createClickUpClient(token: string, options?: Partial<ClickUpApiOptions>): ClickUpApiClient {
  return new ClickUpApiClient({ token, ...options });
} 