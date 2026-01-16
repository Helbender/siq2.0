import React from "react";
import { Grid, Stack, Box } from "@chakra-ui/react";
import { PilotCard } from "../components/PilotCard";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { api } from "@/utils/api";
import { QualificationGroupFilter } from "@/features/qualifications/components/QualificationGroupFilter";
import { useToast } from "@/utils/useToast";

export function PilotsPage({ tipo }) {
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filteredCrew, setFilteredCrew] = useState([]);

  const [pilotos, setPilotos] = useState([]);
  const { token } = useContext(AuthContext);
  const location = useLocation();
  const toast = useToast();

  const getSavedPilots = async () => {
    toast({
      title: "A carregar Tripulantes",
      description: "Em processo.",
      status: "loading",
      duration: 5000,
      isClosable: true,
      position: "bottom",
    });
    try {
      const res = await api.get(
        `/v2/tripulantes/qualificacoes/${tipo.replace(" ", "_").replace("OPERAÇÕES", "OPERACOES")}`,
        {
          headers: { Authorization: "Bearer " + token },
        },
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
      const types = [
        ...new Set(res.data.map((qual) => qual.position).filter(Boolean)),
      ];
      setAvailableTypes(types);
      setSelectedTypes(types); // Select all types by default
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getSavedPilots();
  }, [location]);

  // Filter qualifications based on search term and selected groups
  useEffect(() => {
    let results = pilotos;

    // Filter by selected types
    if (selectedTypes.length > 0) {
      results = results.filter((pilot) =>
        selectedTypes.includes(pilot.position),
      );
    }

    setFilteredCrew(results);
  }, [pilotos, selectedTypes]);

  return (
    <Stack m={4} pb={10}>
      <Box ml={4} mb={6}>
        <QualificationGroupFilter
          availableGroups={availableTypes}
          selectedGroups={selectedTypes}
          onGroupChange={setSelectedTypes}
          filter={"Função"}
        />
      </Box>
      <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={6}>
        {filteredCrew.map((pilot) => (
          <PilotCard key={pilot.nip} user={pilot} />
        ))}
      </Grid>
    </Stack>
  );
}
