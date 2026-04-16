import { Card, Stat } from "@chakra-ui/react";

export function StatCard({ label, value }) {
  return (
    <Card.Root variant="glass">
      <Card.Body py={4}>
        <Stat.Root>
          <Stat.Label>{label}</Stat.Label>
          <Stat.ValueText>{value}</Stat.ValueText>
        </Stat.Root>
      </Card.Body>
    </Card.Root>
  );
}
