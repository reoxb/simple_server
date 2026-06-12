/**
 * LLM Provider
 * Probabilistic model integration with configurable temperature
 * Simulates LLM calls (replace with actual API in production)
 */

const config = require('./audit-config');

class LLMProvider {
  constructor() {
    this.temperature = config.llm.temperature;
    this.model = config.llm.model;
    this.callHistory = [];
  }

  /**
   * Set temperature for this call (controls randomness)
   * @param {number} temp - Temperature 0-1
   */
  setTemperature(temp) {
    this.temperature = Math.max(0, Math.min(1, temp));
  }

  /**
   * Call the LLM (simulated)
   * In production, replace with actual API call (OpenAI, Claude, etc.)
   * @param {string} prompt - The sanitized prompt
   * @returns {Promise<string>} - LLM response
   */
  async call(prompt) {
    // Simulate API call with variable response based on temperature
    return new Promise((resolve) => {
      setTimeout(() => {
        const response = this._generateMockResponse(prompt);
        
        this.callHistory.push({
          model: this.model,
          temperature: this.temperature,
          promptLength: prompt.length,
          responseLength: response.length,
          timestamp: new Date().toISOString(),
        });

        resolve(response);
      }, Math.random() * 100);
    });
  }

  /**
   * Generate mock LLM response (for demonstration)
   * @private
   */
  _generateMockResponse(prompt) {
    // Simple deterministic response for testing
    if (prompt.includes('query')) {
      return 'This appears to be a database query. Ensure proper parameterization.';
    }
    if (prompt.includes('policy')) {
      return 'Policy compliance check passed.';
    }
    if (prompt.includes('audit')) {
      return 'Audit trail is properly maintained.';
    }
    return 'Analysis complete.';
  }

  /**
   * Get call statistics
   */
  getStats() {
    if (this.callHistory.length === 0) {
      return { calls: 0 };
    }

    const avgPromptLen =
      this.callHistory.reduce((sum, c) => sum + c.promptLength, 0) /
      this.callHistory.length;
    const avgResponseLen =
      this.callHistory.reduce((sum, c) => sum + c.responseLength, 0) /
      this.callHistory.length;

    return {
      calls: this.callHistory.length,
      avgPromptLength: Math.round(avgPromptLen),
      avgResponseLength: Math.round(avgResponseLen),
      temperature: this.temperature,
    };
  }
}

module.exports = LLMProvider;
