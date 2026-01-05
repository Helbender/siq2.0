import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { apiAuth } from "@/utils/api";

// Create the context
export const UserContext = createContext();

// Create a provider component
export function UserProvider({ children }) {
  const { removeToken } = useContext(AuthContext);

  const [users, setUsers] = useState([]);

  const getSavedUsers = async () => {
    try {
      const res = await apiAuth.get("/users");
      setUsers(res.data || []);
      console.log("Users Loaded from context");
    } catch (error) {
      console.log(error);
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
}
