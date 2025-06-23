/**
 * Shared Types for Orchestration System
 * 
 * This file contains all the shared types and interfaces used
 * throughout the orchestration system, including agent contexts,
 * flow definitions, and status tracking.
 */

import type { OrchestrationRequest } from '../types';

export interface AgentContext {
  flowId: string;
  request: OrchestrationRequest;
  env: any;
  metadata: Record<string, any>;
  step?: FlowStep;
  previousResult?: any;
}

export interface FlowStep {
  id: string;
  name: string;
  agent: string;
  config: Record<string, any>;
  retries?: number;
  timeout?: number;
}

export interface FlowStatus {
  flowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface AgentHealth {
  healthy: boolean;
  lastCheck: string;
  details?: Record<string, any>;
} 