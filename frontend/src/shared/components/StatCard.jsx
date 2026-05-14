import { Stat } from "@chakra-ui/react";

export function StatCard({ label, value, unit }) {
  const values = Array.isArray(value) ? value : [value];
  const units = Array.isArray(unit) ? unit : [unit];

  return (
    <Stat.Root variant="glass">
      <Stat.Label>{label}</Stat.Label>
      <Stat.ValueText>
        {values.map((v, i) => (
          <span key={i}>
            {v}
            {units[i] && (
              <Stat.ValueUnit paddingLeft={1}>{units[i]}</Stat.ValueUnit>
            )}
          </span>
        ))}
      </Stat.ValueText>
    </Stat.Root>
  );
}
