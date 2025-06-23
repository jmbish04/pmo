/**
 * Test Example for Enrich Task Endpoint
 * 
 * This file demonstrates how to use the /orchestrate/enrich-task endpoint.
 * Run this with Node.js to test the enrichment functionality.
 */

// Example request to test the enrich-task endpoint
const testRequest = {
  taskId: "task-6c3a8b2d",
  config: {
    enableUnitTests: true,
    enablePriorityEstimation: true,
    enableEffortEstimation: true,
    enableTagSuggestions: true,
    enableDependencyDetection: true
  }
};

// Example cURL command
console.log('Test the enrich-task endpoint with cURL:');
console.log(`
curl -X POST http://localhost:8787/orchestrate/enrich-task \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testRequest, null, 2)}'
`);

// Example fetch request (for browser or Node.js with fetch)
console.log('\nOr use fetch:');
console.log(`
fetch('http://localhost:8787/orchestrate/enrich-task', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(testRequest, null, 2)})
})
.then(response => response.json())
.then(data => console.log(data));
`);

// Expected response format
console.log('\nExpected response:');
console.log(JSON.stringify({
  status: "success",
  flowId: "flow-12345678-1234-1234-1234-123456789abc",
  result: {
    uuid: "task-6c3a8b2d",
    enriched_task: {
      title: "Sample Task",
      description: "This is a sample task for testing",
      priority: 3,
      estimated_hours: 2,
      dependencies: [],
      assignee_suggestions: ["full-stack-developer"],
      tags: ["test", "sample"],
      unit_tests: [
        "should pass basic validation",
        "should link to valid project"
      ]
    },
    confidence_score: 0.8,
    processing_time: 150
  },
  message: "Flow 'enrichTask' executed successfully",
  processingTime: 200
}, null, 2));

// Test with minimal request (just taskId)
const minimalRequest = {
  taskId: "task-6c3a8b2d"
};

console.log('\nMinimal request example:');
console.log(JSON.stringify(minimalRequest, null, 2));

// Test with invalid request (no taskId)
const invalidRequest = {
  config: {
    enableUnitTests: true
  }
};

console.log('\nInvalid request example (will return error):');
console.log(JSON.stringify(invalidRequest, null, 2));

// Test with non-existent taskId
const nonExistentRequest = {
  taskId: "non-existent-task-id"
};

console.log('\nNon-existent task request example (will return 404):');
console.log(JSON.stringify(nonExistentRequest, null, 2));

// Example of what the enrichment agent does
console.log('\nEnrichment Agent Features:');
console.log(`
✅ Adds default description if missing
✅ Generates unit tests (e.g., "should pass basic validation", "should link to valid project")
✅ Estimates priority (1-5 scale)
✅ Estimates effort in hours
✅ Suggests relevant tags
✅ Detects dependencies
✅ Suggests assignees based on task content
✅ Calculates confidence score
✅ Provides processing time metrics
`);

// Example of different task types and their enrichment
console.log('\nExample enrichments for different task types:');
console.log(`
🔧 API Task: "Implement user authentication API"
   - Description: "Implement the user authentication API functionality according to project requirements."
   - Unit Tests: ["should return correct HTTP status codes", "should handle error cases gracefully"]
   - Priority: 2 (security-related)
   - Effort: 4 hours
   - Tags: ["api", "security", "backend"]
   - Assignee: ["backend-developer"]

🎨 UI Task: "Design mobile app login screen"
   - Description: "Design and create the user interface components for mobile app login screen."
   - Unit Tests: ["should render correctly on different screen sizes", "should handle user interactions properly"]
   - Priority: 3 (feature)
   - Effort: 3 hours
   - Tags: ["frontend", "ui", "mobile"]
   - Assignee: ["frontend-developer"]

🐛 Bug Task: "Fix login button not working"
   - Description: "Investigate and resolve the issue described in the task title. Ensure the fix is properly tested and documented."
   - Unit Tests: ["should validate user credentials", "should handle unauthorized access"]
   - Priority: 2 (bug fix)
   - Effort: 2 hours
   - Tags: ["bugfix", "frontend"]
   - Assignee: ["frontend-developer"]
`); 