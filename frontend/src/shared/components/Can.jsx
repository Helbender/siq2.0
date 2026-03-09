import { useAuth } from "@features/auth";

/**
 * Can - Renders children when user has at least the given role level.
 * Prefer permission-based checks when available.
 */
export function Can({ minLevel, children, fallback = null }) {
  const { user } = useAuth();
  const userRoleLevel = user?.roleLevel || user?.role?.level;

  if (!user || !userRoleLevel || userRoleLevel < minLevel) {
    return fallback;
  }

  return children;
}
