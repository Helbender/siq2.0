/* eslint-disable react/prop-types */
import { createContext, useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../Contexts/AuthContext";

// Create the context
export const FlightContext = createContext();

// Create a provider component
export const FlightProvider = ({ children }) => {
  const [flights, setFlights] = useState([]);
  const { token } = useContext(AuthContext);

  const getSavedFlights = async () => {
    try {
      const response = await axios.get("/api/flights", {
        headers: { Authorization: "Bearer " + token },
      });
      setFlights(response.data || []);
    } catch (error) {
      // console.log(error);
      console.log(error.response.status);
      // if (error.response.status === 401) {
      //   console.log("Removing Token");
      //   removeToken();
      // }
      // if (error.response.status === 422) {
      //   console.log("Removing Token");
      //   removeToken();
      // }
    }
  };

  useEffect(() => {
    getSavedFlights();
    console.log("Flights Loaded");
    // console.log(flights);
  }, []);

  return (
    <FlightContext.Provider value={{ flights, setFlights }}>
      {children}
    </FlightContext.Provider>
  );
};
