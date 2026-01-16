import React from "react";
import {
  Box,
  CheckboxGroup,
  Stack,
  Checkbox,
  Text,
} from "@chakra-ui/react";

export function QualificationGroupFilter({
  availableGroups,
  selectedGroups,
  onGroupChange,
  filter,
}) {
  return (
    <Box
      p={4}
      bg="bg.card"
      borderRadius="md"
      border="1px"
      borderColor="border.subtle"
      boxShadow="sm"
      minW="200px"
    >
      <Text fontWeight="bold" mb={3} fontSize="sm" color="gray.600">
        {filter ? `Filtrar por ${filter}` : "Filtrar por Grupo"}
      </Text>
      <CheckboxGroup value={selectedGroups} onChange={onGroupChange}>
        <Stack spacing={2} direction={{ base: "column", md: "row" }}>
          {availableGroups.map((group) => (
            <Checkbox key={group} value={group} size="sm">
              <Text fontSize="sm" textTransform="capitalize">
                {group}
              </Text>
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </Box>
  );
}
