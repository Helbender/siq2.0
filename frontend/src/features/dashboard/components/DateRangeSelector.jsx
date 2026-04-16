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
          bg="bg.card"
          borderColor="border.subtle"
        />
      </Field.Root>
      <Field.Root width="auto" minWidth="140px">
        <Field.Label>Até</Field.Label>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
          bg="bg.card"
          borderColor="border.subtle"
        />
      </Field.Root>
      <Field.Root width="auto">
        <Field.Label />
        <Button
          onClick={onApply}
          variant="solid"
          colorPalette={"blue"}
          size="md"
        >
          Aplicar
        </Button>
      </Field.Root>
    </Flex>
  );
}
