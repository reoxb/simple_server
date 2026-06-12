# LLM Audit Pipeline with Deterministic Barriers

## Overview

This implementation provides a robust architecture for integrating probabilistic LLM models into deterministic systems (CI/CD, audits) without compromising security or stability.

**Core Principle:** Surround the probabilistic LLM with deterministic security barriers.

## Architecture

```
┌─────────────────────┐
│    Raw Input        │
│  (may contain       │
│   secrets/PII)      │
└──────────┬──────────┘
           │
           ▼
   ┌───────────────────┐
   │ INPUT SANITIZER   │  ◄─ Barrier 1
   │ - Secret redaction│     (Removes secrets before LLM sees them)
   │ - PII masking     │
   │ - Truncation      │
   └───────┬───────────┘
           │
           ▼
   ┌───────────────────┐
   │ SCHEMA PARSER     │  ◄─ Barrier 2
   │ - Type validation │     (Ensures predictable structure)
   │ - Field checking  │
   └───────┬───────────┘
           │
           ▼
   ┌───────────────────┐
   │ AUDIT POLICY      │  ◄─ Barrier 3
   │  FILTER           │     (Gate: Should we trust LLM?)
   │ - Redaction count │
   │ - Truncation      │
   │ - Sensitivity     │
   └───────┬───────────┘
           │
      ┌────┴─────┐
      │ Allowed? │
      └────┬─────┘
           │
        No │              Yes
        ┌──▼───┐         ┌────▼──────┐
        │Block │         │   LLM     │
        │      │         │   CALL    │
        └──────┘         └────┬──────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ EVIDENCE         │  ◄─ Barrier 4
                    │ SANITIZER        │     (Catches LLM-leaked secrets)
                    │ - Secret redaction│
                    │ - PII masking    │
                    │ - Truncation     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ AUDIT RUN        │
                    │ (Complete        │
                    │  provenance)     │
                    └──────────────────┘
```

## Components

### 1. **InputSanitizer** (`input-sanitizer.js`)

Removes secrets and PII before the LLM sees them.

```javascript
const InputSanitizer = require('./input-sanitizer');
const sanitizer = new InputSanitizer();

const result = sanitizer.sanitize('My API key is sk_live_abc123');
console.log(result.sanitized); // 'My API key is [REDACTED]'
console.log(result.redactions); // [{ type: 'secret', ... }]
```

**Features:**
- Regex-based secret detection
- PII pattern matching (SSN, credit cards, emails)
- Redaction tracking
- Truncation detection

### 2. **SchemaParser** (`schema-parser.js`)

Validates data structure and types.

```javascript
const SchemaParser = require('./schema-parser');
const parser = new SchemaParser({
  auditTask: {
    fields: {
      input: { type: 'string', required: true },
      timestamp: { type: 'string', required: true },
    },
  },
});

const result = parser.parse(data, 'auditTask');
console.log(result.valid); // true/false
console.log(result.errors); // validation errors
```

**Features:**
- Type checking (string, number, array, etc.)
- Required field validation
- Custom validators
- Unknown field rejection

### 3. **AuditPolicyFilter** (`audit-policy-filter.js`)

Decides whether to execute LLM based on security policies.

```javascript
const filter = new AuditPolicyFilter({
  maxRedactionsAllowed: 5,
  blockOnTruncation: true,
  maxSensitivityScore: 0.8,
});

const decision = filter.evaluate({
  inputRedactions: redactions,
  inputTruncated: false,
});

console.log(decision.allowed); // true/false
console.log(decision.reason); // Why
```

**Policies:**
- **Redaction Threshold:** Too many redactions = don't trust LLM
- **Truncation Blocking:** Incomplete input = don't use LLM
- **Sensitivity Score:** High-risk evidence = block output

### 4. **EvidenceSanitizer** (`evidence-sanitizer.js`)

Sanitizes LLM responses to catch accidentally leaked secrets.

```javascript
const EvidenceSanitizer = require('./evidence-sanitizer');
const sanitizer = new EvidenceSanitizer();

const result = sanitizer.sanitize(llmResponse);
console.log(result.sanitized); // Safe for output
console.log(result.sanitizations); // What was found
```

### 5. **LLMProvider** (`llm-provider.js`)

Encapsulates the probabilistic model.

```javascript
const LLMProvider = require('./llm-provider');
const llm = new LLMProvider();

llm.setTemperature(0.2); // Conservative (0 = deterministic)
const response = await llm.call(sanitizedInput);
```

**Temperature Control:**
- `0.0` = Deterministic (always same answer)
- `0.2` = Conservative (slightly random, good for audits)
- `0.7` = Creative (more variation)
- `1.0` = Maximum randomness

### 6. **AuditRun** (`audit-run.js`)

Orchestrates the complete pipeline with full provenance tracking.

```javascript
const AuditRun = require('./audit-run');
const run = new AuditRun({
  schemas: { auditTask: {...} },
  policies: { maxRedactionsAllowed: 5 },
});

const result = await run.execute(
  'my input',
  'auditTask'
);

console.log(result.provenance); // Complete audit trail
```

**Output Includes:**
- ✅ Input redactions (count & types)
- ✅ Policy decision (allow/block)
- ✅ Whether LLM was used
- ✅ Evidence sanitizations
- ✅ Schema validation results
- ✅ All steps with timestamps

## Metrics: Precision vs. Recall

### **Precision** (Avoid False Positives)
- Redactions that were actually secrets: **Precision = TP / (TP + FP)**
- Run with low temperature (0.1-0.3) for conservative redaction

### **Recall** (Detect All Secrets)
- Proportion of actual secrets detected: **Recall = TP / (TP + FN)**
- Run with higher temperature (0.4-0.6) to catch edge cases

### **Testing Protocol**

```javascript
const testSuite = [
  { input: 'api_key=sk_live_abc123', expected: 'secret' },
  { input: 'My SSN is 123-45-6789', expected: 'pii' },
  { input: 'Normal text', expected: 'none' },
];

for (const test of testSuite) {
  const run = new AuditRun(...);
  const result = await run.execute(test.input, 'auditTask');
  console.log(`Test: ${test.expected}, Result: ${result.provenance.inputSanitization.redactions.length > 0 ? 'DETECTED' : 'NOT_DETECTED'}`);
}
```

## Integration Examples

### Express Middleware

```javascript
const createAuditMiddleware = require('./audit-middleware');
const app = require('express')();

app.use(createAuditMiddleware({
  schemas: { /* ... */ },
  policies: { /* ... */ },
}));

app.post('/analyze', async (req, res) => {
  const auditResult = await req.executeAudit(req.body.input);
  res.json(auditResult);
});
```

### Standalone Usage

```bash
node test-audit-pipeline.js
```

## Running Tests

```bash
# Test all components
node test-audit-pipeline.js

# Example output:
# === Test Case 1: Clean Input ===
# Audit ID: audit-1718190348000-abc123def
# LLM Used: true
# Input Redactions: 0
# Policy Decision: true
# Steps: 5

# === Test Case 2: Input with Secrets ===
# Input Redactions Count: 2
# Redactions by Type: { secret: 2 }
# Policy Allowed: true
```

## Key Benefits

✅ **Security:** Secrets never reach the LLM  
✅ **Transparency:** Complete audit trail ("Why did we trust the LLM?")  
✅ **Reliability:** Deterministic barriers around probabilistic model  
✅ **Measurable:** Precision/Recall metrics for redaction rules  
✅ **Opt-in:** LLM rules explicitly allowed in metadata  
✅ **Production-Ready:** CI/CD and auditing workflows  

## Next Steps

1. **Calibrate Rules:** Adjust regex patterns for your use cases
2. **Tune Temperature:** Find optimal T for precision/recall
3. **Validate with Real Prompts:** Test against actual audit data
4. **Monitor Metrics:** Track redaction accuracy over time
5. **Iterate:** Refine policies based on production results

## References

- Configuration: `audit-config.js`
- Complete Test Suite: `test-audit-pipeline.js`
- Integration Example: `example-integration.js`
