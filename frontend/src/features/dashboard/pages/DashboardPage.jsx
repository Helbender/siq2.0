import React, { useContext, useEffect, useState } from "react";
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { UserContext } from "@/features/users/contexts/UserContext";
import {
  Legend,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { apiAuth } from "@/utils/api";
import { formatHours, formatDateISO } from "@/utils/timeCalc";
import { useSunTimes } from "@/utils/useSunTimes";
import { useAvailableYears } from "../hooks/useAvailableYears";
import { useDashboardStats } from "../hooks/useDashboardStats";

const COLORS = [
  "#E53E3E",
  "#38A169",
  "#3182ce",
  "#633974",
  "#D69E2E",
  "#805AD5",
];

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

export function DashboardPage() {
  const { token } = useContext(UserContext);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expiringQualifications, setExpiringQualifications] = useState([]);
  const [loadingExpiring, setLoadingExpiring] = useState(true);

  const { availableYears, loading: loadingYears } = useAvailableYears();
  const {
    totalFlights,
    totalHours,
    hoursByType,
    hoursByAction,
    totalPassengers,
    totalDoe,
    totalCargo,
    topPilotsByType,
    loading: loadingStats,
  } = useDashboardStats(selectedYear);

  const todayStr = formatDateISO(new Date());
  const tomorrowStr = formatDateISO(getTomorrow());

  const { sunrise, sunset, error: errorSunTimes } = useSunTimes(todayStr);

  const {
    sunrise: sunriseT,
    sunset: sunsetT,
    error: errorT,
  } = useSunTimes(tomorrowStr);

  // Set selected year to current year if available, otherwise first year in list
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(new Date().getFullYear())) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  // Fetch expiring qualifications
  const fetchExpiringQualifications = async () => {
    setLoadingExpiring(true);
    try {
      const response = await apiAuth.get("/dashboard/expiring-qualifications", {
        headers: { Authorization: "Bearer " + token },
      });
      setExpiringQualifications(response.data.expiring_qualifications || []);
    } catch (error) {
      console.error("Error fetching expiring qualifications:", error);
    } finally {
      setLoadingExpiring(false);
    }
  };

  useEffect(() => {
    fetchExpiringQualifications();
  }, [token]);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const loading = loadingStats || loadingYears;

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
      <Box p={6} overflow={"scroll"} h={"calc(95vh - 75px)"} bg={bgColor}>
        <Heading mb={6} textAlign={"center"}>
          Dashboard
        </Heading>

        <Flex justifyContent="space-between" alignItems="center" mb={2}>
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
                    label={({ name, value, percent }) => {
                      if (percent < 0.02) return "";
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
                    label={({ name, value, percent }) => {
                      if (percent < 0.02) return "";
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
              Tripulantes com Mais Horas de Voo ({selectedYear})
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
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

        {/* Expiring Qualifications List */}
        <Box mb={6}>
          <Heading size="md" mb={4} textAlign="center">
            Qualificações com Menor Tempo Restante (Top 10)
          </Heading>
          <Box bg={cardBg} p={4} borderRadius="lg" boxShadow="md">
            {loadingExpiring ? (
              <Text textAlign="center">A carregar...</Text>
            ) : expiringQualifications.length > 0 ? (
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Tripulante</Th>
                      <Th>Qualificação</Th>
                      <Th isNumeric>Dias Restantes</Th>
                      <Th>Data de Expiração</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {expiringQualifications.map((item, index) => {
                      const isExpired = item.remaining_days < 0;
                      const isExpiringSoon =
                        item.remaining_days >= 0 && item.remaining_days <= 30;
                      return (
                        <Tr key={index}>
                          <Td>
                            <Text fontWeight="medium">
                              {item.crew_member.rank} {item.crew_member.name}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              NIP: {item.crew_member.nip}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontWeight="medium">
                              {item.qualification_name}
                            </Text>
                          </Td>
                          <Td isNumeric>
                            <Text
                              fontWeight="bold"
                              color={
                                isExpired
                                  ? "red.500"
                                  : isExpiringSoon
                                    ? "orange.500"
                                    : "gray.700"
                              }
                            >
                              {item.remaining_days > 0
                                ? `${item.remaining_days} dias`
                                : item.remaining_days < 0
                                  ? `Expirou há ${Math.abs(item.remaining_days)} dias`
                                  : "Expira hoje"}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {new Date(item.expiry_date).toLocaleDateString(
                                "pt-PT",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </Text>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Text textAlign="center">Nenhuma qualificação encontrada</Text>
            )}
          </Box>
        </Box>

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
      </Box>
    </>
  );
}