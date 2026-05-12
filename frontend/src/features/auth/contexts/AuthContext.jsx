import { http, setLoggingOut, getToken, setToken } from "@/app/config/http";
import { isTokenExpiringSoon } from "@/utils/jwt";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLogin } from "../mutations/useLogin";
import { useRegister } from "../mutations/useRegister";
import { useUpdateAuthUser } from "../mutations/useUpdateAuthUser";
import { authQueryKeys, useAuthQuery } from "../queries/useAuthQuery";

const CREW_TYPES_QUERY_KEY = ["qualifications", "crew-types"];

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [bootstrapped, setBootstrapped] = useState(false);

  // On mount: try to restore session from httpOnly refresh cookie.
  // This replaces the need for persisting the access token in localStorage.
  useEffect(() => {
    if (getToken()) {
      setBootstrapped(true);
      return;
    }
    http
      .post("/auth/refresh")
      .then((res) => {
        if (res.data?.access_token) setToken(res.data.access_token);
      })
      .catch(() => {})
      .finally(() => setBootstrapped(true));
  }, []);

  const {
    data: user,
    isLoading: queryLoading,
    error,
  } = useAuthQuery(bootstrapped);
  const loading = !bootstrapped || queryLoading;
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const updateUserMutation = useUpdateAuthUser();

  // Handle auth errors from /auth/me.
  // 401 is intentionally excluded: the HTTP interceptor already handles 401 by
  // attempting a token refresh + retry. If we also clear the token here on 401,
  // a transient refresh failure (e.g. server 500) causes the interceptor to not
  // clear the token, React Query to retry with the stale token, get 401 again,
  // and then this handler logs the user out — a false positive.
  // 404/422 are kept: they mean the user or token is genuinely invalid.
  useEffect(() => {
    if (error) {
      const status = error?.response?.status;
      if (
        (status === 404 || status === 422) &&
        getToken() &&
        !localStorage.getItem("loggingOut")
      ) {
        setToken(null);
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
    const checkAndRefreshToken = async () => {
      const token = getToken();

      if (!token || localStorage.getItem("loggingOut")) {
        return;
      }

      if (isTokenExpiringSoon(token, 120)) {
        try {
          const res = await http.post("/auth/refresh");
          const newToken = res.data.access_token;
          if (newToken) setToken(newToken);
        } catch (error) {
          if (error.response?.status === 401) {
            setToken(null);
            queryClient.setQueryData(authQueryKeys.me(), null);
            if (refreshIntervalRef.current) {
              clearInterval(refreshIntervalRef.current);
              refreshIntervalRef.current = null;
            }
          }
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
      await loginMutation.mutateAsync({ nip, password });
      // Fetch crew types after successful login
      queryClient.invalidateQueries({ queryKey: CREW_TYPES_QUERY_KEY });
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
    setLoggingOut(true);
    localStorage.setItem("loggingOut", "true");
    setToken(null);
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
