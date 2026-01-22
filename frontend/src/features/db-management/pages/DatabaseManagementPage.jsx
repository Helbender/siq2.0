import { Can } from "@/common/components/Can";
import { Role } from "@/common/roles";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Field,
  Heading,
  HStack,
  Input,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState, useRef } from "react";
import { FaCloud, FaDownload, FaUpload } from "react-icons/fa";
import { YearStatsTable } from "../components/YearStatsTable";
import { useFlightsByYear } from "../hooks/useFlightsByYear";
import { useExportQualifications } from "../mutations/useExportQualifications";
import { useExportUsers } from "../mutations/useExportUsers";
import { useImportQualifications } from "../mutations/useImportQualifications";
import { useRebackupFlights } from "../mutations/useRebackupFlights";

export function DatabaseManagementPage() {
  const { user } = useAuth();
  const userRoleLevel = user?.roleLevel || user?.role?.level;
  const hasAccess = userRoleLevel >= Role.SUPER_ADMIN;
  
  // Only fetch data if user has SUPER_ADMIN access
  const { data, isLoading, error } = useFlightsByYear({
    enabled: hasAccess,
  });

  const rebackupFlights = useRebackupFlights();
  const exportQualifications = useExportQualifications();
  const exportUsers = useExportUsers();
  const importQualifications = useImportQualifications();
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleRebackupFlights = async () => {
    // Show loading toast
    const loadingToast = toaster.create({
      title: "Starting backup...",
      description: "Processing flights and preparing for upload to Google Drive",
      type: "info",
      duration: null,
      closable: false,
    });

    try {
      const result = await rebackupFlights.mutateAsync();
      // Close loading toast and show success
      if (loadingToast?.id) {
        toaster.dismiss(loadingToast.id);
      }
      toaster.create({
        title: "Backup started",
        description: result.message,
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      // Close loading toast and show error
      if (loadingToast?.id) {
        toaster.dismiss(loadingToast.id);
      }
      toaster.create({
        title: "Error starting backup",
        description: error.response?.data?.error || error.message,
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleExportQualifications = async () => {
    try {
      await exportQualifications.mutateAsync();
      toaster.create({
        title: "Backup downloaded",
        description: "Qualifications backup file downloaded successfully",
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      toaster.create({
        title: "Error downloading backup",
        description: error.response?.data?.error || error.message,
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      await exportUsers.mutateAsync();
      toaster.create({
        title: "Backup downloaded",
        description: "Users backup file downloaded successfully",
        type: "success",
        duration: 5000,
      });
    } catch (error) {
      toaster.create({
        title: "Error downloading backup",
        description: error.response?.data?.error || error.message,
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadQualifications = async () => {
    if (!selectedFile) {
      toaster.create({
        title: "No file selected",
        description: "Please select a qualifications backup file first",
        type: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const result = await importQualifications.mutateAsync(selectedFile);
      toaster.create({
        title: "Import completed",
        description: result.message || "Qualifications imported successfully",
        type: "success",
        duration: 5000,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toaster.create({
        title: "Error importing qualifications",
        description: error.response?.data?.error || error.message,
        type: "error",
        duration: 5000,
      });
    }
  };

  return (
    <Can minLevel={Role.SUPER_ADMIN}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>
              Database Management
            </Heading>
            <Text color="gray.500">
              Manage flight data by year. View statistics, delete entire years, and create backups.
            </Text>
          </Box>

          {/* Backup Operations Section */}
          <Card.Root bg="bg.cardSubtle">
            <Card.Header>
              <Heading size="md">Backup Operations</Heading>
            </Card.Header>
            <Card.Body>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Google Drive Backup
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Rebackup all flights to Google Drive. This will process all flights and upload them in the background.
                  </Text>
                  <Button
                    leftIcon={<FaCloud />}
                    onClick={handleRebackupFlights}
                    isLoading={rebackupFlights.isPending}
                    loadingText="Starting backup..."
                    colorPalette="blue"
                    disabled={rebackupFlights.isPending}
                  >
                    Rebackup All Flights to Google Drive
                  </Button>
                </Box>

                <Separator />

                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Download Backups
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Download JSON backups of qualifications and users data.
                  </Text>
                  <HStack spacing={3}>
                    <Button
                      leftIcon={<FaDownload />}
                      onClick={handleExportQualifications}
                      isLoading={exportQualifications.isPending}
                      loadingText="Downloading..."
                      variant="subtle"
                      disabled={exportQualifications.isPending}
                    >
                      Download Qualifications Backup
                    </Button>
                    <Button
                      leftIcon={<FaDownload />}
                      onClick={handleExportUsers}
                      isLoading={exportUsers.isPending}
                      loadingText="Downloading..."
                      variant="subtle"
                      disabled={exportUsers.isPending}
                    >
                      Download Users Backup
                    </Button>
                  </HStack>
                </Box>

                <Separator />

                <Box>
                  <Text mb={2} fontWeight="semibold">
                    Upload Qualifications Backup
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    Upload a JSON backup file to restore qualifications. Existing qualifications will be updated, new ones will be created.
                  </Text>
                  <VStack spacing={3} align="stretch">
                    <Field.Root>
                      <Field.Label htmlFor="qualifications-upload">
                        Select Qualifications Backup File
                      </Field.Label>
                      <Input
                        id="qualifications-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                      />
                      {selectedFile && (
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          Selected: {selectedFile.name}
                        </Text>
                      )}
                    </Field.Root>
                    <Button
                      leftIcon={<FaUpload />}
                      onClick={handleUploadQualifications}
                      isLoading={importQualifications.isPending}
                      loadingText="Uploading..."
                      colorPalette="green"
                      disabled={importQualifications.isPending || !selectedFile}
                    >
                      Upload Qualifications Backup
                    </Button>
                  </VStack>
                </Box>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Year Management Section */}
          <Card.Root bg="bg.cardSubtle">
            <Card.Header>
              <Heading size="md">Flights by Year</Heading>
            </Card.Header>
            <Card.Body>
              <Alert.Root status="warning" mb={4}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Warning</Alert.Title>
                  <Alert.Description>
                    <strong>Warning:</strong> Deleting a year will permanently remove all flights and associated flight pilot records for that year. This action cannot be undone.
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
              <YearStatsTable data={data} isLoading={isLoading} error={error} />
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </Can>
  );
}
