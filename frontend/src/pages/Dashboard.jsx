import React, { useContext, useEffect, useState } from "react";
import { Flex, Box, Heading, useColorModeValue } from "@chakra-ui/react";
import { UserContext } from "../Contexts/UserContext";
import {
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
const pieData = [
  { name: "Ativos", value: 400 },
  { name: "Inativos", value: 300 },
];

const COLORS = ["#E53E3E", "#38A169", "#3182ce"]; // verde, vermelho

const barData = [
  { name: "Jan", utilizadores: 30 },
  { name: "Fev", utilizadores: 45 },
  { name: "Mar", utilizadores: 60 },
];

function Dashboard() {
  const { token, removeToken } = useContext(UserContext);
  const [numberUser, setNumberUser] = useState([]);
  const [numberQualified, setNumberQualified] = useState([]);
  //Get Data from API Function
  const getDataFromAPI = async () => {
    try {
      const response = await axios.get("/api/dashboard", {
        headers: { Authorization: "Bearer " + token },
      });
      console.log(response.data);
      setNumberUser(response.data.numberUser);
      setNumberQualified(response.data.qualified);
    } catch (error) {
      console.log(error);
      if (error.response.status === 401) {
        console.log("Removing Token");
        removeToken();
      }
    }
  };

  useEffect(() => {
    getDataFromAPI();
  }, []);
  return (
    <Box p={6}>
      <Heading mb={6} textAlign={"center"}>
        Dashboard (WIP)
      </Heading>
      <Flex direction={["column", "row"]} gap={10}>
        {/* Gráfico Circular */}
        <Box
          w={["100%", "50%"]}
          h="350px"
          shadow={"lg"}
          bg={useColorModeValue("gray.400", "gray.700")}
          pb={10}
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
        {/* Gráfico de Barras */}
        <Box
          w={["100%", "50%"]}
          h="350px"
          bg={useColorModeValue("gray.400", "gray.700")}
          shadow={"lg"}
          pb={10}
        >
          <Heading size="md" mb={2} pt={1} pl={2}>
            Utilizadores por Mês
          </Heading>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="utilizadores" fill="#3182ce" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
      <Flex direction={["column", "row"]} gap={10} mt={10}>
        {/* Gráfico Circular */}
        <Box
          w={["100%", "50%"]}
          h="350px"
          shadow={"lg"}
          bg={useColorModeValue("gray.400", "gray.700")}
          pb={10}
        >
          <Heading size="md" mb={2} pt={1} pl={2}>
            Pilotos Qualificados
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
    </Box>
  );
}

export default Dashboard;
