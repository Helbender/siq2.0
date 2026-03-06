import { Box, Heading, Table, Text } from "@chakra-ui/react";
import { PREVIEW_DAYS } from "../constants";
import { usePilotQualificationsPreview } from "../hooks/usePilotQualificationsPreview";

function getRemainingDaysText(remainingDays) {
  if (remainingDays > 0) return `${remainingDays} dias`;
  if (remainingDays < 0) return `Expirou há ${Math.abs(remainingDays)} dias`;
  return "Expira hoje";
}

function getRemainingDaysColor(remainingDays) {
  if (remainingDays < 0) return "red.500";
  if (remainingDays <= 30) return "orange.500";
  return "white";
}

export function QualificationsPreviewPage() {
  const { columns, loading, error } = usePilotQualificationsPreview(PREVIEW_DAYS);

  const maxRows = columns.length
    ? Math.max(...columns.map((col) => (col.pilots || []).length), 0)
    : 0;

  return (
    <Box p={6} overflow="auto" minH="50vh" bg="bg.canvas">
      <Heading size="lg" mb={2} textAlign="center">
        Qualificações MQP/MQOBP a expirar
      </Heading>
      <Text mb={4} textAlign="center" fontSize="sm" color="white">
        Pilotos com menos de {PREVIEW_DAYS} dias nas qualificações (ordenado por
        qualificação)
      </Text>

      <Box bg="bg.surface" p={4} borderRadius="lg" boxShadow="md">
        {error && (
          <Text color="red.500" textAlign="center">
            Erro ao carregar dados.
          </Text>
        )}
        {loading ? (
          <Text textAlign="center" color="white">A carregar...</Text>
        ) : columns.length === 0 ? (
          <Text textAlign="center" color="white">
            Nenhum piloto com qualificações MQP/MQOBP a expirar nos próximos{" "}
            {PREVIEW_DAYS} dias.
          </Text>
        ) : (
          <Table.Root variant="simple" size="sm">
            <Table.Header>
              <Table.Row>
                {columns.map((col) => (
                  <Table.ColumnHeader key={col.qualification_id} color="white">
                    {col.qualification_name}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {Array.from({ length: maxRows }, (_, rowIndex) => (
                <Table.Row
                  key={rowIndex}
                  borderBottom="1px solid"
                  borderColor="border"
                >
                  {columns.map((col) => {
                    const pilot = (col.pilots || [])[rowIndex];
                    return (
                      <Table.Cell key={col.qualification_id} color="white">
                        {pilot ? (
                          <Text
                            color={getRemainingDaysColor(pilot.remaining_days)}
                            fontWeight={
                              pilot.remaining_days <= 30 ? "medium" : "normal"
                            }
                          >
                            {pilot.name} | {getRemainingDaysText(pilot.remaining_days)}
                          </Text>
                        ) : (
                          ""
                        )}
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </Box>
  );
}
