/**
 * Documentation Handler
 * 
 * This module handles documentation delivery from R2 storage and
 * AI agent assignment requests. It serves JSON content for different
 * documentation sections and manages the assignment of AI bots to
 * write missing content.
 * 
 * Features:
 * - Serve JSON documentation from R2 bucket
 * - Handle missing content gracefully
 * - AI agent assignment requests
 * - Caching headers for performance
 * - Error handling and logging
 */

import { logger, toError } from '../utils/logger';

export interface DocsResponse {
  status: 'found' | 'not_found' | 'error';
  content?: any;
  message?: string;
  timestamp: string;
}

export interface AssignAgentRequest {
  section: string;
  priority?: 'low' | 'medium' | 'high';
  requirements?: string[];
}

export interface AssignAgentResponse {
  status: 'queued' | 'error';
  requestId: string;
  message: string;
  timestamp: string;
}

/**
 * Handle documentation section requests
 */
export async function handleDocsRequest(
  section: string, 
  env: any, 
  ctx: ExecutionContext
): Promise<Response> {
  try {
    logger.info(`Documentation request for section: ${section}`);

    // Validate section name
    if (!isValidSectionName(section)) {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid section name',
        timestamp: new Date().toISOString()
      } as DocsResponse), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Construct the R2 object key
    const objectKey = `${section}.json`;
    
    // Try to fetch the object from R2
    const object = await env.DOCS_BUCKET.get(objectKey);
    
    if (!object) {
      logger.info(`Documentation not found for section: ${section}`);
      
      return new Response(JSON.stringify({
        status: 'not_found',
        message: 'Documentation section not found',
        timestamp: new Date().toISOString()
      } as DocsResponse), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Parse the JSON content
    const content = await object.json();
    
    logger.info(`Documentation served for section: ${section}`);

    return new Response(JSON.stringify({
      status: 'found',
      content,
      timestamp: new Date().toISOString()
    } as DocsResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        'ETag': `"${object.etag}"`,
        'Last-Modified': object.uploaded.toUTCString()
      }
    });

  } catch (error) {
    logger.error(`Error serving documentation for section ${section}:`, toError(error));
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    } as DocsResponse), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * Handle AI agent assignment requests
 */
export async function handleAssignAgent(
  request: Request, 
  env: any, 
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const body: AssignAgentRequest = await request.json();
    
    logger.info('AI agent assignment request received', { section: body.section });

    // Validate request
    if (!body.section || !isValidSectionName(body.section)) {
      return new Response(JSON.stringify({
        status: 'error',
        requestId: '',
        message: 'Invalid section name',
        timestamp: new Date().toISOString()
      } as AssignAgentResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a unique request ID
    const requestId = generateRequestId();
    
    // Store the assignment request (for now, just log it)
    await storeAssignmentRequest(requestId, body, env);
    
    logger.info(`AI agent assignment queued`, { 
      requestId, 
      section: body.section,
      priority: body.priority 
    });

    return new Response(JSON.stringify({
      status: 'queued',
      requestId,
      message: `AI agent assigned to write documentation for section: ${body.section}`,
      timestamp: new Date().toISOString()
    } as AssignAgentResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('Error handling AI agent assignment:', toError(error));
    
    return new Response(JSON.stringify({
      status: 'error',
      requestId: '',
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    } as AssignAgentResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Validate section name
 */
function isValidSectionName(section: string): boolean {
  // Allow alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(section) && section.length > 0 && section.length <= 50;
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store assignment request (stub implementation)
 */
async function storeAssignmentRequest(
  requestId: string, 
  request: AssignAgentRequest, 
  env: any
): Promise<void> {
  try {
    // TODO: Implement actual storage logic
    // This could store in D1 database, KV, or queue for processing
    
    const assignmentData = {
      requestId,
      section: request.section,
      priority: request.priority || 'medium',
      requirements: request.requirements || [],
      status: 'queued',
      createdAt: new Date().toISOString()
    };

    // For now, just log the assignment
    logger.info('Assignment request stored', assignmentData);
    
    // TODO: Add to actual storage system
    // await env.DB.prepare('INSERT INTO ai_assignments (request_id, section, priority, requirements, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    //   .bind(requestId, request.section, request.priority, JSON.stringify(request.requirements), 'queued', new Date().toISOString())
    //   .run();
    
  } catch (error) {
    logger.error('Failed to store assignment request:', toError(error));
    throw error;
  }
} 