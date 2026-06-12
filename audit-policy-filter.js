/**
 * Audit Policy Filter
 * Final gating mechanism that decides whether to execute LLM rules
 * Based on configured policies and metdata
 */

class AuditPolicyFilter {
  constructor(policies = {}) {
    this.policies = policies;
  }

  /**
   * Evaluate if LLM rules should be applied
   * @param {Object} context - Audit context
   * @returns {Object} { allowed: boolean, reason: string, metadata: Object }
   */
  evaluate(context) {
    const metadata = {
      evaluatedAt: new Date().toISOString(),
      policyRules: [],
    };

    // Rule 1: Redaction threshold
    if (
      context.inputRedactions &&
      context.inputRedactions.length > this.policies.maxRedactionsAllowed
    ) {
      metadata.policyRules.push({
        rule: 'redaction_threshold',
        triggered: true,
        threshold: this.policies.maxRedactionsAllowed,
        actual: context.inputRedactions.length,
      });
      return {
        allowed: false,
        reason: 'Too many input redactions. LLM cannot operate reliably.',
        metadata,
      };
    }

    // Rule 2: Input truncation check
    if (context.inputTruncated && this.policies.blockOnTruncation) {
      metadata.policyRules.push({
        rule: 'truncation_blocked',
        triggered: true,
      });
      return {
        allowed: false,
        reason: 'Input was truncated. LLM rules disabled by policy.',
        metadata,
      };
    }

    // Rule 3: Evidence sensitivity check
    if (
      context.evidenceSensitivity &&
      context.evidenceSensitivity > this.policies.maxSensitivityScore
    ) {
      metadata.policyRules.push({
        rule: 'sensitivity_threshold',
        triggered: true,
        threshold: this.policies.maxSensitivityScore,
        actual: context.evidenceSensitivity,
      });
      return {
        allowed: false,
        reason: 'Evidence exceeds sensitivity threshold.',
        metadata,
      };
    }

    // All checks passed
    metadata.policyRules.push({
      rule: 'all_checks',
      passed: true,
    });

    return {
      allowed: true,
      reason: 'All policies satisfied. LLM rules allowed.',
      metadata,
    };
  }
}

module.exports = AuditPolicyFilter;
