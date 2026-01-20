import { useState } from "react";
import {
  Box,
  Button,
  Table,
  Text,
  Spinner,
  Alert,
  HStack,
} from "@chakra-ui/react";
import { FaCloud } from "react-icons/fa";
import { DeleteYearModal } from "./DeleteYearModal";
import { useDialogForm } from "@/common/hooks/useDialogForm";
import { useRebackupFlightsByYear } from "../mutations/useRebackupFlightsByYear";
import { useToast } from "@/utils/useToast";
import { toaster } from "@/components/ui/toaster";

export function YearStatsTable({ data, isLoading, error }) {
  const deleteDialog = useDialogForm();
  const rebackupFlightsByYear = useRebackupFlightsByYear();
  const toast = useToast();
  const [backingUpYear, setBackingUpYear] = useState(null);

  const handleRebackupYear = async (year) => {
    setBackingUpYear(year);
    // Show loading toast
    const loadingToast = toast({
      title: `Starting backup for ${year}...`,
      description: "Processing flights and preparing for upload to Google Drive",
      status: "info",
      duration: null, // Keep it open until we close it
      isClosable: false,
    });

    try {
      const result = await rebackupFlightsByYear.mutateAsync(year);
      // Close loading toast and show success
      if (loadingToast?.id) {
        toaster.dismiss(loadingToast.id);
      }
      toast({
        title: "Backup started",
        description: result.message,
        status: "success",
        duration: 5000,
      });
      // Reset button state - work continues in background
      setBackingUpYear(null);
    } catch (error) {
      // Close loading toast and show error
      if (loadingToast?.id) {
        toaster.dismiss(loadingToast.id);
      }
      toast({
        title: "Error starting backup",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
      });
      // Reset button state on error too
      setBackingUpYear(null);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>Error loading flight statistics: {error.message}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="gray.500">No flight data available.</Text>
      </Box>
    );
  }

  return (
    <>
      <Table.Root variant="simple">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Year</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Number of Flights</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((item) => (
            <Table.Row key={item.year}>
              <Table.Cell>
                <Text fontWeight="semibold">{item.year}</Text>
              </Table.Cell>
              <Table.Cell textAlign="end">
                <Text>{item.flight_count}</Text>
              </Table.Cell>
              <Table.Cell>
                <HStack spacing={2}>
                  <Button
                    leftIcon={<FaCloud />}
                    colorPalette="blue"
                    size="sm"
                    onClick={() => handleRebackupYear(item.year)}
                    isLoading={backingUpYear === item.year}
                    loadingText="Starting..."
                    disabled={backingUpYear === item.year}
                  >
                    Backup Year
                  </Button>
                  <Button
                    colorPalette="red"
                    size="sm"
                    onClick={() => deleteDialog.open({ year: item.year, flightCount: item.flight_count })}
                  >
                    Delete Year
                  </Button>
                </HStack>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {deleteDialog.isOpen && (
        <DeleteYearModal
          isOpen={deleteDialog.isOpen}
          onClose={deleteDialog.close}
          year={deleteDialog.data?.year}
          flightCount={deleteDialog.data?.flightCount}
        />
      )}
    </>
  );
}
