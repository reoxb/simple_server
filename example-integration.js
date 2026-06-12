/**
 * Example Integration
 * Shows how to integrate the audit pipeline into existing Express routes
 */

const express = require('express');
const createAuditMiddleware = require('./audit-middleware');
const AuditRun = require('./audit-run');

// Example Express app integration
function setupAuditRoutes(app) {
  // Apply audit middleware to all POST requests
  app.use(
    createAuditMiddleware({
      schemas: {
        analysisTask: {
          fields: {
            input: { type: 'string', required: true },
            llmResult: { type: 'string', required: false },
            timestamp: { type: 'string', required: true },
          },
        },
      },
      policies: {
        maxRedactionsAllowed: 5,
        blockOnTruncation: true,
        maxSensitivityScore: 0.8,
      },
    })
  );

  /**
   * POST /analyze
   * Example endpoint that uses the audit pipeline
   */
  app.post('/analyze', async (req, res) => {
    try {
      const { input } = req.body;

      if (!input) {
        return res.status(400).json({ error: 'Missing input field' });
      }

      // Execute audit pipeline
      const auditResult = await req.executeAudit(input, 'analysisTask');

      // Return audit result with full provenance
      res.json({
        success: true,
        auditId: auditResult.id,
        analysis: auditResult.output?.llmResult || 'LLM not executed',
        provenance: {
          llmUsed: auditResult.provenance.llmExecution.used,
          inputRedactions: auditResult.provenance.inputSanitization.redactions,
          policyDecision: auditResult.provenance.policyDecision.allowed,
          evidenceSanitized: auditResult.provenance.evidenceSanitization?.sanitizations || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Analysis failed',
        message: error.message,
      });
    }
  });

  /**
   * POST /audit-report
   * Get detailed audit report
   */
  app.post('/audit-report', async (req, res) => {
    try {
      const { input } = req.body;

      if (!input) {
        return res.status(400).json({ error: 'Missing input field' });
      }

      // Execute audit pipeline
      const auditResult = await req.executeAudit(input, 'analysisTask');

      // Return full audit report
      res.json(auditResult);
    } catch (error) {
      res.status(500).json({
        error: 'Audit report failed',
        message: error.message,
      });
    }
  });

  /**
   * POST /action_post (Enhanced original endpoint)
   * Now with audit trail
   */
  app.post('/action_post_audited', async (req, res) => {
    try {
      const { requestData } = req.body;

      if (!requestData) {
        return res.status(400).json({ error: 'Missing requestData field' });
      }

      // Execute audit pipeline
      const auditResult = await req.executeAudit(
        JSON.stringify(requestData),
        'analysisTask'
      );

      // Process the audited data
      // (Original action_post logic here)

      res.json({
        success: true,
        message: 'Send ok',
        auditId: auditResult.id,
        auditTrail: auditResult.steps,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Action failed',
        message: error.message,
      });
    }
  });
}

module.exports = { setupAuditRoutes };

// Usage example:
// const app = require('express')();
// setupAuditRoutes(app);
// app.listen(8080);
