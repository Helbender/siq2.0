import { useMemo, useState } from "react";

const SUN_API_URL = "https://api.sunrise-sunset.org/json";
const LISBOA_LAT = 38.7169;
const LISBOA_LNG = -9.1399;

export function useSunTimes(datestr) {
  const [sunTimes, setSunTimes] = useState({ sunrise: null, sunset: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useMemo(() => {
    async function fetchSunTimes() {
      setLoading(true);
      setError(null);
      try {
        // const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        // const today = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
        const response = await fetch(
          `${SUN_API_URL}?lat=${LISBOA_LAT}&lng=${LISBOA_LNG}&date=${datestr}&formatted=0`,
        );

        const data = await response.json();

        if (data.status === "OK") {
          // console.log("OK");
          const sunriseUTC = new Date(data.results.sunrise);
          const sunsetUTC = new Date(data.results.sunset);
          // console.log(sunriseUTC, sunsetUTC);
          setSunTimes({ sunrise: sunriseUTC, sunset: sunsetUTC });
          // console.log("Dates ready");
        } else {
          throw new Error(data.status);
        }
      } catch (err) {
        console.log("Geeting Error");
        setError(err.message);
        setSunTimes({ sunrise: null, sunset: null });
      } finally {
        setLoading(false);
      }
    }

    fetchSunTimes();
  }, [datestr]);

  return { ...sunTimes, loading, error };
}
