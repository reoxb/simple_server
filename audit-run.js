/**
 * AuditRun
 * Represents a single execution of the audit pipeline
 * Maintains complete provenance and metadata
 */

const InputSanitizer = require('./input-sanitizer');
const EvidenceSanitizer = require('./evidence-sanitizer');
const SchemaParser = require('./schema-parser');
const AuditPolicyFilter = require('./audit-policy-filter');
const LLMProvider = require('./llm-provider');

class AuditRun {
  constructor(options = {}) {
    this.id = this._generateId();
    this.startTime = new Date();
    this.endTime = null;
    this.status = 'running';

    // Initialize components
    this.inputSanitizer = new InputSanitizer();
    this.evidenceSanitizer = new EvidenceSanitizer();
    this.schemaParser = new SchemaParser(options.schemas || {});
    this.policyFilter = new AuditPolicyFilter(options.policies || {
      maxRedactionsAllowed: 5,
      blockOnTruncation: true,
      maxSensitivityScore: 0.8,
    });
    this.llmProvider = new LLMProvider();

    // Audit trail
    this.steps = [];
    this.llmUsed = false;
    this.result = null;
  }

  /**
   * Execute complete audit pipeline
   * @param {string} input - Raw input
   * @param {string} schemaName - Schema to validate against
   * @returns {Promise<Object>} - Audit result with full provenance
   */
  async execute(input, schemaName) {
    try {
      // Step 1: Sanitize input
      this._logStep('INPUT_SANITIZATION', 'started');
      const sanitization = this.inputSanitizer.sanitize(input);
      this._logStep('INPUT_SANITIZATION', 'completed', sanitization);

      // Step 2: Check policy
      this._logStep('POLICY_CHECK', 'started');
      const policyCheck = this.policyFilter.evaluate({
        inputRedactions: sanitization.redactions,
        inputTruncated: sanitization.truncated,
      });
      this._logStep('POLICY_CHECK', 'completed', policyCheck);

      // Step 3: LLM call (if allowed)
      let llmResult = null;
      if (policyCheck.allowed) {
        this._logStep('LLM_CALL', 'started');
        const llmResponse = await this.llmProvider.call(sanitization.sanitized);
        this.llmUsed = true;

        // Step 4: Sanitize evidence
        this._logStep('EVIDENCE_SANITIZATION', 'started');
        const evidenceSan = this.evidenceSanitizer.sanitize(llmResponse);
        this._logStep('EVIDENCE_SANITIZATION', 'completed', evidenceSan);

        llmResult = {
          raw: llmResponse,
          sanitized: evidenceSan.sanitized,
          sanitizations: evidenceSan.sanitizations,
          truncated: evidenceSan.truncated,
        };

        this._logStep('LLM_CALL', 'completed', llmResult);
      } else {
        this._logStep('LLM_CALL', 'skipped', {
          reason: policyCheck.reason,
        });
      }

      // Step 5: Parse result against schema
      this._logStep('SCHEMA_PARSING', 'started');
      const parseResult = this.schemaParser.parse(
        {
          input: sanitization.sanitized,
          llmResult: llmResult?.sanitized || null,
          timestamp: new Date().toISOString(),
        },
        schemaName
      );
      this._logStep('SCHEMA_PARSING', 'completed', parseResult);

      // Compile final result
      this.result = {
        id: this.id,
        status: 'completed',
        timestamp: new Date().toISOString(),
        provenance: {
          inputSanitization: {
            redactions: sanitization.redactions.length,
            truncated: sanitization.truncated,
            byType: this.inputSanitizer.getRedactionStats(),
          },
          policyDecision: {
            allowed: policyCheck.allowed,
            reason: policyCheck.reason,
            metadata: policyCheck.metadata,
          },
          llmExecution: {
            used: this.llmUsed,
            stats: this.llmProvider.getStats(),
          },
          evidenceSanitization: this.llmUsed
            ? {
                sanitizations: llmResult.sanitizations.length,
                truncated: llmResult.truncated,
                byType: this.evidenceSanitizer.getSanitizationStats(),
              }
            : null,
          schemaParsing: {
            valid: parseResult.valid,
            errors: parseResult.errors,
          },
        },
        output: parseResult.data,
        steps: this.steps,
      };

      this.status = 'completed';
      this.endTime = new Date();
      return this.result;
    } catch (error) {
      this.status = 'error';
      this.endTime = new Date();
      return {
        id: this.id,
        status: 'error',
        error: error.message,
        steps: this.steps,
      };
    }
  }

  /**
   * Log a step in the audit trail
   * @private
   */
  _logStep(stepName, status, details = null) {
    this.steps.push({
      step: stepName,
      status,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  /**
   * Generate unique audit ID
   * @private
   */
  _generateId() {
    return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = AuditRun;
