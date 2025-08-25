import React, { Fragment, useContext, useEffect, useState } from "react";
import {
  Flex,
  Box,
  Heading,
  useColorModeValue,
  Text,
  Spacer,
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
import { parseTimeToMinutes, formatMinutesToTime } from "../Functions/timeCalc";
import { useSunTimes } from "../utils/useSunTimes";
import TableQ from "../components/TableQ";
import { formatDateISO } from "../Functions/timeCalc"; // Assuming this is a utility function to format date to ISO string
import { time } from "framer-motion";
const COLORS = ["#E53E3E", "#38A169", "#3182ce", "#633974"]; // verde, vermelho
const COLORS2 = ["#38A169", "#E53E3E"]; // verde, vermelho

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function Dashboard() {
  const { token, removeToken } = useContext(UserContext);
  const [numberUser, setNumberUser] = useState([]);
  const [numberQualified, setNumberQualified] = useState([]);
  const [numberVRP, setNumberVRP] = useState([]);
  const [numberCurrencies, setNumberCurrencies] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [qa1, setqa1] = useState([]);
  const navigate = useNavigate();

  const todayStr = formatDateISO(new Date());
  const tomorrowStr = formatDateISO(getTomorrow());

  const { sunrise, sunset, loading, error } = useSunTimes(todayStr);
  console.log(sunrise);

  const {
    sunrise: sunriseT,
    sunset: sunsetT,
    loading: loadingT,
    error: errorT,
  } = useSunTimes(tomorrowStr);
  console.log(sunriseT);

  //Get Data from API Function
  const getDataFromAPI = async () => {
    try {
      const response = await apiAuth.get("/api/dashboard", {
        headers: { Authorization: "Bearer " + token },
      });
      console.log(response.data);
      setNumberUser(response.data.numberUser);
      setNumberQualified(response.data.alerta);
      setNumberVRP(response.data.vrp);
      setNumberCurrencies(response.data.currencies);
      setModalidades(response.data.modalidades);
      setqa1(response.data.qa1);
    } catch (error) {
      console.log(error);
      if (error.response.status === 401) {
        console.log("Removing Token");
        removeToken();
        navigate("/");
      }
    }
  };

  const formatedHoras = modalidades.map((item) => ({
    name: item.name.toUpperCase(),
    minutes: parseTimeToMinutes(item.value),
  }));
  // Calcula o total para percentagem
  // const totalMinutes = formatedHoras.reduce(
  //   (sum, item) => sum + item.minutes,
  //   0,
  // );

  // const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  const CustomLegend = ({ payload, dados }) => (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ marginBottom: "4px" }}>
          <span style={{ color: entry.color }}>
            ● {entry.value}: {formatMinutesToTime(dados[index].minutes)}
          </span>
        </li>
      ))}
    </ul>
  );

  useEffect(() => {
    getDataFromAPI();
  }, []);
  return (
    <>
      <Box p={6} ml={"60px"} overflow={"scroll"} h={"87vh"}>
        <Heading mb={6} textAlign={"center"}>
          Dashboard (WIP)
        </Heading>
        {loading && <Text size={"lg"}>A carregar horário...</Text>}
        {error && <Text>Error: {error}</Text>}
        {sunrise && sunset && (
          <Flex mb={4} alignItems={"center"}>
            <Heading fontSize={"md"} mr={5}>
              {"SR: "}
            </Heading>
            <Heading>{sunrise.toLocaleTimeString()}</Heading>
            <Spacer />
            <Heading fontSize={"md"} mr={5}>
              {"SS: "}
            </Heading>
            <Heading>{sunset.toLocaleTimeString()}</Heading>
          </Flex>
        )}

        {loadingT && <Text size={"lg"}>A carregar horário...</Text>}
        {errorT && <Text>Error: {errorT}</Text>}

        {sunriseT && sunsetT && (
          <Fragment>
            <Text>Amanhã</Text>
            <Text>{sunriseT.toLocaleTimeString()}</Text>
            <Text>{sunsetT.toLocaleTimeString()}</Text>
          </Fragment>
        )}
        <Text mb={4}>https://sunrise-sunset.org/</Text>
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
        {/* </AccordionPanel>
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
        <Flex
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
            {/* Gráfico Circular */}
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
        </Flex>
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
