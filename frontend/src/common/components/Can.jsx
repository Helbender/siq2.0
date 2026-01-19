import { useAuth } from "@/features/auth/contexts/AuthContext";

/**
 * Can component - Conditionally renders children based on user role level.
 * 
 * @param {Object} props
 * @param {number} props.minLevel - Minimum role level required to render children
 * @param {React.ReactNode} props.children - Children to render if user has sufficient level
 * @returns {React.ReactNode|null} Children if authorized, null otherwise
 */
export function Can({ minLevel, children }) {
  const { user } = useAuth();
  
  // Default to lowest level (20 - readonly) if roleLevel is not set
  const userRoleLevel = user?.roleLevel ?? 20;
  
  if (!user || userRoleLevel < minLevel) {
    return null;
  }
  
  return children;
}
