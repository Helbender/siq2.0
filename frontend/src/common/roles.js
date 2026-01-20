/**
 * Role enum matching backend Role enum.
 * These values represent the numeric levels for each role.
 */
export const Role = {
  SUPER_ADMIN: 100,
  UNIF: 80,
  FLYERS: 60,
  USER: 40,
  READONLY: 20,
};

/**
 * Role display names mapping.
 */
export const RoleNames = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.UNIF]: "UNIF",
  [Role.FLYERS]: "Flyers",
  [Role.USER]: "User",
  [Role.READONLY]: "Readonly",
};

/**
 * Get role display name from role level.
 * @param {number} roleLevel - The role level number
 * @returns {string} Display name for the role
 */
export function getRoleName(roleLevel) {
  return RoleNames[roleLevel] || `Unknown (${roleLevel})`;
}

/**
 * Get all role options for select dropdowns.
 * @returns {Array<{value: number, label: string}>} Array of role options
 */
export function getRoleOptions() {
  return Object.entries(RoleNames)
    .map(([level, name]) => ({
      value: parseInt(level, 10),
      label: name,
    }))
    .sort((a, b) => b.value - a.value); // Sort descending by level
}

/**
 * Get role options filtered by current user's role level.
 * Users can only assign roles at or below their own level.
 * @param {number} currentUserRoleLevel - The current user's role level
 * @returns {Array<{value: number, label: string}>} Filtered array of role options
 */
export function getRoleOptionsForUser(currentUserRoleLevel) {
  if (!currentUserRoleLevel) {
    return [];
  }
  return getRoleOptions().filter((option) => option.value <= currentUserRoleLevel);
}

/**
 * Check if a user can modify another user based on role levels.
 * Users can only modify users at or below their own level.
 * READONLY users can only modify their own data.
 * @param {number} currentUserRoleLevel - The current user's role level
 * @param {number} targetUserRoleLevel - The target user's role level
 * @param {number|string} currentUserNip - The current user's NIP
 * @param {number|string} targetUserNip - The target user's NIP
 * @returns {boolean} True if current user can modify target user
 */
export function canModifyUser(currentUserRoleLevel, targetUserRoleLevel, currentUserNip, targetUserNip) {
  if (!currentUserRoleLevel) {
    return false;
  }
  
  // READONLY users can only modify their own data
  if (currentUserRoleLevel === Role.READONLY) {
    return currentUserNip === targetUserNip;
  }
  
  // If target user has no role level, default to USER level (40)
  const targetLevel = targetUserRoleLevel || Role.USER;
  return currentUserRoleLevel >= targetLevel;
}
