/**
 * Test script for Review Staged Tasks functionality
 * 
 * This script tests the review staged tasks endpoint and flow.
 */

const REVIEW_URL = 'http://localhost:8787/orchestrate/review-staged-tasks';

/**
 * Test the review staged tasks endpoint
 */
async function testReviewStagedTasks(config = {}) {
  try {
    console.log('🔍 Testing review staged tasks...');
    
    const payload = {
      config: {
        enrichMissingData: true,
        validateBeforePromotion: true,
        batchSize: 10,
        ...config
      }
    };

    const response = await fetch(REVIEW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    console.log('✅ Review staged tasks response:', {
      status: response.status,
      statusText: response.statusText,
      result
    });

    return { success: response.ok, data: result };

  } catch (error) {
    console.error('❌ Review staged tasks failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test with different configurations
 */
async function testDifferentConfigs() {
  console.log('🚀 Testing review staged tasks with different configurations...\n');

  const configs = [
    {
      name: 'Default Configuration',
      config: {}
    },
    {
      name: 'Enrichment Only',
      config: {
        enrichMissingData: true,
        validateBeforePromotion: false
      }
    },
    {
      name: 'Validation Only',
      config: {
        enrichMissingData: false,
        validateBeforePromotion: true
      }
    },
    {
      name: 'Small Batch',
      config: {
        batchSize: 5,
        enrichMissingData: true,
        validateBeforePromotion: true
      }
    },
    {
      name: 'Large Batch',
      config: {
        batchSize: 50,
        enrichMissingData: true,
        validateBeforePromotion: true
      }
    }
  ];

  const results = [];

  for (const testConfig of configs) {
    console.log(`📋 Testing: ${testConfig.name}`);
    const result = await testReviewStagedTasks(testConfig.config);
    results.push({
      name: testConfig.name,
      ...result
    });
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📊 Configuration Test Summary:');
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
    const processed = result.data?.processed || 0;
    console.log(`${status} ${result.name}: ${result.success ? `Processed ${processed} tasks` : result.error}`);
  });

  return results;
}

/**
 * Test error scenarios
 */
async function testErrorScenarios() {
  console.log('\n🚨 Testing error scenarios...\n');

  const errorTests = [
    {
      name: 'Invalid JSON',
      payload: 'invalid json',
      expectedError: 'JSON parsing error'
    },
    {
      name: 'Empty Payload',
      payload: {},
      expectedError: 'Missing configuration'
    },
    {
      name: 'Invalid Config Type',
      payload: { config: 'not an object' },
      expectedError: 'Invalid configuration format'
    }
  ];

  const results = [];

  for (const test of errorTests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const response = await fetch(REVIEW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: typeof test.payload === 'string' ? test.payload : JSON.stringify(test.payload)
      });

      const result = await response.json();
      
      const isExpectedError = response.status >= 400;
      const status = isExpectedError ? '✅' : '❌';
      
      console.log(`${status} ${test.name}: ${isExpectedError ? 'Expected error received' : 'Unexpected success'}`);
      
      results.push({
        name: test.name,
        success: isExpectedError,
        status: response.status,
        data: result
      });

    } catch (error) {
      console.log(`✅ ${test.name}: Network error (expected for invalid JSON)`);
      results.push({
        name: test.name,
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
  
  const result = await testReviewStagedTasks({
    batchSize: 100,
    enrichMissingData: true,
    validateBeforePromotion: true
  });

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`⏱️  Performance test completed in ${duration}ms`);
  console.log(`📊 Result: ${result.success ? 'Success' : 'Failed'}`);
  
  if (result.success && result.data) {
    console.log(`📈 Tasks processed: ${result.data.processed || 0}`);
    console.log(`📉 Processing rate: ${((result.data.processed || 0) / (duration / 1000)).toFixed(2)} tasks/second`);
  }

  return { result, duration };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run all tests
    console.log('🚀 Starting comprehensive review staged tasks tests...\n');
    
    // Basic test
    await testReviewStagedTasks();
    
    // Configuration tests
    await testDifferentConfigs();
    
    // Error scenario tests
    await testErrorScenarios();
    
    // Performance test
    await performanceTest();
    
  } else if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage:');
    console.log('  node test-review-staged-tasks.js                    # Run all tests');
    console.log('  node test-review-staged-tasks.js basic              # Basic test only');
    console.log('  node test-review-staged-tasks.js configs            # Configuration tests only');
    console.log('  node test-review-staged-tasks.js errors             # Error scenario tests only');
    console.log('  node test-review-staged-tasks.js performance        # Performance test only');
    console.log('  node test-review-staged-tasks.js --help             # Show this help');
  } else {
    const testType = args[0];
    
    switch (testType) {
      case 'basic':
        await testReviewStagedTasks();
        break;
      case 'configs':
        await testDifferentConfigs();
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
  testReviewStagedTasks,
  testDifferentConfigs,
  testErrorScenarios,
  performanceTest
}; 