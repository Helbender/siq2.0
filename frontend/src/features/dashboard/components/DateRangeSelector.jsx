import { Button, Field, Flex, Input } from "@chakra-ui/react";

export function DateRangeSelector({ dateFrom, dateTo, onChange, onApply }) {
  return (
    <Flex gap={4} alignItems="flex-end" flexWrap="wrap">
      <Field.Root width="auto" minWidth="140px">
        <Field.Label>De</Field.Label>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
          bg="whiteAlpha.300"
          border="1px solid"
          borderColor="gray.700"
          borderRadius="md"
        />
      </Field.Root>
      <Field.Root width="auto" minWidth="140px">
        <Field.Label>Até</Field.Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
          bg="whiteAlpha.300"
          border="1px solid"
          borderColor="gray.700"
          borderRadius="md"
        />
      </Field.Root>
      <Button onClick={onApply} colorPalette="teal" size="md" alignSelf="flex-end">
        Aplicar
      </Button>
    </Flex>
  );
}
