/**
 * Test script for ClickUp webhook handler
 * 
 * This script tests the webhook endpoint with sample ClickUp webhook payloads.
 */

const WEBHOOK_URL = 'http://localhost:8787/webhook/clickup';

// Sample ClickUp webhook payloads
const sampleWebhooks = [
  {
    name: 'Task Created',
    payload: {
      event: 'taskCreated',
      task_id: 'task_123456',
      project_id: 'project_789',
      timestamp: new Date().toISOString(),
      data: {
        task: {
          id: 'task_123456',
          name: 'Implement user authentication',
          status: 'pending'
        },
        project: {
          id: 'project_789',
          name: 'Web Application'
        }
      }
    }
  },
  {
    name: 'Task Updated',
    payload: {
      event: 'taskUpdated',
      task_id: 'task_123456',
      project_id: 'project_789',
      timestamp: new Date().toISOString(),
      data: {
        task: {
          id: 'task_123456',
          name: 'Implement user authentication',
          status: 'in_progress'
        }
      }
    }
  },
  {
    name: 'Project Created',
    payload: {
      event: 'projectCreated',
      project_id: 'project_999',
      timestamp: new Date().toISOString(),
      data: {
        project: {
          id: 'project_999',
          name: 'New Mobile App'
        }
      }
    }
  },
  {
    name: 'Task Deleted',
    payload: {
      event: 'taskDeleted',
      task_id: 'task_123456',
      project_id: 'project_789',
      timestamp: new Date().toISOString(),
      data: {
        task_id: 'task_123456'
      }
    }
  }
];

/**
 * Send a webhook payload to the endpoint
 */
async function sendWebhook(webhookData) {
  try {
    console.log(`📤 Sending ${webhookData.name} webhook...`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData.payload)
    });

    const result = await response.json();
    
    console.log(`✅ ${webhookData.name} webhook response:`, {
      status: response.status,
      statusText: response.statusText,
      result
    });

    return { success: response.ok, data: result };

  } catch (error) {
    console.error(`❌ ${webhookData.name} webhook failed:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Test all webhook types
 */
async function testAllWebhooks() {
  console.log('🚀 Starting webhook tests...\n');

  const results = [];

  for (const webhook of sampleWebhooks) {
    const result = await sendWebhook(webhook);
    results.push({
      name: webhook.name,
      ...result
    });
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
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
    console.log(`${status} ${result.name}: ${result.success ? 'Success' : result.error}`);
  });

  return results;
}

/**
 * Test specific webhook type
 */
async function testSpecificWebhook(webhookName) {
  const webhook = sampleWebhooks.find(w => w.name === webhookName);
  
  if (!webhook) {
    console.error(`❌ Webhook type "${webhookName}" not found`);
    console.log('Available webhook types:', sampleWebhooks.map(w => w.name).join(', '));
    return;
  }

  console.log(`🎯 Testing specific webhook: ${webhookName}`);
  return await sendWebhook(webhook);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Test all webhooks
    await testAllWebhooks();
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage:');
    console.log('  node test-webhook.js                    # Test all webhook types');
    console.log('  node test-webhook.js "Task Created"     # Test specific webhook type');
    console.log('  node test-webhook.js --help             # Show this help');
    console.log('\nAvailable webhook types:');
    sampleWebhooks.forEach(w => console.log(`  - ${w.name}`));
  } else {
    // Test specific webhook
    const webhookName = args.join(' ');
    await testSpecificWebhook(webhookName);
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  sendWebhook,
  testAllWebhooks,
  testSpecificWebhook,
  sampleWebhooks
}; 