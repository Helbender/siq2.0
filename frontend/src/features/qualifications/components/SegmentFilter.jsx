import { Box, SegmentGroup, Text } from "@chakra-ui/react";
import { memo, useMemo } from "react";

export const SegmentFilter = memo(function SegmentFilter({
  title,
  options,
  value,
  onChange,
}) {
  const items = useMemo(
    () => [
      { value: "all", label: "Todos" },
      ...options.map(opt => ({
        value: opt,
        label: opt.charAt(0).toUpperCase() + opt.slice(1),
      })),
    ],
    [options]
  );

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
        {title}
      </Text>

      <SegmentGroup.Root
      bg="#2D3748"
      color="white"
        value={value}
        onValueChange={(d) => onChange(d.value)}
        size="sm"
        css={{
          "--segment-indicator-bg": "colors.teal.500",
          "& [data-selected]": {
            bg: "teal.500",
            color: "white",
          },
        //   "& [data-part='item']:not([data-selected])": {
        //     bg: "#2D3748",
        //     color: "white",
        //   },
        }}
      >
        <SegmentGroup.Items items={items} />
        <SegmentGroup.Indicator />
      </SegmentGroup.Root>
    </Box>
  );
});
