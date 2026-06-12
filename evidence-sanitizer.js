/**
 * Evidence Sanitizer
 * Sanitizes observations/responses from the LLM
 * Prevents accidentally exfiltrating sensitive data that was in the model's training
 */

const config = require('./audit-config');

class EvidenceSanitizer {
  constructor() {
    this.sanitizations = [];
  }

  /**
   * Sanitize evidence from LLM response
   * @param {string} evidence - Raw evidence text from LLM
   * @returns {Object} { sanitized: string, sanitizations: Array, truncated: boolean }
   */
  sanitize(evidence) {
    let sanitized = evidence;
    this.sanitizations = [];

    // Apply secret patterns
    config.policies.secretPatterns.forEach((pattern) => {
      const matches = sanitized.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          this.sanitizations.push({
            type: 'secret',
            pattern: pattern.toString(),
            detectedInResponse: true,
            sanitizedAt: new Date().toISOString(),
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
          this.sanitizations.push({
            type: 'pii',
            pattern: pattern.toString(),
            detectedInResponse: true,
            sanitizedAt: new Date().toISOString(),
          });
        });
      }
      sanitized = sanitized.replace(pattern, config.redactionMarker);
    });

    // Check truncation
    let truncated = false;
    if (sanitized.length > config.truncation.maxEvidenceLength) {
      sanitized = sanitized.substring(0, config.truncation.maxEvidenceLength);
      truncated = true;
    }

    return {
      sanitized,
      sanitizations: this.sanitizations,
      truncated,
      originalLength: evidence.length,
      sanitizedLength: sanitized.length,
    };
  }

  /**
   * Get sanitization statistics
   */
  getSanitizationStats() {
    const stats = {};
    this.sanitizations.forEach((san) => {
      stats[san.type] = (stats[san.type] || 0) + 1;
    });
    return stats;
  }
}

module.exports = EvidenceSanitizer;
