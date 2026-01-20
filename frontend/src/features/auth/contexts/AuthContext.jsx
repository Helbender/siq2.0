import { http, setLoggingOut } from "@/api/http";
import { isTokenExpiringSoon } from "@/utils/jwt";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef } from "react";
import { useLogin } from "../mutations/useLogin";
import { useRegister } from "../mutations/useRegister";
import { useUpdateAuthUser } from "../mutations/useUpdateAuthUser";
import { authQueryKeys, useAuthQuery } from "../queries/useAuthQuery";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading: loading, error } = useAuthQuery();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const updateUserMutation = useUpdateAuthUser();

  // Handle auth errors - clear token if unauthorized
  useEffect(() => {
    if (error) {
      const status = error?.response?.status;
      // Only clear token if it's an actual auth error, not if we're logging out
      if (
        (status === 401 || status === 404 || status === 422) &&
        localStorage.getItem("token") &&
        !localStorage.getItem("loggingOut")
      ) {
        localStorage.removeItem("token");
        queryClient.setQueryData(authQueryKeys.me(), null);
      }
    }
  }, [error, queryClient]);

  // Handle logout event from http interceptor
  useEffect(() => {
    const handleLogout = () => {
      queryClient.setQueryData(authQueryKeys.me(), null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, [queryClient]);

  // Auto-refresh token before expiration (can be disabled via localStorage)
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    // Check if auto-refresh is disabled
    const autoRefreshDisabled = localStorage.getItem("disableAutoRefresh") === "true";
    if (autoRefreshDisabled) {
      console.log("[Auto-refresh] Auto-refresh is disabled");
      return;
    }

    const checkAndRefreshToken = async () => {
      const token = localStorage.getItem("token");
      
      // Don't refresh if logging out or no token
      if (!token || localStorage.getItem("loggingOut")) {
        return;
      }

      // Check if token is expiring soon (within 2 minutes)
      if (isTokenExpiringSoon(token, 120)) {
        try {
          console.log("[Auto-refresh] Token expiring soon, refreshing...");
          // Use refresh token cookie (httpOnly) to get a new JWT access token
          // The http interceptor ensures no Authorization header is sent for /auth/refresh
          // The backend reads the refresh_token cookie and validates it
          const res = await http.post("/auth/refresh");
          const newToken = res.data.access_token;
          
          if (newToken) {
            localStorage.setItem("token", newToken);
            console.log("[Auto-refresh] Token refreshed successfully");
          }
        } catch (error) {
          console.error("[Auto-refresh] Failed to refresh token:", error);
          // If refresh fails with 401 (invalid signature, expired, etc.), stop auto-refresh
          if (error.response?.status === 401) {
            console.log("[Auto-refresh] Refresh token invalid, stopping auto-refresh");
            localStorage.removeItem("token");
            queryClient.setQueryData(authQueryKeys.me(), null);
            // Clear the interval to stop retrying
            if (refreshIntervalRef.current) {
              clearInterval(refreshIntervalRef.current);
              refreshIntervalRef.current = null;
            }
          }
          // The http interceptor will also handle logout for other cases
        }
      }
    };

    // Check token expiration every 60 seconds
    refreshIntervalRef.current = setInterval(checkAndRefreshToken, 60000);

    // Also check immediately when component mounts or user changes
    if (user) {
      checkAndRefreshToken();
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]);

  const login = async (nip, password) => {
    try {
      const result = await loginMutation.mutateAsync({ nip, password });
      return { success: true };
    } catch (e) {
      console.error("Login error:", e);
      // Check if it's a 401 - this shouldn't happen for login, but handle it
      if (e.response?.status === 401) {
        return { success: false, error: "Invalid NIP or password" };
      }
      const errorMessage =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Login failed";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      await registerMutation.mutateAsync({ username, email, password });
      return { success: true };
    } catch (e) {
      const errorMessage =
        e.response?.data?.error || e.message || "Registration failed";
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Set flag to prevent refresh attempts
    setLoggingOut(true);
    localStorage.setItem("loggingOut", "true");
    localStorage.removeItem("token");
    // Clear query cache
    queryClient.setQueryData(authQueryKeys.me(), null);
    queryClient.removeQueries({ queryKey: authQueryKeys.all });
    // Cancel any pending requests
    window.dispatchEvent(new Event("auth:logout"));
    // Reset flag after a short delay to allow cleanup
    setTimeout(() => {
      setLoggingOut(false);
      localStorage.removeItem("loggingOut");
    }, 1000);
  };

  const updateUser = async (data) => {
    try {
      await updateUserMutation.mutateAsync(data);
      return { success: true };
    } catch {
      return { success: false, error: "Update failed" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
