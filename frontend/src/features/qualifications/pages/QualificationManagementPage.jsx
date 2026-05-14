import { Can } from "@/shared/components/Can";
import { Role } from "@/shared/roles";
import {
  Box,
  Card,
  Container,
  HStack,
  Input,
  Spacer,
  Text,
} from "@chakra-ui/react";

import { CreateQualModal } from "../components/CreateQualModal";
import { QualificationTable } from "../components/QualificationTable";
import { SegmentFilter } from "../components/SegmentFilter";
import { useQualificationFilters } from "../hooks/useQualificationFilters";
import { useQualificationsQuery } from "../queries/useQualificationsQuery";

export function QualificationManagementPage() {
  const { data: qualifications = [], isLoading } = useQualificationsQuery();

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
        <HStack mb={4}>
          <Can minLevel={Role.UNIF}>
            <CreateQualModal />
          </Can>

          <Spacer />

          <Input
            placeholder="Search..."
            maxW={200}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </HStack>

        <HStack mb={6} gap={3}>
          <SegmentFilter
            title="Posição"
            options={allTypes}
            value={type}
            onChange={setType}
          />

          <SegmentFilter
            title="Grupo"
            options={availableGroups}
            value={group}
            onChange={setGroup}
          />
        </HStack>

        <Card.Root>
          <QualificationTable qualifications={filtered} />
        </Card.Root>
      </Container>
    </Can>
  );
}
