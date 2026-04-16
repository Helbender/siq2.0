import { Badge } from "@chakra-ui/react";

export default function StatusBadge({ percentage }) {
  const color = percentage < 0.5 ? "success" : "danger";
  const label = Math.round(percentage * 100) + "%";
  return <Badge colorPalette={color}>{label}</Badge>;
}
