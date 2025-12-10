import React from "react";
import {
  Box,
  CheckboxGroup,
  Stack,
  Checkbox,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const QualificationGroupFilter = ({
  availableGroups,
  selectedGroups,
  onGroupChange,
  filter,
}) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
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
};

export default QualificationGroupFilter;
