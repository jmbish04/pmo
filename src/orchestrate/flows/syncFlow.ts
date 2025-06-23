/**
 * Sync Flow
 * 
 * This flow defines the orchestration steps for synchronizing data
 * between the local system and ClickUp. It coordinates between
 * different agents to:
 * 
 * 1. Fetch current state from ClickUp
 * 2. Compare with local state
 * 3. Generate sync operations
 * 4. Apply changes to ClickUp
 * 5. Audit the sync results
 */

import { FlowStep } from '../types';

export const syncFlow: FlowStep[] = [
  {
    id: 'sync_fetch',
    name: 'Fetch Current State',
    agent: 'sync',
    config: {
      fetchProjects: true,
      fetchTasks: true,
      fetchSubtasks: true,
      includeArchived: false
    },
    retries: 3,
    timeout: 30000
  },
  {
    id: 'ai_analysis',
    name: 'Analyze Sync Requirements',
    agent: 'ai',
    config: {
      model: 'gemini',
      promptType: 'sync_analysis',
      compareStates: true,
      generateOperations: true
    },
    retries: 2,
    timeout: 45000
  },
  {
    id: 'guardrails_validate',
    name: 'Validate Sync Operations',
    agent: 'guardrails',
    config: {
      validateOperations: true,
      checkConflicts: true,
      enforcePolicies: true
    },
    retries: 1,
    timeout: 20000
  },
  {
    id: 'sync_apply',
    name: 'Apply Sync Operations',
    agent: 'sync',
    config: {
      applyChanges: true,
      batchSize: 50,
      retryFailed: true
    },
    retries: 3,
    timeout: 60000
  },
  {
    id: 'audit_sync',
    name: 'Audit Sync Results',
    agent: 'audit',
    config: {
      validateSync: true,
      logOperations: true,
      generateReport: true
    },
    retries: 1,
    timeout: 25000
  }
]; 