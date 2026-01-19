import { Stat } from "@chakra-ui/react";

export function StatCard({ label, value }) {
  return (
    <Stat.Root bg="bg.cardSubtle" p={4} borderRadius="lg" boxShadow="md">
      <Stat.Label>{label}</Stat.Label>
      <Stat.ValueText>{value}</Stat.ValueText>
    </Stat.Root>
  );
}