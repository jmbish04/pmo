/**
 * AI Prompts for Task Generation
 * 
 * This module contains all the prompts used by AI agents for generating
 * project structures, tasks, and other AI-powered content. It includes
 * prompt templates and dynamic prompt generation.
 * 
 * Features:
 * - Project creation prompts
 * - Task generation prompts
 * - Sync analysis prompts
 * - Dynamic prompt building
 * - Prompt versioning
 */

export interface PromptContext {
  projectType?: string;
  teamSize?: number;
  timeline?: string;
  requirements?: string[];
  constraints?: string[];
  existingData?: any;
}

export interface PromptTemplate {
  id: string;
  version: string;
  template: string;
  variables: string[];
  description: string;
}

/**
 * Project creation prompt
 */
export const PROJECT_CREATION_PROMPT: PromptTemplate = {
  id: 'project_creation',
  version: '1.0',
  template: `You are an expert project manager and software architect. Create a comprehensive project structure for a {projectType} project.

Project Details:
- Project Type: {projectType}
- Team Size: {teamSize} people
- Timeline: {timeline}
- Requirements: {requirements}
- Constraints: {constraints}

Please create a detailed project structure including:
1. Project phases and milestones
2. Task breakdown with dependencies
3. Resource allocation
4. Risk assessment
5. Quality assurance steps

Format the response as a structured JSON object with the following schema:
{
  "project": {
    "name": "string",
    "description": "string",
    "phases": [
      {
        "name": "string",
        "duration": "string",
        "tasks": [
          {
            "name": "string",
            "description": "string",
            "assignee": "string",
            "priority": "high|medium|low",
            "estimatedHours": "number",
            "dependencies": ["task_id"],
            "subtasks": []
          }
        ]
      }
    ]
  }
}`,
  variables: ['projectType', 'teamSize', 'timeline', 'requirements', 'constraints'],
  description: 'Generates a complete project structure with tasks and dependencies'
};

/**
 * Task generation prompt
 */
export const TASK_GENERATION_PROMPT: PromptTemplate = {
  id: 'task_generation',
  version: '1.0',
  template: `Generate detailed tasks for the following project phase:

Phase: {phaseName}
Description: {phaseDescription}
Duration: {phaseDuration}
Team Members: {teamMembers}

Requirements:
{requirements}

Generate tasks that are:
- Specific and actionable
- Properly sized (1-3 days each)
- Include acceptance criteria
- Have clear dependencies
- Assign appropriate team members

Format as JSON:
{
  "tasks": [
    {
      "name": "string",
      "description": "string",
      "acceptanceCriteria": ["string"],
      "assignee": "string",
      "priority": "high|medium|low",
      "estimatedHours": "number",
      "dependencies": ["task_name"],
      "tags": ["string"]
    }
  ]
}`,
  variables: ['phaseName', 'phaseDescription', 'phaseDuration', 'teamMembers', 'requirements'],
  description: 'Generates detailed tasks for a specific project phase'
};

/**
 * Sync analysis prompt
 */
export const SYNC_ANALYSIS_PROMPT: PromptTemplate = {
  id: 'sync_analysis',
  version: '1.0',
  template: `Analyze the synchronization requirements between local and remote project data.

Local Data:
{localData}

Remote Data (ClickUp):
{remoteData}

Last Sync: {lastSyncTime}

Please analyze:
1. What has changed since the last sync
2. Conflicts that need resolution
3. New items to be created
4. Items to be updated
5. Items to be deleted

Provide recommendations for:
- Sync operations to perform
- Conflict resolution strategies
- Priority order for operations

Format as JSON:
{
  "analysis": {
    "changes": {
      "created": ["item_ids"],
      "updated": ["item_ids"],
      "deleted": ["item_ids"]
    },
    "conflicts": [
      {
        "itemId": "string",
        "type": "update|delete",
        "localValue": "any",
        "remoteValue": "any",
        "recommendation": "string"
      }
    ],
    "operations": [
      {
        "type": "create|update|delete",
        "itemId": "string",
        "data": "any",
        "priority": "high|medium|low"
      }
    ]
  }
}`,
  variables: ['localData', 'remoteData', 'lastSyncTime'],
  description: 'Analyzes sync requirements and generates operation recommendations'
};

/**
 * Quality assurance prompt
 */
export const QA_PROMPT: PromptTemplate = {
  id: 'quality_assurance',
  version: '1.0',
  template: `Review the following project structure for quality and completeness:

Project Structure:
{projectStructure}

Quality Checklist:
- Are all requirements addressed?
- Are tasks properly sized and scoped?
- Are dependencies correctly identified?
- Is resource allocation appropriate?
- Are risks properly identified and mitigated?
- Are acceptance criteria clear and measurable?

Please provide:
1. Quality score (1-10)
2. Issues found
3. Recommendations for improvement
4. Missing elements

Format as JSON:
{
  "qualityScore": "number",
  "issues": [
    {
      "type": "string",
      "description": "string",
      "severity": "high|medium|low",
      "recommendation": "string"
    }
  ],
  "recommendations": ["string"],
  "missingElements": ["string"]
}`,
  variables: ['projectStructure'],
  description: 'Reviews project structure for quality and completeness'
};

/**
 * Build a prompt from template and context
 */
export function buildPrompt(template: PromptTemplate, context: PromptContext): string {
  let prompt = template.template;
  
  // Replace variables with context values
  template.variables.forEach(variable => {
    const value = context[variable as keyof PromptContext];
    const placeholder = `{${variable}}`;
    
    if (value !== undefined) {
      if (Array.isArray(value)) {
        prompt = prompt.replace(placeholder, value.join(', '));
      } else {
        prompt = prompt.replace(placeholder, String(value));
      }
    } else {
      prompt = prompt.replace(placeholder, 'Not specified');
    }
  });
  
  return prompt;
}

/**
 * Get prompt template by ID
 */
export function getPromptTemplate(id: string): PromptTemplate | null {
  const templates = [
    PROJECT_CREATION_PROMPT,
    TASK_GENERATION_PROMPT,
    SYNC_ANALYSIS_PROMPT,
    QA_PROMPT
  ];
  
  return templates.find(template => template.id === id) || null;
}

/**
 * Validate prompt context against template
 */
export function validatePromptContext(template: PromptTemplate, context: PromptContext): string[] {
  const missing: string[] = [];
  
  template.variables.forEach(variable => {
    if (context[variable as keyof PromptContext] === undefined) {
      missing.push(variable);
    }
  });
  
  return missing;
} 