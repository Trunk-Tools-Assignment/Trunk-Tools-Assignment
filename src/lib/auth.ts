/**
 * Authentication utility functions
 * @module auth
 */

/**
 * Extracts the user ID from the Authorization header
 * Parses a Bearer token to get the user identifier
 *
 * @param {Object} headers - The HTTP request headers
 * @param {string} [headers.authorization] - The authorization header
 * @returns {string|null} The user ID extracted from the token or null if invalid/missing
 * @example
 * // With valid authorization header
 * const userId = extractUserId({ authorization: 'Bearer user123' }); // Returns 'user123'
 *
 * // With invalid or missing authorization header
 * const userId = extractUserId({ }); // Returns null
 */
export const extractUserId = (
  headers: Record<string, string | string[] | undefined>,
): string | null => {
  const authHeader = headers.authorization;
  if (
    !authHeader ||
    typeof authHeader !== 'string' ||
    !authHeader.startsWith('Bearer ')
  ) {
    return null;
  }
  return authHeader.split(' ')[1];
};
