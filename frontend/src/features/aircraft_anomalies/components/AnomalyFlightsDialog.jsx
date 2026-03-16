import { Box, Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";

export default function AnomalyFlightsDialog({ open, onOpenChange, selected }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} rounded="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content rounded="md" bg="bg.cardSubtle">
            <Dialog.Header rounded="md">
              {selected
                ? `Voos com anomalia "${selected.anomaliaName}" (Avião ${selected.num})`
                : "Voos com anomalia"}
            </Dialog.Header>
            {/* <Dialog.CloseTrigger asChild>
              <IconButton variant="ghost" size="sm">
                <HiX />
              </IconButton>
            </Dialog.CloseTrigger> */}
            <Dialog.Body>
              {!selected ? null : selected.flights.length === 0 ? (
                <Text color="fg.muted">Sem voos associados a esta anomalia.</Text>
              ) : (
                <Stack gap={2}>
                  {selected.flights.map((f) => (
                    <Box
                      key={f.id}
                      p={3}
                      borderWidth="1px"
                      borderColor="border.subtle"
                      borderRadius="md"
                      bg="bg.surface"
                      _hover={{ bg: "whiteAlpha.200" }}
                    >
                      <Text fontWeight="semibold">
                        {f.airtask} · {f.date} · {f.atd}
                      </Text>
                      <Text color="fg.muted">{f.pilot}</Text>
                    </Box>
                  ))}
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="subtle">Fechar</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

