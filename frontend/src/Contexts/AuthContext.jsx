/* eslint-disable react/prop-types */
import { createContext } from "react";
import useToken from "../components/loginComponents/useToken";
import { jwtDecode } from "jwt-decode";
// Create the context
export const AuthContext = createContext();

// Create a provider component
export const AuthProvider = ({ children }) => {
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
};
