import { Box, Checkbox, Stack, Text } from "@chakra-ui/react";
import { memo } from "react";

export const QualificationGroupFilter = memo(function QualificationGroupFilter({
  availableGroups,
  selectedGroups,
  onGroupChange,
  filter,
}) {
  const handleToggle = (group) => {
    if (selectedGroups.includes(group)) {
      onGroupChange(selectedGroups.filter((g) => g !== group));
    } else {
      onGroupChange([...selectedGroups, group]);
    }
  };

  const handleSelectAll = (details) => {
    if (selectedGroups.length === availableGroups.length) {
      onGroupChange([]);
    } else {
      onGroupChange([...availableGroups]);
    }
  };

  const allSelected = availableGroups.length > 0 && selectedGroups.length === availableGroups.length;
  const isIndeterminate = selectedGroups.length > 0 && !allSelected;

  return (
    <Box
      p={4}
      bg="whiteAlpha.400"
      borderRadius="md"
      border="1 solid"
      borderColor="#4A5568"
      boxShadow="sm"
      minW="200px"
    >
      <Text fontWeight="bold" mb={3} fontSize="sm" color="text.secondary">
        {filter}
      </Text>
      <Stack spacing={2}>
        <Checkbox.Root
          checked={allSelected}
          {...(isIndeterminate && { indeterminate: true })}
          onCheckedChange={handleSelectAll}
          colorPalette="teal"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label>
            <Text fontSize="sm">Todos</Text>
          </Checkbox.Label>
        </Checkbox.Root>
        {availableGroups.map((group) => (
          <Checkbox.Root
            key={group}
            checked={selectedGroups.includes(group)}
            onCheckedChange={() => handleToggle(group)}
            colorPalette="teal"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              <Text fontSize="sm">{group}</Text>
            </Checkbox.Label>
          </Checkbox.Root>
        ))}
      </Stack>
    </Box>
  );
});
