/**
 * Role enum matching backend Role enum.
 */
export const Role = {
  SUPER_ADMIN: 100,
  UNIF: 80,
  FLYERS: 60,
  USER: 40,
  READONLY: 20,
};

export const RoleNames = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.UNIF]: "UNIF",
  [Role.FLYERS]: "Flyers",
  [Role.USER]: "User",
  [Role.READONLY]: "Readonly",
};

export function getRoleName(roleLevel) {
  return RoleNames[roleLevel] || `Unknown (${roleLevel})`;
}

export function getRoleOptions() {
  return Object.entries(RoleNames)
    .map(([level, name]) => ({
      value: parseInt(level, 10),
      label: name,
    }))
    .sort((a, b) => b.value - a.value);
}

export function getRoleOptionsForUser(currentUserRoleLevel) {
  if (!currentUserRoleLevel) return [];
  return getRoleOptions().filter((option) => option.value <= currentUserRoleLevel);
}

export function canModifyUser(currentUserRoleLevel, targetUserRoleLevel, currentUserNip, targetUserNip) {
  if (!currentUserRoleLevel) return false;
  if (currentUserRoleLevel === Role.READONLY) {
    return currentUserNip === targetUserNip;
  }
  const targetLevel = targetUserRoleLevel || Role.USER;
  return currentUserRoleLevel >= targetLevel;
}
