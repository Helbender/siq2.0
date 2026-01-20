import { useAuth } from "@/features/auth/contexts/AuthContext";

/**
 * Can component - Conditionally renders children based on user role level.
 * 
 * @param {Object} props
 * @param {number} props.minLevel - Minimum role level required to render children
 * @param {React.ReactNode} props.children - Children to render if user has sufficient level
 * @param {React.ReactNode} props.fallback - Optional fallback to render if user doesn't have permission
 * @returns {React.ReactNode|null} Children if authorized, fallback or null otherwise
 */
export function Can({ minLevel, children, fallback = null }) {
  const { user } = useAuth();
  
  // Get role level from user object (supports both roleLevel and role.level)
  const userRoleLevel = user?.roleLevel || user?.role?.level;
  
  if (!user || !userRoleLevel || userRoleLevel < minLevel) {
    return fallback;
  }
  
  return children;
}
