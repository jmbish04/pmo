/**
 * Test script for the AI-enriched, multi-agent orchestration system
 * 
 * This script tests the complete orchestration flow including:
 * - Orchestrator routing
 * - AgentManager flow execution
 * - Individual agent operations
 * - Webhook processing
 * - Task enrichment and review
 */

const BASE_URL = 'http://localhost:8787';

// Test configurations
const testConfigs = {
  sync: {
    url: '/orchestrate/sync',
    method: 'POST',
    data: {
      action: 'sync',
      data: { source: 'test_sync' },
      config: { fullSync: true },
      metadata: { test: true, timestamp: new Date().toISOString() }
    }
  },
  newProject: {
    url: '/orchestrate/new-project',
    method: 'POST',
    data: {
      action: 'createProject',
      data: {
        name: 'Test Project',
        description: 'A test project for orchestration testing',
        teamId: 'test_team_123'
      },
      config: { template: 'default' },
      metadata: { test: true, timestamp: new Date().toISOString() }
    }
  },
  reviewStagedTasks: {
    url: '/orchestrate/review-staged-tasks',
    method: 'POST',
    data: {
      action: 'reviewStagedTasks',
      data: { batchSize: 10 },
      config: {
        enrichMissingData: true,
        validateBeforePromotion: true,
        autoPromote: true
      },
      metadata: { test: true, timestamp: new Date().toISOString() }
    }
  },
  enrichTask: {
    url: '/orchestrate/enrich-task',
    method: 'POST',
    data: {
      action: 'enrichTask',
      data: {
        taskId: 'test_task_123',
        title: 'Implement user authentication',
        description: 'Add user login and registration functionality'
      },
      config: {
        generateUnitTests: true,
        suggestTags: true,
        estimateEffort: true
      },
      metadata: { test: true, timestamp: new Date().toISOString() }
    }
  },
  webhook: {
    url: '/orchestrate/webhook',
    method: 'POST',
    data: {
      action: 'processWebhook',
      data: {
        event: 'taskCreated',
        task_id: 'task_456',
        project_id: 'project_789',
        timestamp: new Date().toISOString(),
        data: {
          task: {
            id: 'task_456',
            name: 'New Test Task',
            status: 'pending'
          }
        }
      },
      metadata: { test: true, timestamp: new Date().toISOString() }
    }
  }
};

/**
 * Send request to orchestration endpoint
 */
async function sendOrchestrationRequest(config) {
  try {
    console.log(`📤 Sending ${config.data.action} request...`);
    
    const response = await fetch(`${BASE_URL}${config.url}`, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.data)
    });

    const result = await response.json();
    
    console.log(`✅ ${config.data.action} response:`, {
      status: response.status,
      statusText: response.statusText,
      flowId: result.flowId,
      success: result.success,
      processingTime: result.processingTime
    });

    return { success: response.ok, data: result };

  } catch (error) {
    console.error(`❌ ${config.data.action} failed:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Test all orchestration flows
 */
async function testAllOrchestrationFlows() {
  console.log('🚀 Starting comprehensive orchestration tests...\n');

  const results = [];

  // Test each orchestration flow
  for (const [flowName, config] of Object.entries(testConfigs)) {
    console.log(`\n📋 Testing ${flowName} flow...`);
    const result = await sendOrchestrationRequest(config);
    results.push({
      flow: flowName,
      ...result
    });
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 Orchestration Test Summary:');
  console.log('==============================');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

  // Detailed results
  console.log('\n📋 Detailed Results:');
  console.log('===================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const flowId = result.data?.flowId || 'N/A';
    const processingTime = result.data?.processingTime || 'N/A';
    console.log(`${status} ${result.flow}: ${result.success ? `Flow ${flowId} (${processingTime}ms)` : result.error}`);
  });

  return results;
}

/**
 * Test specific orchestration flow
 */
async function testSpecificFlow(flowName) {
  const config = testConfigs[flowName];
  
  if (!config) {
    console.error(`❌ Unknown flow: ${flowName}`);
    console.log('Available flows:', Object.keys(testConfigs).join(', '));
    return;
  }

  console.log(`🎯 Testing specific flow: ${flowName}`);
  return await sendOrchestrationRequest(config);
}

/**
 * Test webhook processing
 */
async function testWebhookProcessing() {
  console.log('\n📥 Testing webhook processing...\n');

  const webhookTypes = [
    {
      name: 'Task Created',
      data: {
        event: 'taskCreated',
        task_id: 'task_123',
        project_id: 'project_456',
        timestamp: new Date().toISOString(),
        data: {
          task: {
            id: 'task_123',
            name: 'Implement API endpoint',
            status: 'pending'
          }
        }
      }
    },
    {
      name: 'Task Updated',
      data: {
        event: 'taskUpdated',
        task_id: 'task_123',
        project_id: 'project_456',
        timestamp: new Date().toISOString(),
        data: {
          task: {
            id: 'task_123',
            name: 'Implement API endpoint',
            status: 'in_progress'
          }
        }
      }
    },
    {
      name: 'Project Created',
      data: {
        event: 'projectCreated',
        project_id: 'project_789',
        timestamp: new Date().toISOString(),
        data: {
          project: {
            id: 'project_789',
            name: 'New Mobile App'
          }
        }
      }
    }
  ];

  const results = [];

  for (const webhook of webhookTypes) {
    console.log(`📤 Processing ${webhook.name} webhook...`);
    
    const config = {
      ...testConfigs.webhook,
      data: {
        ...testConfigs.webhook.data,
        data: webhook.data
      }
    };

    const result = await sendOrchestrationRequest(config);
    results.push({
      webhook: webhook.name,
      ...result
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🚨 Testing error scenarios...\n');

  const errorTests = [
    {
      name: 'Invalid Flow',
      config: {
        url: '/orchestrate/invalid-flow',
        method: 'POST',
        data: {
          action: 'invalidAction',
          data: {},
          metadata: { test: true }
        }
      }
    },
    {
      name: 'Missing Required Data',
      config: {
        url: '/orchestrate/new-project',
        method: 'POST',
        data: {
          action: 'createProject',
          data: {}, // Missing required fields
          metadata: { test: true }
        }
      }
    },
    {
      name: 'Invalid JSON',
      config: {
        url: '/orchestrate/sync',
        method: 'POST',
        data: 'invalid json string'
      }
    }
  ];

  const results = [];

  for (const test of errorTests) {
    console.log(`🧪 Testing: ${test.name}`);
    
    try {
      const response = await fetch(`${BASE_URL}${test.config.url}`, {
        method: test.config.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: typeof test.config.data === 'string' ? test.config.data : JSON.stringify(test.config.data)
      });

      const result = await response.json();
      
      const isExpectedError = response.status >= 400;
      const status = isExpectedError ? '✅' : '❌';
      
      console.log(`${status} ${test.name}: ${isExpectedError ? 'Expected error received' : 'Unexpected success'}`);
      
      results.push({
        test: test.name,
        success: isExpectedError,
        status: response.status,
        data: result
      });

    } catch (error) {
      console.log(`✅ ${test.name}: Network error (expected for invalid JSON)`);
      results.push({
        test: test.name,
        success: true,
        error: error.message
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Performance test
 */
async function performanceTest() {
  console.log('\n⚡ Performance test...\n');

  const startTime = Date.now();
  
  // Test multiple sync operations
  const syncPromises = [];
  for (let i = 0; i < 5; i++) {
    const config = {
      ...testConfigs.sync,
      data: {
        ...testConfigs.sync.data,
        data: { source: `performance_test_${i}` }
      }
    };
    syncPromises.push(sendOrchestrationRequest(config));
  }

  const results = await Promise.all(syncPromises);
  const endTime = Date.now();
  const duration = endTime - startTime;

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`⏱️  Performance test completed in ${duration}ms`);
  console.log(`📊 Results: ${successful} successful, ${failed} failed`);
  console.log(`📈 Throughput: ${(results.length / (duration / 1000)).toFixed(2)} requests/second`);

  return { results, duration };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests
    console.log('🚀 Starting comprehensive orchestration system tests...\n');
    
    // Basic orchestration flows
    await testAllOrchestrationFlows();
    
    // Webhook processing
    await testWebhookProcessing();
    
    // Error scenarios
    await testErrorScenarios();
    
    // Performance test
    await performanceTest();
    
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage:');
    console.log('  node test-orchestration.js                    # Run all tests');
    console.log('  node test-orchestration.js sync               # Test sync flow only');
    console.log('  node test-orchestration.js newProject         # Test new project flow only');
    console.log('  node test-orchestration.js reviewStagedTasks  # Test review staged tasks flow only');
    console.log('  node test-orchestration.js enrichTask         # Test enrich task flow only');
    console.log('  node test-orchestration.js webhook            # Test webhook processing only');
    console.log('  node test-orchestration.js errors             # Test error scenarios only');
    console.log('  node test-orchestration.js performance        # Performance test only');
    console.log('  node test-orchestration.js --help             # Show this help');
  } else {
    const testType = args[0];
    
    switch (testType) {
      case 'sync':
        await testSpecificFlow('sync');
        break;
      case 'newProject':
        await testSpecificFlow('newProject');
        break;
      case 'reviewStagedTasks':
        await testSpecificFlow('reviewStagedTasks');
        break;
      case 'enrichTask':
        await testSpecificFlow('enrichTask');
        break;
      case 'webhook':
        await testWebhookProcessing();
        break;
      case 'errors':
        await testErrorScenarios();
        break;
      case 'performance':
        await performanceTest();
        break;
      default:
        console.error(`❌ Unknown test type: ${testType}`);
        console.log('Use --help to see available test types');
    }
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  sendOrchestrationRequest,
  testAllOrchestrationFlows,
  testSpecificFlow,
  testWebhookProcessing,
  testErrorScenarios,
  performanceTest,
  testConfigs
}; 