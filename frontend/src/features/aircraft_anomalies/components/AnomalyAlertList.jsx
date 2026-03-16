import { Alert, Box, Stack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import AnomalyFlightsDialog from "./AnomalyFlightsDialog";
import StatusBadge from "./StatusBadge";

export default function AnomalyAlertList({
  planes,
  threshold = 0.5,
  mode = "above", // "above" | "below"
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const rows = useMemo(
    () =>
      planes.flatMap((plane) =>
        plane.anomalias.map((anomalia, index) => {
          const [value, total] = anomalia.counter ?? [0, 0];
          const percentage = total ? value / total : 0;
          return {
            num: plane.num,
            anomaliaName: anomalia.name,
            value,
            total,
            percentage,
            flights: anomalia.planeAnomalyFlights ?? [],
            key: `${plane.num}-${index}-${anomalia.name}`,
          };
        })
      ),
    [planes]
  );

  const filtered =
    mode === "below"
      ? rows.filter((r) => r.percentage < threshold)
      : rows.filter((r) => r.percentage >= threshold);

  if (filtered.length === 0) {
    return (
      <Text color="fg.muted">
        Sem anomalias {mode === "below" ? "abaixo" : "acima"} de{" "}
        {Math.round(threshold * 100)}%.
      </Text>
    );
  }

  return (
    <Box bg="bg.cardSubtle" p={4} borderRadius="md" m={4}>
      <Stack gap={3}>
        {filtered.map((r) => (
          <Alert.Root
            key={r.key}
            status={mode === "below" ? "error" : "warning"}
            variant="subtle"
            cursor="pointer"
            onClick={() => {
              setSelected(r);
              setOpen(true);
            }}
          >
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>
                Avião {r.num} · {r.anomaliaName}
              </Alert.Title>
              <Alert.Description>
                <Stack direction="row" align="center" gap={3}>
                  <Text>
                    {r.value}/{r.total}
                  </Text>
                  <StatusBadge percentage={r.percentage} />
                </Stack>
              </Alert.Description>
            </Alert.Content>
          </Alert.Root>
        ))}
      </Stack>

      <AnomalyFlightsDialog
        open={open}
        selected={selected}
        onOpenChange={({ open: nextOpen }) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelected(null);
          }
        }}
      />
    </Box>
  );
}
