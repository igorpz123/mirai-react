/**
 * Validation utilities for common input checks
 */

/**
 * Validates that a required string field is present and not empty after trimming
 */
export function validateRequiredString(
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } {
  if (!value || String(value).trim() === '') {
    return { valid: false, error: `${fieldName} é obrigatório` }
  }
  return { valid: true }
}

/**
 * Validates that a required field is present
 */
export function validateRequired(
  value: unknown,
  fieldName: string
): { valid: boolean; error?: string } {
  if (value === undefined || value === null) {
    return { valid: false, error: `${fieldName} é obrigatório` }
  }
  return { valid: true }
}

/**
 * Validates multiple required string fields at once
 * Returns the first error found or null if all valid
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  fields: string[]
): string | null {
  for (const field of fields) {
    const result = validateRequiredString(data[field], field)
    if (!result.valid) {
      return result.error!
    }
  }
  return null
}
