import {
  fetchMe,
  loginRequest,
  registerRequest,
  updateUserRequest,
} from "@/features/auth/services/api";
import { setLoggingOut } from "@/api/http";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchMe()
      .then((user) => {
        setUser(user);

        setLoading(false);
      })
      .catch((error) => {
        // Only clear token if it's an actual auth error, not if we're logging out
        if (!localStorage.getItem("token")) {
          // Token was already cleared (e.g., by logout)
          setUser(null);
          setLoading(false);
          return;
        }
        // Auth error - clear token and user
        localStorage.removeItem("token");
        setUser(null);
        setLoading(false);
      });
  }, []);

  const login = async (nip, password) => {
    try {
      // Ensure logout flag is reset before login attempt
      setLoggingOut(false);

      const response = await loginRequest(nip, password);
      const { access_token } = response;

      if (!access_token) {
        return { success: false, error: "Invalid response from server" };
      }

      localStorage.setItem("token", access_token);

      // Fetch user data after login
      try {
        const user = await fetchMe();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user after login:", error);
        // Continue even if fetchMe fails
      }

      // Wait a tick to ensure state is updated
      await new Promise((resolve) => setTimeout(resolve, 0));

      return { success: true };
    } catch (e) {
      console.error("Login error:", e);
      // Check if it's a 401 - this shouldn't happen for login, but handle it
      if (e.response?.status === 401) {
        return { success: false, error: "Invalid NIP or password" };
      }
      const errorMessage =
        e.response?.data?.message || e.response?.data?.error || e.message || "Login failed";
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      const { access_token, user } = await registerRequest(
        username,
        email,
        password,
      );
      localStorage.setItem("token", access_token);
      setUser(user);
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
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
    // Cancel any pending requests
    // Note: This is a best-effort cancellation
    window.dispatchEvent(new Event("auth:logout"));
    // Reset flag after a short delay to allow cleanup
    setTimeout(() => setLoggingOut(false), 1000);
  };

  const updateUser = async (data) => {
    try {
      const res = await updateUserRequest(data);
      setUser(res.user);
      return { success: true };
    } catch {
      return { success: false, error: "Update failed" };
    }
  };
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener("auth:logout", handleLogout);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
