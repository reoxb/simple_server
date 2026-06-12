/**
 * Metrics Calculator
 * Deterministic calculation of Precision, Recall, F1 Score, and Accuracy
 * This belongs in CODE, not in LLM prompts
 */

class MetricsCalculator {
  /**
   * Calculate metrics from confusion matrix
   * @param {Array} testCases - Array of { actual: boolean, predicted: boolean }
   * @returns {Object} Metrics and confusion matrix
   */
  static calculateMetrics(testCases) {
    const confusionMatrix = this._buildConfusionMatrix(testCases);
    const metrics = this._computeMetrics(confusionMatrix);
    const patternMetrics = this._analyzeByPattern(testCases);

    return {
      metrics,
      confusion_matrix: confusionMatrix,
      test_set_size: testCases.length,
      pattern_effectiveness: patternMetrics,
    };
  }

  /**
   * Build confusion matrix from test results
   * @private
   */
  static _buildConfusionMatrix(testCases) {
    let TP = 0; // True Positive: correctly flagged as secret
    let FP = 0; // False Positive: incorrectly flagged as secret
    let FN = 0; // False Negative: secret not flagged
    let TN = 0; // True Negative: correctly ignored

    testCases.forEach(({ actual, predicted, pattern }) => {
      if (actual === true && predicted === true) TP++; // Correct redaction
      else if (actual === false && predicted === true) FP++; // Wrong redaction
      else if (actual === true && predicted === false) FN++; // Missed secret
      else if (actual === false && predicted === false) TN++; // Correct non-redaction
    });

    return { TP, FP, FN, TN };
  }

  /**
   * Compute precision, recall, F1, accuracy
   * @private
   */
  static _computeMetrics(confusionMatrix) {
    const { TP, FP, FN, TN } = confusionMatrix;

    // Precision: TP / (TP + FP) — How many redactions were correct?
    const precision =
      TP + FP === 0 ? 1.0 : TP / (TP + FP);

    // Recall: TP / (TP + FN) — How many secrets did we catch?
    const recall =
      TP + FN === 0 ? 1.0 : TP / (TP + FN);

    // F1 Score: 2 * (precision * recall) / (precision + recall)
    const f1_score =
      precision + recall === 0
        ? 0
        : 2 * (precision * recall) / (precision + recall);

    // Accuracy: (TP + TN) / (TP + FP + FN + TN)
    const total = TP + FP + FN + TN;
    const accuracy = total === 0 ? 0 : (TP + TN) / total;

    return {
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1_score: Math.round(f1_score * 1000) / 1000,
      accuracy: Math.round(accuracy * 1000) / 1000,
    };
  }

  /**
   * Analyze metrics by pattern type
   * @private
   */
  static _analyzeByPattern(testCases) {
    const patternResults = {};

    testCases.forEach(({ pattern, actual, predicted }) => {
      if (!patternResults[pattern]) {
        patternResults[pattern] = { TP: 0, FP: 0, FN: 0, TN: 0 };
      }

      if (actual === true && predicted === true) patternResults[pattern].TP++;
      else if (actual === false && predicted === true) patternResults[pattern].FP++;
      else if (actual === true && predicted === false) patternResults[pattern].FN++;
      else patternResults[pattern].TN++;
    });

    // Convert to metrics per pattern
    const effectiveness = {};
    Object.entries(patternResults).forEach(([pattern, matrix]) => {
      const { TP, FP, FN, TN } = matrix;
      const precision = TP + FP === 0 ? 1.0 : TP / (TP + FP);
      const recall = TP + FN === 0 ? 1.0 : TP / (TP + FN);
      const f1 = precision + recall === 0 ? 0 : 2 * (precision * recall) / (precision + recall);

      effectiveness[pattern] = {
        precision: Math.round(precision * 1000) / 1000,
        recall: Math.round(recall * 1000) / 1000,
        f1_score: Math.round(f1 * 1000) / 1000,
        test_count: TP + FP + FN + TN,
      };
    });

    return effectiveness;
  }

  /**
   * Compare two metric sets (before/after improvement)
   */
  static compareMetrics(baseline, improved) {
    return {
      precision_delta: improved.metrics.precision - baseline.metrics.precision,
      recall_delta: improved.metrics.recall - baseline.metrics.recall,
      f1_delta: improved.metrics.f1_score - baseline.metrics.f1_score,
      tp_delta: improved.confusion_matrix.TP - baseline.confusion_matrix.TP,
      fp_delta: improved.confusion_matrix.FP - baseline.confusion_matrix.FP,
      fn_delta: improved.confusion_matrix.FN - baseline.confusion_matrix.FN,
    };
  }
}

module.exports = MetricsCalculator;
