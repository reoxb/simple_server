/**
 * Audit Middleware
 * Express middleware for easy integration of LLM audit pipeline
 */

const AuditRun = require('./audit-run');

/**
 * Create audit middleware
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function createAuditMiddleware(options = {}) {
  const defaultSchemas = {
    auditTask: {
      fields: {
        input: { type: 'string', required: true },
        llmResult: { type: 'string', required: false },
        timestamp: { type: 'string', required: true },
      },
    },
  };

  const schemas = { ...defaultSchemas, ...options.schemas };
  const policies = options.policies || {};

  return async (req, res, next) => {
    try {
      // Skip audit for non-POST requests or if disabled
      if (req.method !== 'POST' || req.skipAudit) {
        return next();
      }

      // Create audit run
      const auditRun = new AuditRun({
        schemas,
        policies,
      });

      // Attach to request for access in route handlers
      req.audit = auditRun;

      // Add helper method to execute audit
      req.executeAudit = async (input, schemaName = 'auditTask') => {
        return await auditRun.execute(input, schemaName);
      };

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Audit middleware error',
        message: error.message,
      });
    }
  };
}

module.exports = createAuditMiddleware;
