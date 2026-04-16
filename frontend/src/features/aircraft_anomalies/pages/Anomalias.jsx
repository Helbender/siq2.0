import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import AnomalyAlertList from "../components/AnomalyAlertList";
import AnomaliasTable from "../components/table/AnomaliasTable";
import { usePlanesWithAnomalies } from "../hooks/usePlanesWithAnomalies";

export default function Anomalias() {
  const { data: planes, isLoading, isError, error } = usePlanesWithAnomalies();

  return (
    <Box w="100%" bg="bg.surface" h="100%" p={4}>
      <Heading size="xl" textAlign="center" mb={4}>
        Anomalias
      </Heading>
      {isLoading && (
        <Box display="flex" justifyContent="center" py={8}>
          <Spinner size="lg" />
        </Box>
      )}
      {isError && (
        <Text color="fg.muted" textAlign="center" py={4}>
          {error?.message ?? "Erro ao carregar dados."}
        </Text>
      )}
      {!isLoading && !isError && (
        <>
          <AnomalyAlertList
            planes={planes ?? []}
            threshold={0.5}
            mode="above"
          />
          <AnomaliasTable planes={planes ?? []} />
        </>
      )}
    </Box>
  );
}
