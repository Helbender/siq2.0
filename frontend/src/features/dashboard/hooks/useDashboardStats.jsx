import { useState, useEffect } from "react";
import { http } from "@/api/http";

export function useDashboardStats(year) {
  const [totalFlights, setTotalFlights] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [hoursByType, setHoursByType] = useState([]);
  const [hoursByAction, setHoursByAction] = useState([]);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [totalDoe, setTotalDoe] = useState(0);
  const [totalCargo, setTotalCargo] = useState(0);
  const [topPilotsByType, setTopPilotsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!year) return;

    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await http.get(`/dashboard/statistics?year=${year}`);
        const data = response.data;

        setTotalFlights(data.total_flights || 0);
        setTotalHours(data.total_hours || 0);
        setHoursByType(data.hours_by_type || []);
        setHoursByAction(data.hours_by_action || []);
        setTotalPassengers(data.total_passengers || 0);
        setTotalDoe(data.total_doe || 0);
        setTotalCargo(data.total_cargo || 0);
        setTopPilotsByType(data.top_pilots_by_type || {});
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [year]);

  return {
    totalFlights,
    totalHours,
    hoursByType,
    hoursByAction,
    totalPassengers,
    totalDoe,
    totalCargo,
    topPilotsByType,
    loading,
    error,
  };
}
