import { Box, Heading, Table, Text } from "@chakra-ui/react";

export function ExpiringQualificationsTable({ qualifications, loading }) {
  const getRemainingDaysText = (remainingDays) => {
    if (remainingDays > 0) {
      return `${remainingDays} dias`;
    }
    if (remainingDays < 0) {
      return `Expirou há ${Math.abs(remainingDays)} dias`;
    }
    return "Expira hoje";
  };

  const getRemainingDaysColor = (remainingDays) => {
    if (remainingDays < 0) return "red.500";
    if (remainingDays <= 30) return "orange.500";
    return "gray.700";
  };

  return (
    <Box mb={6}>
      <Heading size="md" mb={4} textAlign="center">
        Qualificações com Menor Tempo Restante (Top 10)
      </Heading>
      <Box bg="bg.surface" p={4} borderRadius="lg" boxShadow="md">
        {loading ? (
          <Text textAlign="center">A carregar...</Text>
        ) : qualifications.length > 0 ? (
          <Table.Root variant="simple" size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Tripulante</Table.ColumnHeader>
                <Table.ColumnHeader>Qualificação</Table.ColumnHeader>
                <Table.ColumnHeader isNumeric>Dias Restantes</Table.ColumnHeader>
                <Table.ColumnHeader>Data de Expiração</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {qualifications.map((item, index) => (
                <Table.Row
                  key={index}
                  borderBottom="1px solid"
                  borderColor="gray.700"
                >
                  <Table.Cell>
                    <Text fontWeight="medium">
                      {item.crew_member.rank} {item.crew_member.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      NIP: {item.crew_member.nip}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="medium">{item.qualification_name}</Text>
                  </Table.Cell>
                  <Table.Cell isNumeric>
                    <Text
                      fontWeight="bold"
                      color={getRemainingDaysColor(item.remaining_days)}
                    >
                      {getRemainingDaysText(item.remaining_days)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">
                      {new Date(item.expiry_date).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <Text textAlign="center">Nenhuma qualificação encontrada</Text>
        )}
      </Box>
    </Box>
  );
}