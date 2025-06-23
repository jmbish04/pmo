/**
 * Test script for the assign-agent-task endpoint
 * 
 * This script demonstrates how to use the new POST /orchestrate/assign-agent-task
 * endpoint to create AI agent task files in R2 storage.
 */

const WORKER_URL = 'http://localhost:8787'; // Update with your worker URL

/**
 * Test assigning an agent task
 */
async function testAssignAgentTask() {
  console.log('🎯 Testing assign-agent-task endpoint...\n');

  const taskData = {
    title: "Write documentation for SyncAgent",
    description: "Document the responsibilities and logic of the SyncAgent, including examples of sync scenarios, error handling, and integration patterns with ClickUp API.",
    tags: ["docs", "agent", "clickup", "sync"],
    relatedFile: "src/orchestrate/agents/SyncAgent.ts",
    priority: "medium",
    assignee: "ai-agent",
    dueDate: "2024-12-31",
    metadata: {
      category: "documentation",
      complexity: "medium",
      estimatedHours: 4
    }
  };

  try {
    const response = await fetch(`${WORKER_URL}/orchestrate/assign-agent-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Agent task assigned successfully!');
      console.log('📄 File Key:', result.data.fileKey);
      console.log('🔗 Pre-signed URL:', result.data.presignedUrl);
      console.log('📋 Metadata:', JSON.stringify(result.data.metadata, null, 2));
    } else {
      console.log('❌ Failed to assign agent task:');
      console.log('Status:', response.status);
      console.log('Error:', result.error);
      console.log('Message:', result.message);
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

/**
 * Test assigning multiple agent tasks
 */
async function testMultipleAgentTasks() {
  console.log('\n🎯 Testing multiple agent task assignments...\n');

  const tasks = [
    {
      title: "Implement error handling for webhook events",
      description: "Add comprehensive error handling and retry logic for ClickUp webhook events, including rate limiting, validation, and graceful degradation.",
      tags: ["webhook", "error-handling", "clickup"],
      relatedFile: "src/handlers/webhookHandler.ts",
      priority: "high"
    },
    {
      title: "Create unit tests for EnrichmentAgent",
      description: "Write comprehensive unit tests for the EnrichmentAgent class, covering all public methods, edge cases, and error scenarios.",
      tags: ["testing", "agent", "unit-tests"],
      relatedFile: "src/orchestrate/agents/EnrichmentAgent.ts",
      priority: "medium"
    },
    {
      title: "Design database schema for agent collaboration",
      description: "Design and implement a database schema to support agent collaboration, including task assignments, progress tracking, and result storage.",
      tags: ["database", "schema", "collaboration"],
      relatedFile: "migrations/003_agent_collaboration.sql",
      priority: "high"
    }
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log(`📝 Assigning task ${i + 1}: ${task.title}`);

    try {
      const response = await fetch(`${WORKER_URL}/orchestrate/assign-agent-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Task ${i + 1} assigned: ${result.data.fileKey}`);
      } else {
        console.log(`❌ Task ${i + 1} failed: ${result.error}`);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Task ${i + 1} request failed:`, error.message);
    }
  }
}

/**
 * Test invalid request handling
 */
async function testInvalidRequests() {
  console.log('\n🎯 Testing invalid request handling...\n');

  const invalidRequests = [
    {
      name: "Missing title",
      data: {
        description: "This should fail because title is missing"
      }
    },
    {
      name: "Missing description",
      data: {
        title: "This should fail because description is missing"
      }
    },
    {
      name: "Empty body",
      data: {}
    }
  ];

  for (const test of invalidRequests) {
    console.log(`🧪 Testing: ${test.name}`);

    try {
      const response = await fetch(`${WORKER_URL}/orchestrate/assign-agent-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data)
      });

      const result = await response.json();

      if (response.status === 400) {
        console.log(`✅ Correctly rejected: ${result.message}`);
      } else {
        console.log(`❌ Unexpected response: ${response.status} - ${result.message}`);
      }

    } catch (error) {
      console.error(`❌ Request failed:`, error.message);
    }
  }
}

/**
 * Test CORS preflight
 */
async function testCORS() {
  console.log('\n🎯 Testing CORS preflight...\n');

  try {
    const response = await fetch(`${WORKER_URL}/orchestrate/assign-agent-task`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    if (response.status === 200) {
      console.log('✅ CORS preflight successful');
      console.log('CORS Headers:', {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      });
    } else {
      console.log(`❌ CORS preflight failed: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting assign-agent-task endpoint tests...\n');

  // Test basic functionality
  await testAssignAgentTask();

  // Test multiple tasks
  await testMultipleAgentTasks();

  // Test error handling
  await testInvalidRequests();

  // Test CORS
  await testCORS();

  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

// Export for use in other test files
module.exports = {
  testAssignAgentTask,
  testMultipleAgentTasks,
  testInvalidRequests,
  testCORS,
  runTests
}; 