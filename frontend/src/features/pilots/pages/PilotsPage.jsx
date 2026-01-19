import { http } from "@/api/http";
import { useToast } from "@/utils/useToast";
import { Box, Grid, SegmentGroup, Stack, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { PilotCard } from "../components/PilotCard";

const TIPO_OPTIONS = [
  { value: "PILOTO", label: "Piloto" },
  { value: "OPERADOR CABINE", label: "Operador Cabine" },
  { value: "CONTROLADOR TATICO", label: "Controlador Tático" },
  { value: "OPERADOR VIGILANCIA", label: "Operador Vigilância" },
  { value: "OPERAÇÕES", label: "Operações" },
];

export function PilotsPage({ tipo: initialTipo }) {
  const [selectedTipo, setSelectedTipo] = useState(initialTipo || "PILOTO");
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const [availableFuncoes, setAvailableFuncoes] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);

  const [pilotos, setPilotos] = useState([]);
  const location = useLocation();
  const toast = useToast();

  const getSavedPilots = async () => {
    if (!selectedTipo) return;
    
    toast({
      title: "A carregar Tripulantes",
      description: "Em processo.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const tipoForApi = selectedTipo.replace(" ", "_").replace("OPERAÇÕES", "OPERACOES");
      const res = await http.get(
        `/v2/tripulantes/qualificacoes/${tipoForApi}`,
      );
      toast.closeAll();
      toast({
        title: "Tripulantes Carregados",
        description: `${res.data.length} Tripulantes carregados com sucesso.`,
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPilotos(res.data || []);
      const funcoes = [
        ...new Set(res.data.map((qual) => qual.position).filter(Boolean)),
      ].sort();
      setAvailableFuncoes(funcoes);
      // Reset selected função when tipo changes, or select first if available
      if (funcoes.length > 0) {
        setSelectedFuncao(funcoes[0]);
      } else {
        setSelectedFuncao(null);
      }
    } catch (error) {
      console.log(error);
      toast.closeAll();
    }
  };
  useEffect(() => {
    getSavedPilots();
  }, [location, selectedTipo]);

  // Filter crew by selected função
  useEffect(() => {
    let results = pilotos;

    // Filter by selected função
    if (selectedFuncao) {
      results = results.filter((pilot) => pilot.position === selectedFuncao);
    }

    setFilteredCrew(results);
  }, [pilotos, selectedFuncao]);

  // Create função options for SegmentGroup
  const funcaoOptions = useMemo(() => {
    return availableFuncoes.map((funcao) => ({
      value: funcao,
      label: funcao,
    }));
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
          <SegmentGroup.Items items={TIPO_OPTIONS} />
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
