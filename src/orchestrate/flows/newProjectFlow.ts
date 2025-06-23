/**
 * New Project Flow
 * 
 * This flow defines the orchestration steps for creating a new project
 * in ClickUp. It coordinates between different agents to:
 * 
 * 1. Pull relevant templates from storage
 * 2. Generate project structure using AI
 * 3. Sync the project to ClickUp
 * 4. Audit the created project
 * 5. Apply guardrails and validation
 */

import { FlowStep } from '../types';

export const newProjectFlow: FlowStep[] = [
  {
    id: 'template_fetch',
    name: 'Fetch Project Templates',
    agent: 'template',
    config: {
      templateType: 'project',
      includeCustom: true
    },
    retries: 3,
    timeout: 30000
  },
  {
    id: 'ai_generation',
    name: 'Generate Project Structure',
    agent: 'ai',
    config: {
      model: 'gemini',
      promptType: 'project_creation',
      includeTasks: true,
      includeSubtasks: true
    },
    retries: 2,
    timeout: 60000
  },
  {
    id: 'guardrails_check',
    name: 'Apply Guardrails',
    agent: 'guardrails',
    config: {
      validateStructure: true,
      checkNaming: true,
      enforceStandards: true
    },
    retries: 1,
    timeout: 15000
  },
  {
    id: 'sync_clickup',
    name: 'Sync to ClickUp',
    agent: 'sync',
    config: {
      createProject: true,
      createTasks: true,
      createSubtasks: true
    },
    retries: 3,
    timeout: 45000
  },
  {
    id: 'audit_project',
    name: 'Audit Created Project',
    agent: 'audit',
    config: {
      validateCreation: true,
      logEvents: true,
      triggerNotifications: true
    },
    retries: 1,
    timeout: 20000
  }
]; 