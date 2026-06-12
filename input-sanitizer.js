/**
 * Input Sanitizer
 * Removes secrets and PII before sending to LLM
 * Tracks all redactions for audit trail
 */

const config = require('./audit-config');

class InputSanitizer {
  constructor() {
    this.redactions = [];
  }

  /**
   * Sanitize input text
   * @param {string} input - Raw input text
   * @returns {Object} { sanitized: string, redactions: Array }
   */
  sanitize(input) {
    let sanitized = input;
    this.redactions = [];

    // Apply secret patterns
    config.policies.secretPatterns.forEach((pattern) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          this.redactions.push({
            type: 'secret',
            pattern: pattern.toString(),
            value: match,
            redactedAt: new Date().toISOString(),
          });
        });
      }
      sanitized = sanitized.replace(pattern, config.redactionMarker);
    });

    // Apply PII patterns
    config.policies.piiPatterns.forEach((pattern) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          this.redactions.push({
            type: 'pii',
            pattern: pattern.toString(),
            value: match,
            redactedAt: new Date().toISOString(),
          });
        });
      }
      sanitized = sanitized.replace(pattern, config.redactionMarker);
    });

    // Check truncation
    let truncated = false;
    if (sanitized.length > config.truncation.maxInputLength) {
      sanitized = sanitized.substring(0, config.truncation.maxInputLength);
      truncated = true;
    }

    return {
      sanitized,
      redactions: this.redactions,
      truncated,
      originalLength: input.length,
      sanitizedLength: sanitized.length,
    };
  }

  /**
   * Get redaction count by type
   */
  getRedactionStats() {
    const stats = {};
    this.redactions.forEach((redaction) => {
      stats[redaction.type] = (stats[redaction.type] || 0) + 1;
    });
    return stats;
  }
}

module.exports = InputSanitizer;
