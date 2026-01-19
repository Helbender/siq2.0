import { formatDateISO, formatHours } from "@/utils/timeCalc";
import { useSunTimes } from "@/utils/useSunTimes";
import {
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { ExpiringQualificationsTable } from "../components/ExpiringQualificationsTable";
import { PieChartCard } from "../components/PieChartCard";
import { StatCard } from "../components/StatCard";
import { SunTimesDisplay } from "../components/SunTimesDisplay";
import { TopPilotsSection } from "../components/TopPilotsSection";
import { YearSelector } from "../components/YearSelector";
import { useAvailableYears } from "../hooks/useAvailableYears";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useExpiringQualifications } from "../hooks/useExpiringQualifications";

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function LoadingSkeleton() {
  return (
    <Box p={6} ml={"60px"}>
      <Heading mb={6} textAlign={"center"}>
        Dashboard (A carregar estatísticas...)
      </Heading>
      <Flex justifyContent="center" alignItems="center" mb={6}>
        <Skeleton width="300px" height="30px" mb={6} />
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} padding="6" boxShadow="lg">
            <SkeletonCircle size="5" />
            <SkeletonText mt="4" noOfLines={3} spacing="4" skeletonHeight="1" />
          </Box>
        ))}
      </SimpleGrid>
      <Flex direction={{ base: "column", lg: "row" }} gap={6} mb={6}>
        <Skeleton w="100%" height={"450px"} mb={6} />
        <Skeleton w="100%" height={"450px"} mb={6} />
      </Flex>
    </Box>
  );
}

export function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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
  
  const { expiringQualifications, loading: loadingExpiring } = useExpiringQualifications();

  const todayStr = formatDateISO(new Date());
  const tomorrowStr = formatDateISO(getTomorrow());

  const { sunrise, sunset, error: errorSunTimes } = useSunTimes(todayStr);
  const { sunrise: sunriseT, sunset: sunsetT, error: errorT } = useSunTimes(tomorrowStr);

  // Set selected year to current year if available, otherwise first year in list
  useEffect(() => {
    if (
      availableYears.length > 0 &&
      !availableYears.includes(new Date().getFullYear())
    ) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears]);

  const loading = loadingStats || loadingYears;

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <Box p={6} overflow={"scroll"} h={"calc(95vh - 75px)"} bg="bg.canvas">
      <Heading mb={6} textAlign={"center"}>
        Dashboard
      </Heading>

      {/* Sun Times and Year Selector */}
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <SunTimesDisplay
          date="Hoje"
          sunrise={sunrise}
          sunset={sunset}
          error={errorSunTimes}
        />
        <YearSelector
          value={selectedYear}
          onChange={setSelectedYear}
          availableYears={availableYears}
        />
        <SunTimesDisplay
          date="Amanhã"
          sunrise={sunriseT}
          sunset={sunsetT}
          error={errorT}
        />
      </Flex>
      <Text mb={4} textAlign={"right"}>
        https://sunrise-sunset.org/
      </Text>

      {/* Summary Statistics */}
      <SimpleGrid columns={{ base: 1, md: 5 }} gap={4} mb={6}>
        <StatCard label="Voos" value={totalFlights} />
        <StatCard label="Total de Horas" value={formatHours(totalHours)} />
        <StatCard
          label="Total de Passageiros"
          value={totalPassengers.toLocaleString()}
        />
        <StatCard label="Total de Doentes" value={totalDoe.toLocaleString()} />
        <StatCard
          label="Total de Carga"
          value={totalCargo.toLocaleString() + " Kg"}
        />
      </SimpleGrid>

      {/* Pie Charts */}
      <Flex direction={{ base: "column", lg: "row" }} gap={6} mb={6}>
        <PieChartCard
          title="Horas por Modalidade"
          data={hoursByType}
          totalHours={totalHours}
        />
        <PieChartCard
          title="Horas por Ação"
          data={hoursByAction}
          totalHours={totalHours}
        />
      </Flex>

      {/* Top Pilots by Type */}
      <TopPilotsSection
        topPilotsByType={topPilotsByType}
        selectedYear={selectedYear}
      />

      {/* Expiring Qualifications */}
      <ExpiringQualificationsTable
        qualifications={expiringQualifications}
        loading={loadingExpiring}
      />

      {/* Realtime Status Indicator */}
      <Box
        bg="bg.card"
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
  );
}