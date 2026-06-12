/**
 * Schema Parser
 * Validates and parses structured data according to predefined schemas
 * Ensures type safety and prevents unexpected data shapes
 */

class SchemaParser {
  constructor(schemas = {}) {
    this.schemas = schemas;
  }

  /**
   * Register a schema for a data type
   * @param {string} name - Schema name
   * @param {Object} schema - Schema definition
   */
  registerSchema(name, schema) {
    this.schemas[name] = schema;
  }

  /**
   * Parse and validate data against schema
   * @param {Object} data - Data to parse
   * @param {string} schemaName - Name of schema to use
   * @returns {Object} { valid: boolean, data: Object, errors: Array }
   */
  parse(data, schemaName) {
    if (!this.schemas[schemaName]) {
      return {
        valid: false,
        data: null,
        errors: [`Schema '${schemaName}' not found`],
      };
    }

    const schema = this.schemas[schemaName];
    const errors = [];
    const parsed = {};

    // Validate required fields
    Object.keys(schema.fields || {}).forEach((field) => {
      const fieldSchema = schema.fields[field];
      const value = data[field];

      // Check required
      if (fieldSchema.required && (value === undefined || value === null)) {
        errors.push(`Required field '${field}' is missing`);
        return;
      }

      // Check type
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (fieldSchema.type && actualType !== fieldSchema.type) {
          errors.push(
            `Field '${field}' has invalid type. Expected ${fieldSchema.type}, got ${actualType}`
          );
          return;
        }

        // Apply custom validator if present
        if (fieldSchema.validator && !fieldSchema.validator(value)) {
          errors.push(`Field '${field}' failed custom validation`);
          return;
        }
      }

      parsed[field] = value;
    });

    // Reject unknown fields
    Object.keys(data).forEach((key) => {
      if (!schema.fields || !schema.fields[key]) {
        errors.push(`Unknown field '${key}'`);
      }
    });

    return {
      valid: errors.length === 0,
      data: errors.length === 0 ? parsed : null,
      errors,
    };
  }
}

module.exports = SchemaParser;
