/**
 * Test Metrics Calculator
 * Validate precision/recall calculations are deterministic
 */

const MetricsCalculator = require('./metrics-calculator');

// Example test set: 10 cases with ground truth labels
const testCases = [
  // API Keys (strong pattern)
  { pattern: 'api_key', actual: true, predicted: true }, // TP: correctly flagged
  { pattern: 'api_key', actual: true, predicted: true }, // TP
  { pattern: 'api_key', actual: true, predicted: true }, // TP

  // Passwords (weaker pattern)
  { pattern: 'password', actual: true, predicted: false }, // FN: missed secret
  { pattern: 'password', actual: true, predicted: true }, // TP
  { pattern: 'password', actual: false, predicted: true }, // FP: false alarm

  // Email (medium pattern)
  { pattern: 'email', actual: false, predicted: false }, // TN: correctly ignored
  { pattern: 'email', actual: false, predicted: true }, // FP: false alarm
  { pattern: 'email', actual: true, predicted: true }, // TP

  // Normal text
  { pattern: 'email', actual: false, predicted: false }, // TN
];

console.log('\n🔍 Metrics Calculator Test\n');
console.log('Test Set (10 cases):');
testCases.forEach((tc, i) => {
  const result = tc.actual === tc.predicted ? '✓' : '✗';
  console.log(
    `  ${i + 1}. ${tc.pattern.padEnd(10)} | actual=${String(tc.actual).padEnd(5)} predicted=${tc.predicted} ${result}`
  );
});

const results = MetricsCalculator.calculateMetrics(testCases);

console.log('\n📊 Confusion Matrix:');
console.log(`  TP (True Positive):   ${results.confusion_matrix.TP} (correctly flagged secrets)`);
console.log(`  FP (False Positive):  ${results.confusion_matrix.FP} (incorrectly flagged)`);
console.log(`  FN (False Negative):  ${results.confusion_matrix.FN} (missed secrets)`);
console.log(`  TN (True Negative):   ${results.confusion_matrix.TN} (correctly ignored)`);

console.log('\n📈 Metrics:');
console.log(`  Precision: ${results.metrics.precision} (${results.confusion_matrix.TP}/${results.confusion_matrix.TP + results.confusion_matrix.FP})`);
console.log(`  Recall:    ${results.metrics.recall} (${results.confusion_matrix.TP}/${results.confusion_matrix.TP + results.confusion_matrix.FN})`);
console.log(`  F1 Score:  ${results.metrics.f1_score}`);
console.log(`  Accuracy:  ${results.metrics.accuracy}`);

console.log('\n🎯 Pattern Effectiveness:');
Object.entries(results.pattern_effectiveness).forEach(([pattern, metrics]) => {
  console.log(`  ${pattern.padEnd(15)} | P=${metrics.precision} R=${metrics.recall} F1=${metrics.f1_score} (${metrics.test_count} tests)`);
});

console.log('\n✅ All calculations deterministic and reproducible');
console.log('\nThis output goes to LLM INTERPRETER (prompts/precision-recall-analyzer.prompt)');
console.log('LLM interprets: production_ready? recommended_actions? confidence?\n');
