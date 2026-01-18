import { http } from "@/api/http";
import { useToast } from "@/utils/useToast";
import {
  Button,
  Container,
  Flex,
  HStack,
  Input,
  Spacer,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BiRefresh } from "react-icons/bi";

import { CreateQualModal } from "../components/CreateQualModal";
import { QualificationTable } from "../components/QualificationTable";
import { SegmentFilter } from "../components/SegmentFilter";
import { useQualificationFilters } from "../hooks/useQualificationFilters";

export function QualificationManagementPage() {
  const [qualifications, setQualifications] = useState([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const toast = useToast();

  const {
    search,
    setSearch,
    group,
    setGroup,
    type,
    setType,
    allTypes,
    availableGroups,
    filtered,
  } = useQualificationFilters(qualifications);

  useEffect(() => {
    http.get("/v2/qualificacoes").then(res => setQualifications(res.data));
  }, []);

  const handleReprocessAllFlights = async () => {
    setIsReprocessing(true);
    toast({
      title: "A reprocessar voos",
      description: "Por favor aguarde...",
      status: "info",
      duration: 10000,
      isClosable: true,
    });

    try {
      const res = await http.post("/flights/reprocess-all-qualifications");
      toast.closeAll();
      toast({ title: "Sucesso!", description: res.data.message, status: "success" });
    } catch (error) {
      toast.closeAll();
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao reprocessar",
        status: "error",
      });
    } finally {
      setIsReprocessing(false);
    }
  };

  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10}>
        <CreateQualModal setQualifications={setQualifications} />
        <Spacer />

        <Button
          leftIcon={<BiRefresh />}
          colorPalette="blue"
          onClick={handleReprocessAllFlights}
          isLoading={isReprocessing}
          loadingText="A processar..."
        >
          Reprocessar Todas
        </Button>

        <Input
          placeholder="Search..."
          maxW={200}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </HStack>

      <Flex mb={6} gap={4} direction={{ base: "column", md: "row" }}>
        <SegmentFilter
          title="Filtrar por Grupo"
          options={availableGroups}
          value={group}
          onChange={setGroup}
        />

        <Spacer />

        <SegmentFilter
          title="Filtrar por Posição"
          options={allTypes}
          value={type}
          onChange={setType}
        />
      </Flex>

      <QualificationTable
        qualifications={filtered}
        setQualifications={setQualifications}
      />
    </Container>
  );
}
