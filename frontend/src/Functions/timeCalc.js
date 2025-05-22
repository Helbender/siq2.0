export const getTimeDiff = (time1, time2) => {
  if (!time1 || !time2) return "";

  const [h1, m1] = time1.split(":").map(Number);
  const [h2, m2] = time2.split(":").map(Number);
  let start = new Date(0, 0, 0, h1, m1);
  let end = new Date(0, 0, 0, h2, m2);
  let diff = (end - start) / 60000; // minutos

  if (diff < 0) diff += 24 * 60; // ajustar para voos que passam da meia-noite

  const hours = String(Math.floor(diff / 60)).padStart(2, "0");
  const minutes = String(diff % 60).padStart(2, "0");

  return `${hours}:${minutes}`;
};

export const formatDate = (dateStr) => {
  const months = {
    "01": "Jan",
    "02": "Fev",
    "03": "Mar",
    "04": "Abr",
    "05": "Mai",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
  };

  const [day, monAbbr, year] = dateStr.split("-");
  const month = months[monAbbr];

  if (!month) {
    return dateStr;
  }

  return `${year}-${month}-${day.padStart(2, "0")}`;
};
