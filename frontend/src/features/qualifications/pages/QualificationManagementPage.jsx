import { Can } from "@/shared/components/Can";
import { Role } from "@/shared/roles";
import { toaster } from "@/shared/utils/toaster";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Input,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { BiRefresh } from "react-icons/bi";

import { CreateQualModal } from "../components/CreateQualModal";
import { QualificationTable } from "../components/QualificationTable";
import { SegmentFilter } from "../components/SegmentFilter";
import { useQualificationFilters } from "../hooks/useQualificationFilters";
import { useReprocessFlights } from "../mutations/useReprocessFlights";
import { useQualificationsQuery } from "../queries/useQualificationsQuery";

export function QualificationManagementPage() {
  const { data: qualifications = [], isLoading } = useQualificationsQuery();
  const reprocessFlights = useReprocessFlights();

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

  const handleReprocessAllFlights = async () => {
    const promise = reprocessFlights.mutateAsync();

    toaster.promise(promise, {
      loading: {
        title: "A reprocessar voos",
        description: "Por favor aguarde",
      },
      success: (res) => ({
        title: "Sucesso!",
        description: res?.message ?? "Reprocessamento concluído",
      }),
      error: (err) => ({
        title: "Erro",
        description: err.response?.data?.message ?? "Erro ao reprocessar",
      }),
    });

    try {
      await promise;
    } catch {
      // Error toast handled by toaster.promise
    }
  };

  return (
    <Can
      minLevel={Role.UNIF}
      fallback={
        <Container maxW="90%" py={6} mb={35}>
          <Box textAlign="center" py={10}>
            <Text fontSize="xl" fontWeight="bold" color="text.secondary">
              Acesso Negado
            </Text>
            <Text mt={2} color="text.muted">
              Você precisa ter nível UNIF ou superior para acessar esta página.
            </Text>
          </Box>
        </Container>
      }
    >
      <Container maxW="90%" py={6} mb={35}>
        <HStack mb={10}>
          <Can minLevel={Role.UNIF}>
            <CreateQualModal />
          </Can>
          <Spacer />

          <Can minLevel={Role.UNIF}>
            <Button
              leftIcon={<BiRefresh />}
              colorPalette="blue"
              onClick={handleReprocessAllFlights}
              isLoading={reprocessFlights.isPending}
              loadingText="A processar..."
            >
              Reprocessar Todas
            </Button>
          </Can>

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

        <QualificationTable qualifications={filtered} />
      </Container>
    </Can>
  );
}
