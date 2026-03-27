import { useCrewTypes } from "@/app/providers/CrewTypesProvider";
import { QualificationsPreviewPage } from "@/features/qualifications-preview/pages/QualificationsPreviewPage";
import { FeatureBasePage } from "@/shared/components/FeatureBasePage";
import { Box, Flex, SegmentGroup, Tabs, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { usePilots } from "../hooks/usePilots";
import { PilotsPage } from "./PilotsPage";
import { QualificationTablePage } from "./QualificationTablePage";

export function CrewQualifications({ tipo }) {
  const [activeTab, setActiveTab] = useState("Individuais");
  const [selectedTipo, setSelectedTipo] = useState(null);
  const [selectedFuncao, setSelectedFuncao] = useState(null);
  const { TipoTripulante, getCrewTypeOptions } = useCrewTypes();

  // Use provided tipo or default to PILOTO, ensuring TipoTripulante is available
  const initialTipo = useMemo(
    () => tipo || TipoTripulante?.PILOTO || "PILOTO",
    [tipo, TipoTripulante?.PILOTO],
  );
  const { pilotos = [], loading: isLoading } = usePilots(
    selectedTipo || initialTipo,
  );

  // Initialize selectedTipo when TipoTripulante is available
  useEffect(() => {
    if (!selectedTipo && TipoTripulante?.PILOTO) {
      setSelectedTipo(initialTipo);
    }
  }, [TipoTripulante, initialTipo, selectedTipo]);

  // Get available funções (positions) from pilotos
  const availableFuncoes = useMemo(() => {
    return [...new Set(pilotos.map((p) => p.position).filter(Boolean))].sort();
  }, [pilotos]);

  const funcaoOptions = useMemo(() => {
    return availableFuncoes.map((funcao) => ({
      value: funcao,
      label: funcao,
    }));
  }, [availableFuncoes]);

  // Filter crew by selected função
  const filteredCrew = useMemo(() => {
    if (!selectedFuncao) return pilotos;
    return pilotos.filter((p) => p.position === selectedFuncao);
  }, [pilotos, selectedFuncao]);

  // Set first função as selected by default when available or when tipo changes
  useEffect(() => {
    setSelectedFuncao((prev) => {
      if (availableFuncoes.length === 0) return null;
      if (!prev || !availableFuncoes.includes(prev)) return availableFuncoes[0];
      return prev; // no state update if already valid
    });
  }, [availableFuncoes]);

  return (
    <FeatureBasePage>
      <Tabs.Root
        lazyMount
        variant="outline"
        // value={activeTab}
        // onValueChange={(d) => setActiveTab(d.value)}
        defaultValue="Individuais"
      >
        <VStack gap={4} mb={6}>
          <Tabs.List width="100%">
            <Tabs.Trigger value="Individuais">Individuais</Tabs.Trigger>
            <Tabs.Trigger value="Planeamento">Planeamento</Tabs.Trigger>
            <Tabs.Trigger value="A expirar">A expirar</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          {/* Tipo de Tripulante Filter */}
          {activeTab !== "A expirar" && (
            <Flex
              gap={6}
              direction={{ base: "column", md: "row" }}
              alignItems={{ base: "flex-start", md: "flex-end" }}
              width="100%"
            >
              <Box flex="1">
                <Text
                  fontWeight="bold"
                  mb={3}
                  fontSize="md"
                  color="text.secondary"
                >
                  Tipo de Tripulante
                </Text>
                <SegmentGroup.Root
                  value={selectedTipo || initialTipo}
                  onValueChange={(details) => setSelectedTipo(details.value)}
                  size="md"
                >
                  <SegmentGroup.Items items={getCrewTypeOptions()} />
                  <SegmentGroup.Indicator />
                </SegmentGroup.Root>
              </Box>

              {/* Função Filter */}
              {availableFuncoes.length > 0 && (
                <Box flex="1">
                  <Text
                    fontWeight="bold"
                    mb={3}
                    fontSize="md"
                    color="text.secondary"
                  >
                    Função
                  </Text>
                  <SegmentGroup.Root
                    value={selectedFuncao || ""}
                    onValueChange={(details) =>
                      setSelectedFuncao(details.value)
                    }
                    size="md"
                  >
                    <SegmentGroup.Items items={funcaoOptions} />
                    <SegmentGroup.Indicator />
                  </SegmentGroup.Root>
                </Box>
              )}
            </Flex>
          )}
        </VStack>

        <Tabs.Content value="Individuais">
          <PilotsPage pilotos={filteredCrew} loading={isLoading} />
        </Tabs.Content>

        <Tabs.Content value="Planeamento">
          <QualificationTablePage pilotos={filteredCrew} loading={isLoading} />
        </Tabs.Content>

        <Tabs.Content value="A expirar">
          <QualificationsPreviewPage />
        </Tabs.Content>
      </Tabs.Root>
    </FeatureBasePage>
  );
}
