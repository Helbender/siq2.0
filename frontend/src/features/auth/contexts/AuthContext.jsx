import { createContext } from "react";
import { jwtDecode } from "jwt-decode";
import { useToken } from "../hooks/useToken";

// Create the context
export const AuthContext = createContext();

// Create a provider component
export function AuthProvider({ children }) {
  const { token, removeToken, setToken } = useToken();

  const getUser = () => {
    if (token && token !== "" && token !== undefined) {
      const decodedToken = jwtDecode(token);
      return { name: decodedToken.name, admin: decodedToken.admin };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        removeToken,
        setToken,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
