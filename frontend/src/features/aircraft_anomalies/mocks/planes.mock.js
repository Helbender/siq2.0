export const planesMock = [
  {
    num: 16701,
    dataInicial: "2026-03-16",
    anomalias: [
      {
        name: "Teste1",
        counter: [1, 5],
        planeAnomalyFlights: [
          {
            id: 101,
            airtask: "A-54",
            date: "2026-03-01",
            atd: "09:30",
            pilot: "Cap. João Silva (PC)",
          },
          {
            id: 102,
            airtask: "A-55",
            date: "2026-03-05",
            atd: "14:00",
            pilot: "Ten. Maria Costa (PI)",
          },
        ],
      },
      {
        name: "Teste2",
        counter: [2, 12],
        planeAnomalyFlights: [
          {
            id: 103,
            airtask: "A-56",
            date: "2026-03-08",
            atd: "12:45",
            pilot: "Cap. Carlos Ferreira (PC)",
          },
        ],
      },
    ],
  },
  {
    num: 16702,
    dataInicial: "2026-03-16",
    anomalias: [
      {
        name: "Teste3",
        counter: [1, 2],
        planeAnomalyFlights: [
          {
            id: 201,
            airtask: "B-10",
            date: "2026-03-03",
            atd: "08:10",
            pilot: "Maj. Rui Lopes (PC)",
          },
        ],
      },
      {
        name: "Teste4",
        counter: [2, 12],
        planeAnomalyFlights: [],
      },
    ],
  },
];
