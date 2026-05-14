import { NativeSelect } from "@chakra-ui/react";
import { memo } from "react";

export const SegmentFilter = memo(function SegmentFilter({
  title,
  options,
  value,
  onChange,
}) {
  return (
    <NativeSelect.Root size="sm" minW="160px">
      <NativeSelect.Field
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
      >
        <option value="all">{title}: Todos</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
});
