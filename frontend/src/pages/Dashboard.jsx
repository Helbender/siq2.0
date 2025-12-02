import React, { Fragment, useContext, useEffect, useState } from "react";
import {
  Flex,
  Box,
  Heading,
  useColorModeValue,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Select,
  FormControl,
  FormLabel,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";
import { UserContext } from "../Contexts/UserContext";
import {
  Legend,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { apiAuth } from "../utils/api";
import {
  parseTimeToMinutes,
  formatMinutesToTime,
  formatHours,
} from "../Functions/timeCalc";
import { useSunTimes } from "../utils/useSunTimes";
import { formatDateISO } from "../Functions/timeCalc"; // Assuming this is a utility function to format date to ISO string
import { supabase } from "../utils/supabase";

const COLORS = [
  "#E53E3E",
  "#38A169",
  "#3182ce",
  "#633974",
  "#D69E2E",
  "#805AD5",
];
const COLORS2 = ["#38A169", "#E53E3E"]; // verde, vermelho

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function Dashboard() {
  const { token, removeToken } = useContext(UserContext);
  const navigate = useNavigate();

  // OLD STATE - COMMENTED OUT
  // const [numberUser, setNumberUser] = useState([]);
  // const [numberQualified, setNumberQualified] = useState([]);
  // const [numberVRP, setNumberVRP] = useState([]);
  // const [numberCurrencies, setNumberCurrencies] = useState([]);
  // const [modalidades, setModalidades] = useState([]);
  // const [qa1, setqa1] = useState([]);

  const todayStr = formatDateISO(new Date());
  const tomorrowStr = formatDateISO(getTomorrow());

  const {
    sunrise,
    sunset,
    loading: loadingSunTimes,
    error: errorSunTimes,
  } = useSunTimes(todayStr);
  console.log(sunrise);

  const {
    sunrise: sunriseT,
    sunset: sunsetT,
    loading: loadingT,
    error: errorT,
  } = useSunTimes(tomorrowStr);
  console.log(sunriseT);

  // Statistics state
  const [totalFlights, setTotalFlights] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [hoursByType, setHoursByType] = useState([]);
  const [hoursByAction, setHoursByAction] = useState([]);
  const [totalPassengers, setTotalPassengers] = useState(0);
  const [totalDoe, setTotalDoe] = useState(0);
  const [totalCargo, setTotalCargo] = useState(0);
  const [topPilotsByType, setTopPilotsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  // Fetch available years
  const fetchAvailableYears = async () => {
    try {
      const response = await apiAuth.get("/flights/available-years");
      const years = response.data.years;
      setAvailableYears(years);
      // Set selected year to current year if available, otherwise first year in list
      if (years.length > 0 && !years.includes(new Date().getFullYear())) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error("Error fetching available years:", error);
    }
  };

  // Fetch statistics from API
  const fetchStatistics = async (year = selectedYear) => {
    try {
      setLoading(true);
      const response = await apiAuth.get(`/flights/statistics?year=${year}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const data = response.data;
      setTotalFlights(data.total_flights);
      setTotalHours(data.total_hours || 0);
      setHoursByType(data.hours_by_type);
      setHoursByAction(data.hours_by_action);
      setTotalPassengers(data.total_passengers);
      setTotalDoe(data.total_doe);
      setTotalCargo(data.total_cargo);
      setTopPilotsByType(data.top_pilots_by_type || {});
      setLoading(false);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setLoading(false);
    }
  };

  // OLD API CALL - COMMENTED OUT
  // //Get Data from API Function
  // const getDataFromAPI = async () => {
  //   try {
  //     const response = await apiAuth.get("/api/dashboard", {
  //       headers: { Authorization: "Bearer " + token },
  //     });
  //     console.log(response.data);
  //     setNumberUser(response.data.numberUser);
  //     setNumberQualified(response.data.alerta);
  //     setNumberVRP(response.data.vrp);
  //     setNumberCurrencies(response.data.currencies);
  //     setModalidades(response.data.modalidades);
  //     setqa1(response.data.qa1);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // const formatedHoras = modalidades.map((item) => ({
  //   name: item.name.toUpperCase(),
  //   minutes: parseTimeToMinutes(item.value),
  // }));
  // // Calcula o total para percentagem
  // // const totalMinutes = formatedHoras.reduce(
  // //   (sum, item) => sum + item.minutes,
  // //   0,
  // // );

  // // const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  // const CustomLegend = ({ payload, dados }) => (
  //   <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
  //     {payload.map((entry, index) => (
  //       <li key={`item-${index}`} style={{ marginBottom: "4px" }}>
  //         <span style={{ color: entry.color }}>
  //           ● {entry.value}: {formatMinutesToTime(dados[index].minutes)}
  //         </span>
  //       </li>
  //     ))}
  //   </ul>
  // );

  // // Custom label component with padding
  // const renderCustomLabel = ({
  //   cx,
  //   cy,
  //   midAngle,
  //   innerRadius,
  //   outerRadius,
  //   percent,
  // }) => {
  //   // Only show label if percentage is significant enough
  //   if (percent < 0.02) return null;

  //   const RADIAN = Math.PI / 180;
  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.75;
  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);

  //   return (
  //     <text
  //       x={x}
  //       y={y}
  //       fill="white"
  //       textAnchor={"middle"}
  //       dominantBaseline="central"
  //       fontSize={12}
  //       fontWeight="bold"
  //       style={{
  //         textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
  //         padding: "4px",
  //       }}
  //     >
  //       {`${(percent * 100).toFixed(1)}%`}
  //     </text>
  //   );
  // };

  // OLD useEffect - COMMENTED OUT
  // useEffect(() => {
  //   getDataFromAPI();
  // }, []);

  // Set up Supabase realtime subscription
  useEffect(() => {
    // Fetch available years first
    fetchAvailableYears();
  }, [token]);

  // Fetch statistics when year changes
  useEffect(() => {
    if (availableYears.length > 0) {
      fetchStatistics(selectedYear);
    }
  }, [selectedYear, availableYears, token]);

  // Set up realtime updates
  // useEffect(() => {
  //   // Option 1: Supabase Realtime (requires replication enabled)
  //   // Uncomment this if you have replication enabled in Supabase
  //   /*
  //   const channel = supabase
  //     .channel("flights-changes")
  //     .on(
  //       "postgres_changes",
  //       {
  //         event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
  //         schema: "public",
  //         table: "flights_table",
  //       },
  //       (payload) => {
  //         console.log("Flight change detected:", payload);
  //         fetchStatistics(selectedYear);
  //       },
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  //   */

  //   // Option 2: Polling (works without replication)
  //   // Polls every 5 minutes for updates
  //   const pollInterval = setInterval(() => {
  //     fetchStatistics(selectedYear);
  //   }, 300000); // 5 minute

  //   // Cleanup interval on unmount
  //   return () => {
  //     clearInterval(pollInterval);
  //   };
  // }, [selectedYear, token]);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");

  if (loading) {
    return (
      <Box p={6} ml={"60px"}>
        <Heading mb={6} textAlign={"center"}>
          Dashboard (A carregar estatísticas...)
        </Heading>
        <Flex justifyContent="center" alignItems="center" mb={6}>
          <Skeleton width="300px" height="30px" mb={6} />
        </Flex>
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
          <Box padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
          <Box padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
          <Box padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
          <Box padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
          <Box padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
        </SimpleGrid>
        <Flex direction={{ base: "column", lg: "row" }} gap={6} mb={6}>
          <Skeleton w="100%" height={"450px"} mb={6} />
          <Skeleton w="100%" height={"450px"} mb={6} />
        </Flex>
      </Box>
    );
  }

  return (
    <>
      <Box
        p={6}
        overflow={"scroll"}
        h={"calc(95vh - 75px)"}
        // w={"calc(100vw - 60px)"}
        bg={bgColor}
        // ml={"60px"}
      >
        {/* OLD HEADING - COMMENTED OUT */}
        <Heading mb={6} textAlign={"center"}>
          Dashboard
        </Heading>

        <Flex justifyContent="space-between" alignItems="center" mb={2}>
          {/* {loadingSunTimes && <Text size={"lg"}>A carregar horário...</Text>} */}
          {errorSunTimes && <Text>Error: {errorSunTimes}</Text>}
          {sunrise && sunset && (
            <Flex mb={0} alignItems={"center"} flexDirection={"column"}>
              <Heading>Hoje</Heading>
              <Text>{`SR: ${sunrise.toLocaleTimeString()}L`}</Text>
              <Text>{`SS: ${sunset.toLocaleTimeString()}L`}</Text>
            </Flex>
          )}
          <FormControl width="auto" display="flex" alignItems="center" gap={3}>
            <FormLabel mb={0}>Selecionar Ano</FormLabel>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              bg={cardBg}
              width="150px"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </FormControl>
          {/* {loadingT && <Text size={"lg"}>A carregar horário...</Text>} */}
          {errorT && <Text>Error: {errorT}</Text>}
          {sunriseT && sunsetT && (
            <Flex mb={0} alignItems={"center"} flexDirection={"column"}>
              <Heading>Amanhã</Heading>
              <Text>{`SR: ${sunriseT.toLocaleTimeString()}L`}</Text>
              <Text>{`SS: ${sunsetT.toLocaleTimeString()}L`}</Text>
            </Flex>
          )}
        </Flex>
        <Text mb={4} textAlign={"right"}>
          https://sunrise-sunset.org/
        </Text>
        {/* </Flex> */}
        {/* Summary Statistics */}
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
          <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            <StatLabel>Voos</StatLabel>
            <StatNumber>{totalFlights}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            <StatLabel>Total de Horas</StatLabel>
            <StatNumber>{formatHours(totalHours)}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            <StatLabel>Total de Passageiros</StatLabel>
            <StatNumber>{totalPassengers.toLocaleString()}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            <StatLabel>Total de Doentes</StatLabel>
            <StatNumber>{totalDoe.toLocaleString()}</StatNumber>
          </Stat>
          <Stat bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            <StatLabel>Total de Carga</StatLabel>
            <StatNumber>{totalCargo.toLocaleString() + " Kg"}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Pie Charts */}
        <Flex direction={{ base: "column", lg: "row" }} gap={6} mb={6}>
          {/* Hours by Flight Type */}
          <Box
            flex={1}
            bg={cardBg}
            p={4}
            borderRadius="lg"
            boxShadow="md"
            h="450px"
          >
            <Heading size="md" mb={4} textAlign="center">
              Horas por Modalidade
            </Heading>
            {hoursByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={hoursByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    // label={renderCustomLabel}
                    label={({ name, value, percent }) => {
                      // Only show label if percentage is significant enough
                      if (percent < 0.02) return ""; // Hide labels for very small slices
                      // return `${name}: ${(percent * 100).toFixed(1)}%`;
                      return `${name}: ${formatHours(value)}`;
                    }}
                    labelLine={false}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {hoursByType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const percentage =
                        totalHours > 0
                          ? ((value / totalHours) * 100).toFixed(1)
                          : 0;
                      return `${percentage}%`;
                    }}
                    labelFormatter={(label) => `Type: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                      paddingBottom: "10px",
                    }}
                    iconSize={12}
                    wrapperClass="legend-wrapper"
                    style={{
                      lineHeight: "24px",
                      paddingLeft: "10px",
                      paddingRight: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text textAlign="center" mt={20}>
                No data available
              </Text>
            )}
          </Box>

          {/* Hours by Flight Action */}
          <Box
            flex={1}
            bg={cardBg}
            p={4}
            borderRadius="lg"
            boxShadow="md"
            h="450px"
          >
            <Heading size="md" mb={4} textAlign="center">
              Horas por Ação
            </Heading>
            {hoursByAction.length > 0 ? (
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={hoursByAction}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    // label={renderCustomLabel}
                    label={({ name, value, percent }) => {
                      // Only show label if percentage is significant enough
                      if (percent < 0.02) return ""; // Hide labels for very small slices
                      // return `${name}: ${(percent * 100).toFixed(1)}%`;
                      return `${name}: ${formatHours(value)}`;
                    }}
                    labelLine={false}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {hoursByAction.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => {
                      const percentage =
                        totalHours > 0
                          ? ((value / totalHours) * 100).toFixed(1)
                          : 0;
                      return `${percentage}%`;
                    }}
                    labelFormatter={(label) => `Action: ${label}`}
                  />
                  <Legend
                    wrapperStyle={{
                      paddingTop: "20px",
                      paddingBottom: "10px",
                    }}
                    iconSize={12}
                    wrapperClass="legend-wrapper"
                    style={{
                      lineHeight: "24px",
                      paddingLeft: "10px",
                      paddingRight: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Text textAlign="center" mt={20}>
                No data available
              </Text>
            )}
          </Box>
        </Flex>
        {/* Top Pilots by Type */}
        {Object.keys(topPilotsByType).length > 0 && (
          <Box mb={6}>
            <Heading size="md" mb={4} textAlign="center">
              Tripulantes com Mais Horas por Tipo ({selectedYear})
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {[
                "PILOTO",
                "OPERADOR CABINE",
                "CONTROLADOR TATICO",
                "OPERADOR VIGILANCIA",
                "OPERAÇÕES",
              ]
                .filter((tipo) => topPilotsByType[tipo])
                .map((tipo) => {
                  const pilot = topPilotsByType[tipo];
                  if (!pilot) return null;
                  return (
                    <Box
                      key={tipo}
                      bg={cardBg}
                      p={4}
                      borderRadius="lg"
                      boxShadow="md"
                    >
                      <Heading
                        size="sm"
                        mb={2}
                        textAlign="center"
                        color="teal.500"
                      >
                        {tipo}
                      </Heading>
                      <Flex direction="column" align="center" gap={2}>
                        <Text fontSize="lg" fontWeight="bold">
                          {pilot.rank} {pilot.name}
                        </Text>
                        <Text fontSize="md" color="gray.600">
                          NIP: {pilot.nip}
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="teal.500">
                          {formatHours(pilot.hours)}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
            </SimpleGrid>
          </Box>
        )}

        {/* Realtime Status Indicator */}
        <Box
          bg={cardBg}
          p={3}
          borderRadius="lg"
          boxShadow="md"
          textAlign="center"
        >
          <Text fontSize="sm" color="green.500">
            ● Auto-refresh - Estatísticas atualizam automaticamente a cada 5
            minutos
          </Text>
        </Box>

        {/* OLD CONTENT - COMMENTED OUT */}
        {/* <Accordion defaultIndex={[0]} allowMultiple={true}>
        <AccordionItem>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Estatisticas
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel>
        <Flex
          mt={10}
          direction={"column"}
          bg={useColorModeValue("gray.500", "gray.900")}
          p={2}
          shadow={"2xl"}
          pb={4}
          borderRadius={"lg"}
        >
          <Heading pb={2}>Estatisticas</Heading>
          <Flex direction={["column", "row"]} gap={10} overflow={"auto"}>
            <Box
              w={["100%", "50%"]}
              h="350px"
              shadow={"lg"}
              bg={useColorModeValue("gray.400", "gray.700")}
              pb={10}
              borderRadius={"lg"}
            >
              <Heading size="md" mb={2} pt={1} pl={2}>
                Horas de Voo
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatedHoras}
                    dataKey="minutes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                  >
                    {formatedHoras.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMinutesToTime(value)} />
                  <Legend
                    content={<CustomLegend dados={formatedHoras} />}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box
              w={["100%", "50%"]}
              h="350px"
              shadow={"lg"}
              bg={useColorModeValue("gray.400", "gray.700")}
              pb={10}
              borderRadius={"lg"}
            >
              <Heading size="md" mb={2} pt={1} pl={2}>
                Número dos Utilizadores
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={numberUser}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={80}
                    dataKey="value"
                  >
                    {numberUser.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Flex>
        </Flex>
        </AccordionPanel>
          </AccordionItem> */}
        {/* <AccordionItem>
            <h2>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left">
                  Pilotos
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}> */}
        {/* <Flex
          mt={10}
          direction={"column"}
          bg={useColorModeValue("gray.500", "gray.900")}
          p={2}
          shadow={"2xl"}
          pb={4}
          borderRadius={"lg"}
        >
          <Heading pb={2}>Pilotos</Heading>
          <Flex
            direction={["column", "row"]}
            gap={10}
            // mt={10}
            w={"100%"}
            // _hover={{ bg: "whiteAlpha.400" }}
            // p={5}
          >
            <Box
              w={["100%", "50%"]}
              h="350px"
              shadow={"lg"}
              bg={useColorModeValue("gray.400", "gray.700")}
              pb={10}
              borderRadius={"lg"}
              border={"1px"}
              borderColor={"blackAlpha.400"}
            >
              <Heading textAlign={"center"} size="md" mb={2} pt={1}>
                Alerta
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={numberQualified}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={80}
                    dataKey="value"
                  >
                    {numberQualified.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS2[index % COLORS2.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box
              w={["100%", "50%"]}
              h="350px"
              shadow={"lg"}
              bg={useColorModeValue("gray.400", "gray.700")}
              pb={10}
              borderRadius={"lg"}
              border={"1px"}
              borderColor={"blackAlpha.400"}
            >
              <Heading textAlign={"center"} size="md" mb={2} pt={1}>
                VRP
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={numberVRP}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={80}
                    dataKey="value"
                  >
                    {numberVRP.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS2[index % COLORS2.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Box
              w={["100%", "50%"]}
              h="350px"
              shadow={"lg"}
              bg={useColorModeValue("gray.400", "gray.700")}
              pb={10}
              borderRadius={"lg"}
              border={"1px"}
              borderColor={"blackAlpha.400"}
            >
              <Heading textAlign={"center"} size="md" mb={2} pt={1}>
                Currencies
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={numberCurrencies}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={80}
                    dataKey="value"
                  >
                    {numberCurrencies.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS2[index % COLORS2.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Flex>
        </Flex> */}
        {/* </AccordionPanel>
          </AccordionItem>
        </Accordion> */}
        {/* <TableQ data={qa1} /> */}
        {/* {qa1.map((item) => (
          <Text key={item.name}> {`${item.name}: ${item.value}`}</Text>
          // <Text key={index}> {`${item.name}: ${item.value}`}</Text>
        ))} */}
      </Box>
    </>
  );
}

export default Dashboard;
