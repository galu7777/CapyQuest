/**
 * Validates multiple required fields
 * @param {Object} fields - Object with field names as keys and their values
 * @returns {Object|null} - Returns validation error object or null if all fields are valid
 */
exports.validateRequiredFields = (fields) => {
  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    // Check if field is undefined, null, empty string or contains only whitespace
    if (!fieldValue || 
        fieldValue.length === 0 || 
        (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
      return {
        status: 400,
        message: `${fieldName} es requerido`
      };
    }
  }
  return null;
};