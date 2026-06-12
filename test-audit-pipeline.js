/**
 * Test Audit Pipeline
 * Example usage and validation of the LLM audit pipeline
 */

const AuditRun = require('./audit-run');

// Define test schemas
const testSchemas = {
  auditTask: {
    fields: {
      input: { type: 'string', required: true },
      llmResult: { type: 'string', required: false },
      timestamp: { type: 'string', required: true },
    },
  },
};

// Define test policies
const testPolicies = {
  maxRedactionsAllowed: 3,
  blockOnTruncation: true,
  maxSensitivityScore: 0.8,
};

/**
 * Test case 1: Clean input with LLM execution
 */
async function testCase1_CleanInput() {
  console.log('\n=== Test Case 1: Clean Input ===');
  
  const auditRun = new AuditRun({
    schemas: testSchemas,
    policies: testPolicies,
  });

  const input = 'Please analyze this database query: SELECT * FROM users WHERE id = 1';
  const result = await auditRun.execute(input, 'auditTask');

  console.log('Audit ID:', result.id);
  console.log('LLM Used:', result.provenance.llmExecution.used);
  console.log('Input Redactions:', result.provenance.inputSanitization.redactions);
  console.log('Policy Decision:', result.provenance.policyDecision.allowed);
  console.log('Steps:', result.steps.length);
  console.log('\nFull Result:', JSON.stringify(result, null, 2));
}

/**
 * Test case 2: Input with secrets (should be redacted)
 */
async function testCase2_InputWithSecrets() {
  console.log('\n=== Test Case 2: Input with Secrets ===');
  
  const auditRun = new AuditRun({
    schemas: testSchemas,
    policies: testPolicies,
  });

  const input = 'My API key is sk_live_abc123def456 and my DB password is SuperSecret123';
  const result = await auditRun.execute(input, 'auditTask');

  console.log('Audit ID:', result.id);
  console.log('Input Redactions Count:', result.provenance.inputSanitization.redactions);
  console.log('Redactions by Type:', result.provenance.inputSanitization.byType);
  console.log('Policy Allowed:', result.provenance.policyDecision.allowed);
  console.log('\nRedacted Input:', result.output.input);
}

/**
 * Test case 3: Too many redactions (should block LLM)
 */
async function testCase3_TooManyRedactions() {
  console.log('\n=== Test Case 3: Too Many Redactions (Policy Block) ===');
  
  const auditRun = new AuditRun({
    schemas: testSchemas,
    policies: {
      maxRedactionsAllowed: 1, // Very strict
      blockOnTruncation: true,
      maxSensitivityScore: 0.8,
    },
  });

  const input = 'api_key=secret1 password=secret2 auth_token=secret3 db_password=secret4';
  const result = await auditRun.execute(input, 'auditTask');

  console.log('Audit ID:', result.id);
  console.log('LLM Used:', result.provenance.llmExecution.used);
  console.log('Policy Allowed:', result.provenance.policyDecision.allowed);
  console.log('Policy Reason:', result.provenance.policyDecision.reason);
  console.log('Input Redactions:', result.provenance.inputSanitization.redactions);
}

/**
 * Test case 4: Simulating LLM response with PII
 */
async function testCase4_LlmResponseWithPii() {
  console.log('\n=== Test Case 4: LLM Response with PII Detection ===');
  
  const auditRun = new AuditRun({
    schemas: testSchemas,
    policies: testPolicies,
  });

  const input = 'Analyze this policy document';
  const result = await auditRun.execute(input, 'auditTask');

  console.log('Audit ID:', result.id);
  console.log('LLM Used:', result.provenance.llmExecution.used);
  console.log('Evidence Sanitizations:', result.provenance.evidenceSanitization);
  console.log('Final Output:', JSON.stringify(result.output, null, 2));
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🔍 LLM Audit Pipeline - Test Suite\n');
  console.log('Testing: Input Sanitizer, Schema Parser, Evidence Sanitizer, Audit Policy Filter');

  try {
    await testCase1_CleanInput();
    await testCase2_InputWithSecrets();
    await testCase3_TooManyRedactions();
    await testCase4_LlmResponseWithPii();

    console.log('\n✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { testCase1_CleanInput, testCase2_InputWithSecrets, testCase3_TooManyRedactions, testCase4_LlmResponseWithPii };
