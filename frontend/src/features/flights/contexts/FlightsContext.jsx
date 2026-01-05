import { createContext, useEffect, useState, useContext } from "react";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { apiAuth } from "@/utils/api";

// Create the context
export const FlightContext = createContext();

// Create a provider component
export function FlightProvider({ children }) {
  const [flights, setFlights] = useState([]);
  const { removeToken } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  const getSavedFlights = async () => {
    try {
      const response = await apiAuth.get("/flights");
      setFlights(response.data || []);
      setLoading(false);
      console.log("Flights Loaded from context");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getSavedFlights();
  }, []);

  return (
    <FlightContext.Provider value={{ flights, setFlights, loading }}>
      {children}
    </FlightContext.Provider>
  );
}
