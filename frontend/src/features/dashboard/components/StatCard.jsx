import { Stat } from "@chakra-ui/react";

export function StatCard({ label, value }) {
  return (
    <Stat.Root bg="bg.cardSubtle" p={4} borderRadius="lg" boxShadow="md" backdropFilter="blur(20px)"
    // _hover={{ backdropFilter: "blur(20px)",bg:"bg.muted", transition:"all 0.3s ease" , transform:"translateY(-5px)"}}
    >
      <Stat.Label>{label}</Stat.Label>
      <Stat.ValueText>{value}</Stat.ValueText>
    </Stat.Root>
  );
}