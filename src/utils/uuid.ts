/**
 * UUID v4 Generator
 * 
 * Generates RFC 4122 compliant UUIDs using cryptographically secure random values.
 * This implementation uses the Web Crypto API for better randomness.
 */

export function generateUUID(): string {
  // Use Web Crypto API if available for better randomness
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for environments without crypto.randomUUID
  return generateUUIDFallback();
}

/**
 * Fallback UUID v4 generator
 * 
 * This is a fallback implementation that generates UUIDs using Math.random()
 * when crypto.randomUUID is not available. While not cryptographically secure,
 * it's sufficient for most use cases.
 */
function generateUUIDFallback(): string {
  const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  
  return pattern.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validates if a string is a valid UUID v4
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generates a short UUID (8 characters) for display purposes
 */
export function generateShortUUID(): string {
  return generateUUID().replace(/-/g, '').substring(0, 8);
}

/**
 * Generates a task-specific UUID with prefix
 */
export function generateTaskUUID(): string {
  return `task-${generateShortUUID()}`;
}

/**
 * Generates a project-specific UUID with prefix
 */
export function generateProjectUUID(): string {
  return `proj-${generateShortUUID()}`;
} 