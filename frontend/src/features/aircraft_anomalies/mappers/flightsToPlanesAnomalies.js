/**
 * Maps API flights (with anomalies) to the plane-anomaly summary shape
 * used by AnomaliasTable and AnomalyAlertList.
 *
 * @param {Array<{ id: number, airtask: string, date: string, ATD: string, tailNumber: number, anomalies?: string[], flight_pilots?: Array<{ name: string, rank?: string, position?: string }> }>} flights
 * @returns {Array<{ num: number, dataInicial: string, anomalias: Array<{ name: string, counter: [number, number], planeAnomalyFlights: Array<{ id: number, airtask: string, date: string, atd: string, pilot: string }> }>}>}
 */
export function flightsToPlanesAnomalies(flights) {
  if (!Array.isArray(flights) || flights.length === 0) {
    return [];
  }

  const byTail = new Map();
  for (const f of flights) {
    const tail = f.tailNumber ?? f.tailnumber;
    if (tail == null) continue;
    if (!byTail.has(tail)) {
      byTail.set(tail, []);
    }
    byTail.get(tail).push(f);
  }

  const planes = [];
  for (const [tailNumber, planeFlights] of byTail.entries()) {
    const totalFlights = planeFlights.length;
    const dates = planeFlights.map((f) => f.date).filter(Boolean);
    const dataInicial = dates.length ? dates.sort()[0] : "";

    const descriptionToFlights = new Map();
    for (const f of planeFlights) {
      const descs = Array.isArray(f.anomalies) ? f.anomalies : [];
      for (const desc of descs) {
        const d = String(desc).trim();
        if (!d) continue;
        if (!descriptionToFlights.has(d)) {
          descriptionToFlights.set(d, []);
        }
        descriptionToFlights.get(d).push(f);
      }
    }

    const anomalias = [];
    for (const [name, descFlights] of descriptionToFlights.entries()) {
      // Data inicial for this anomaly = first time it was registered (earliest flight date)
      const anomalyDates = descFlights.map((f) => f.date).filter(Boolean);
      const dataInicialAnomaly = anomalyDates.length
        ? anomalyDates.sort()[0]
        : null;
      // Counter only accounts for flights on or after that date
      const planeFlightsFromInicial = dataInicialAnomaly
        ? planeFlights.filter((f) => f.date && f.date >= dataInicialAnomaly)
        : planeFlights;
      const totalFromInicial = planeFlightsFromInicial.length;
      const valueFromInicial = dataInicialAnomaly
        ? descFlights.filter((f) => f.date && f.date >= dataInicialAnomaly)
            .length
        : descFlights.length;

      const planeAnomalyFlights = descFlights.map((f) => {
        const p = f.flight_pilots?.[0];
        const pilot = p
          ? `${p.rank || ""} ${p.name || ""} (${p.position || ""})`.trim()
          : "";
        return {
          id: f.id,
          airtask: f.airtask ?? "",
          date: f.date ?? "",
          atd: f.ATD ?? f.departure_time ?? "",
          pilot: pilot || "",
        };
      });
      anomalias.push({
        name,
        counter: [valueFromInicial, totalFromInicial],
        planeAnomalyFlights,
      });
    }

    planes.push({
      num: Number(tailNumber),
      dataInicial,
      anomalias: anomalias.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  return planes.sort((a, b) => a.num - b.num);
}
