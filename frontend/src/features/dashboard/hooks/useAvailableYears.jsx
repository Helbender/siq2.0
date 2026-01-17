import { useState, useEffect } from "react";
import { http } from "@/api/http";

export function useAvailableYears() {
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAvailableYears = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await http.get("/dashboard/available-years");
        const years = response.data.years;
        setAvailableYears(years);
      } catch (err) {
        console.error("Error fetching available years:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableYears();
  }, []);

  return { availableYears, loading, error };
}
