import { setLoggingOut } from "@/api/http";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect } from "react";
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
        (status === 401 || status === 404) &&
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
