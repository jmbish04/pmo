// Prompt library for backlog agent scenarios

export const AGENT_SCHEMA = `**Description:**\nA concise, 1-2 sentence paragraph stating the agent's core purpose and function.\n\n**Responsibilities:**\n- [List of specific duties, inputs, and outputs]\n- [The agent is accountable for...]\n- [It processes X to produce Y...]\n\n**Success Criteria:**\n- [A measurable outcome that defines success]\n- [Another measurable outcome]\n- [e.g., Extracted data is passed correctly to other agents]\n\n**Unit Test Plan:**\n- [A specific test case, e.g., Feed prompt and style history → expect correct extraction]\n- [An edge case test, e.g., Feed ambiguous prompt → expect fallback or clarification request]\n- [A failure case test, e.g., Feed prompt with conflicting constraints → expect warning or error]`;

export const TOOL_SCHEMA = `**Description:**\nA brief sentence explaining what the tool does in practice.\n\n**Contribution:**\nExplains the value this tool adds to the overall process or to downstream agents.\n\n**Success Criteria:**\nOne or more specific, measurable outcomes for the tool itself.\n\n**Unit Test Plan:**\nOne or more specific tests to verify the tool's functionality.`;

/**
 * Generate a prompt for standardizing an agent task in the Agentic Team Epic
 * @param agentTitle - The agent's title
 * @param agentDescription - The agent's current description
 * @returns {string} - The full prompt for the agent
 */
export function generateAgentPrompt(agentTitle: string, agentDescription: string): string {
  return `Rewrite the following agent task to match this schema:\n\n---\nTitle: ${agentTitle}\n\nCurrent Description:\n${agentDescription}\n\n---\n\n${AGENT_SCHEMA}`;
}

/**
 * Generate a prompt for creating tool subtasks for an agent
 * @param agentTitle - The agent's title
 * @param context - The context for the agent (e.g., home remodel team)
 * @returns {string} - The full prompt for tool subtasks
 */
export function generateToolSubtasksPrompt(agentTitle: string, context: string): string {
  return `For the agent "${agentTitle}" in the context of ${context}, create 3 to 5 relevant tool subtasks. For each, use its name as the title and format its description to match this schema:\n\n${TOOL_SCHEMA}`;
}

/**
 * Main prompt for backlog agent to process all agent tasks in the Agentic Team Epic
 */
export const AGENTIC_TEAM_EPIC_PROMPT = `\n**Objective:** Standardize All Agent Definitions and Create Tool Subtasks within a Specific Epic\n\n**Target Scope:**\nYour primary target for this operation is the ClickUp Epic titled \`Agentic Team\` with the ID \`86b5e8abw\`. You are to find and process every task that exists directly under this Epic.\n\n**Context:**\nYou are an assistant helping to structure an agentic team for a home remodeling project. This standardization is a crucial step in managing the \`colby\` CLI agent ecosystem. Each task within the target Epic represents a unique "agent" in this team. Your goal is to update the description of each of these agent tasks to match a specific schema, and then create a comprehensive set of "tool" subtasks for each agent, also following a specific schema.\n\n**Instructions:**\n\nFor every single task found within the Epic \`Agentic Team\` (ID: \`86b5e8abw\`), perform the following two actions:\n\n**Action 1: Update the Main Task Description**\nRewrite the existing task description to perfectly match the following schema. Use the agent's current title and any existing description to infer its purpose.\n\n${AGENT_SCHEMA}\n\n**Action 2: Create Tool Subtasks**\nBased on the agent's role in a home remodel team, create 3 to 5 relevant and comprehensive tool subtasks for it. For each subtask you create, use its name as the title and format its description to perfectly match the schema below.\n\n${TOOL_SCHEMA}\n\nProceed to find and update all agent tasks within Epic \`86b5e8abw\` as instructed. Do not skip any tasks in this Epic.`;

/**
 * 1. Scaffold a new standalone CLI command
 */
export const scaffoldNewCliCommand = (idea: string) => ({
  prompt: `A new CLI command idea has been captured: "${idea}".
  
  Based on this, create a new task in the backlog.
  
  **Task Title:** Use the format: "feat(cli): Add \`colby [command_name]\` command"
  
  **Task Description:**
  - **Purpose:** A brief, 1-2 sentence summary of what this command does.
  - **User Story:** "As a developer, I want to run \`colby [command_name]\` to..."
  - **Acceptance Criteria:**
    - Command is available in the CLI.
    - Command accepts the following arguments/flags: [Infer from idea, leave as TBD if unclear].
    - Command produces the expected output or side-effect.
  
  **Subtasks:**
  - Create a subtask for "Implement command logic in Cobra/CLI library."
  - Create a subtask for "Add unit tests for the command."
  - Create a subtask for "Update CLI documentation and help text."`,
});

/**
 * 2. Scaffold a new FastAPI Endpoint
 */
export const scaffoldNewApiEndpoint = (idea: string) => ({
  prompt: `A new API endpoint idea has been captured: "${idea}".
  
  Based on this, create a new task in the backlog.
  
  **Task Title:** Use the format: "feat(api): Add [METHOD] /[path] endpoint"
  
  **Task Description:**
  - **Purpose:** A brief, 1-2 sentence summary of the endpoint's function.
  - **Request Body / Query Params:** [Infer schema from idea, leave as TBD if unclear]
  - **Success Response (200 OK):** [Infer schema from idea, leave as TBD if unclear]
  - **Error Responses:** Note potential errors like 404 Not Found or 400 Bad Request.
  
  **Subtasks:**
  - Create a subtask for "Define Pydantic models for request and response."
  - Create a subtask for "Implement endpoint business logic."
  - Create a subtask for "Write integration tests for the endpoint."
  - Create a subtask for "Generate/update OpenAPI documentation."`,
});

/**
 * 3. Analyze and structure a technical debt item
 */
export const structureTechDebt = (idea: string) => ({
  prompt: `A piece of technical debt has been identified: "${idea}".
  
  Create a new 'debt' task in the backlog to address this.
  
  **Task Title:** Use the format: "debt: Refactor [area_of_code]"
  
  **Task Description:**
  - **Problem:** Describe the current situation and why it's problematic (e.g., hard to maintain, slow performance, poor security).
  - **Proposed Solution:** Outline the high-level plan for refactoring or fixing the issue.
  - **Impact:** What is the risk of not doing this? What is the benefit of doing it? (e.g., improved developer velocity, better stability).
  
  **Subtasks:**
  - Create a subtask for "Identify all affected code paths."
  - Create a subtask for "Implement the refactor."
  - Create a subtask for "Verify fixes with targeted regression tests."`,
});

/**
 * 4. Draft a user-facing feature announcement
 */
export const draftFeatureAnnouncement = (featureDescription: string) => ({
  prompt: `The following feature is ready for release: "${featureDescription}".
  
  Draft a brief announcement for the team or users. The tone should be informative and slightly enthusiastic.
  
  **Draft Structure:**
  - **Headline:** e.g., "✨ New Feature: [Feature Name]"
  - **What's New?:** A 1-2 sentence summary of the feature and its main benefit.
  - **How to Use It:** A simple example, like a code snippet or a CLI command.
  - **Feedback:** A line asking for feedback.
  
  Format the output as clean Markdown.`
});

/**
 * 5. Generic fallback for new ideas
 */
export const genericNewIdea = (idea: string) => ({
  prompt: `A new idea has been captured: "${idea}".
  
  Please create a basic backlog task for this idea. If you can infer a category (CLI, API, agent, etc.), use that as the task type. Otherwise, just create a general task.\n\n**Task Title:** [Infer a concise title from the idea]\n\n**Task Description:**\n- [Restate the idea in your own words]\n- [Add any TODOs or next steps you can infer]\n\n**Subtasks:**\n- [Add subtasks if you can infer them, otherwise leave blank]`
}); 