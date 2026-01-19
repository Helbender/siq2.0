/**
 * Utility functions for JWT token handling
 */

/**
 * Decode JWT token without verification (to get expiration time)
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded token payload or null if invalid
 */
export function decodeJWT(token) {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Decode payload (second part)
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = atob(paddedPayload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Get token expiration time in milliseconds
 * @param {string} token - JWT token string
 * @returns {number|null} Expiration timestamp in milliseconds or null if invalid
 */
export function getTokenExpiration(token) {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return null;

  // JWT exp is in seconds, convert to milliseconds
  return decoded.exp * 1000;
}

/**
 * Check if token is expired or will expire soon
 * @param {string} token - JWT token string
 * @param {number} bufferSeconds - Buffer time in seconds before expiration (default: 120 = 2 minutes)
 * @returns {boolean} True if token is expired or will expire within buffer time
 */
export function isTokenExpiringSoon(token, bufferSeconds = 120) {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true; // Consider invalid tokens as expired

  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;
  
  // Token is expiring soon if expiration is within buffer time
  return expiration - now <= bufferMs;
}

/**
 * Get time until token expires in milliseconds
 * @param {string} token - JWT token string
 * @returns {number|null} Milliseconds until expiration or null if invalid
 */
export function getTimeUntilExpiration(token) {
  const expiration = getTokenExpiration(token);
  if (!expiration) return null;

  const now = Date.now();
  return Math.max(0, expiration - now);
}
