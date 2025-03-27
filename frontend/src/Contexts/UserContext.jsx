/* eslint-disable react/prop-types */
import { createContext, useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext";

// Create the context
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  const { token, removeToken } = useContext(AuthContext);

  const [pilotos, setPilotos] = useState([]);

  const getSavedPilots = async () => {
    try {
      const res = await axios.get("/api/users", {
        headers: { Authorization: "Bearer " + token },
      });
      // console.log(res.data);
      setPilotos(res.data || []);
    } catch (error) {
      console.log(error);
      console.log(error.response.status);
      if (error.response.status === 401) {
        console.log("Removing Token");
        removeToken();
        // navigate("/");
      }
    }
  };
  useEffect(() => {
    console.log("Users Loaded");
    getSavedPilots();
  }, []);

  return (
    <UserContext.Provider value={{ pilotos, setPilotos }}>
      {children}
    </UserContext.Provider>
  );
};
