import { Field, NativeSelect } from "@chakra-ui/react";

export function YearSelector({ value, onChange, availableYears }) {
  return (
    <Field.Root width="auto" display="flex" alignItems="center" gap={3}>
      <Field.Label mb={0}>Selecionar Ano</Field.Label>
      <NativeSelect.Root
        bg="whiteAlpha.300"
        width="150px"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="md"
      >
        <NativeSelect.Field value={value} onChange={(e) => onChange(parseInt(e.target.value))}>
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}