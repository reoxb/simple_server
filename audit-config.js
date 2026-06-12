/**
 * Audit Configuration
 * Define security policies, sanitization rules, and LLM parameters
 */

module.exports = {
  // Security policies
  policies: {
    // Secrets that must never reach the LLM
    secretPatterns: [
      /api[_-]?key/gi,
      /secret[_-]?key/gi,
      /password/gi,
      /auth[_-]?token/gi,
      /bearer\s+[a-z0-9]+/gi,
      /db[_-]?password/gi,
      /private[_-]?key/gi,
      /oauth[_-]?token/gi,
      /aws[_-]?secret/gi,
    ],

    // PII patterns
    piiPatterns: [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b\d{16}\b/g, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    ],
  },

  // LLM Configuration
  llm: {
    // Temperature controls output variability
    // 0 = deterministic, 1 = more creative
    temperature: 0.2, // Conservative for audit tasks
    maxTokens: 500,
    model: 'gpt-3.5-turbo', // Placeholder
  },

  // Truncation policy
  truncation: {
    maxInputLength: 4000,
    maxEvidenceLength: 2000,
  },

  // Audit logging
  audit: {
    recordRedactions: true,
    recordTruncation: true,
    recordLlmUsage: true,
  },

  // Redaction marker
  redactionMarker: '[REDACTED]',
};
