import { Box, Grid, SegmentGroup, Stack, Text } from "@chakra-ui/react";
import { useCrewTypes } from "@/common/CrewTypesProvider";
import { useEffect, useMemo, useState } from "react";
import { PilotCard } from "../components/PilotCard";
import { usePilots } from "../hooks/usePilots";

export function PilotsPage({ tipo: initialTipo }) {
  const { TipoTripulante, getCrewTypeOptions } = useCrewTypes();
  const [selectedTipo, setSelectedTipo] = useState(initialTipo ?? TipoTripulante.PILOTO);
  const [selectedFuncao, setSelectedFuncao] = useState(null);

  const { pilotos } = usePilots(selectedTipo);

  const availableFuncoes = useMemo(
    () =>
      [...new Set(pilotos.map(p => p.position).filter(Boolean))].sort(),
    [pilotos]
  );

  const funcaoOptions = useMemo(() => {
    return availableFuncoes.map((funcao) => ({
      value: funcao,
      label: funcao,
    }));
  }, [availableFuncoes]);

  const filteredCrew = useMemo(() => {
    if (!selectedFuncao) return pilotos;
    return pilotos.filter(p => p.position === selectedFuncao);
  }, [pilotos, selectedFuncao]);

  useEffect(() => {
    setSelectedFuncao(availableFuncoes[0] ?? null);
  }, [availableFuncoes]);

  return (
    <Stack m={4} pb={10}>
      <Box ml={4} mb={6}>
        <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
          Tipo de Tripulante
        </Text>
        <SegmentGroup.Root
          value={selectedTipo}
          onValueChange={(details) => setSelectedTipo(details.value)}
          size="md"
          css={{
            "--segment-indicator-bg": "colors.teal.500",
            "& [data-selected]": {
              bg: "teal.500",
              color: "white",
            },
          }}
        >
          <SegmentGroup.Items items={getCrewTypeOptions()} />
          <SegmentGroup.Indicator />
        </SegmentGroup.Root>
      </Box>
      {availableFuncoes.length > 0 && (
        <Box ml={4} mb={6}>
          <Text fontWeight="bold" mb={3} fontSize="md" color="text.secondary">
            Função
          </Text>
          <SegmentGroup.Root
            value={selectedFuncao || ""}
            onValueChange={(details) => setSelectedFuncao(details.value)}
            size="md"
            css={{
              "--segment-indicator-bg": "colors.teal.500",
              "& [data-selected]": {
                bg: "teal.500",
                color: "white",
              },
            }}
          >
            <SegmentGroup.Items items={funcaoOptions} />
            <SegmentGroup.Indicator />
          </SegmentGroup.Root>
        </Box>
      )}
      <Grid templateColumns="repeat(auto-fill, minmax(400px, 1fr))" gap={6}>
        {filteredCrew.map((pilot) => (
          <PilotCard key={pilot.nip} user={pilot} />
        ))}
      </Grid>
    </Stack>
  );
}
