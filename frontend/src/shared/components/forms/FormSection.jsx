import { Box, Heading, VStack } from "@chakra-ui/react"

export function FormSection({ title, children }) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      borderRadius="card"
      p="6"
      // bg="bg.canvas"
    >
      <VStack align="stretch" gap="4">

        <Heading size="sm">
          {title}
        </Heading>

        {children}

      </VStack>
    </Box>
  )
}