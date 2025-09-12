import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { apiAuth } from "../utils/api";

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const { removeToken } = useContext(AuthContext);

  const [users, setUsers] = useState([]);

  const getSavedUsers = async () => {
    try {
      const res = await apiAuth.get("/users");
      setUsers(res.data || []);
      console.log("Users Loaded from context");
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
    getSavedUsers();
  }, []);

  return (
    <UserContext.Provider value={{ users, setUsers }}>
      {children}
    </UserContext.Provider>
  );
};
