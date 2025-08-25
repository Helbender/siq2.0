import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { api, apiAuth } from "../utils/api";

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const { token, removeToken } = useContext(AuthContext);

  const [pilotos, setPilotos] = useState([]);

  const getSavedPilots = async () => {
    try {
      const res = await apiAuth.get("/users");
      setPilotos(res.data || []);
      console.log("Users Loaded");
    } catch (error) {
      console.log(error);
      if (error.response?.status === 401) {
        console.log("Removing Token");
        removeToken();
        // navigate("/");
      }
    }
  };
  useEffect(() => {
    getSavedPilots();
  }, []);

  return (
    <UserContext.Provider value={{ pilotos, setPilotos }}>
      {children}
    </UserContext.Provider>
  );
};
