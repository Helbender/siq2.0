import { useState } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Flex,
  Icon,
  HStack,
  Field,
} from "@chakra-ui/react";
import api from "@/utils/api";
import { useToast } from "@/utils/useToast";
import { FiUploadCloud } from "react-icons/fi";

export function FileUpload() {
  const [file, setFile] = useState(null);
  const toast = useToast();

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Seleciona um ficheiro primeiro.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    console.log(formData);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post("/users/add_users", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: "Bearer " + token,
        },
      });
      toast({
        title: "Sucesso",
        description: response.data.message || "Upload feito com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: error.response?.data?.message || "Ocorreu um erro.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  const handleBackup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/users/backup", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      toast({
        title: "Sucesso",
        description: response.data.message || "Backup feito com sucesso!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Erro no backup",
        description: error.response?.data?.message || "Ocorreu um erro.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} maxW="md" mx="auto">
      <VStack spacing={4}>
        <Text fontSize="xl" fontWeight="bold">
          Upload de Ficheiro
        </Text>

        <Field.Root>
          <Field.Label
            htmlFor="file-upload"
            cursor="pointer"
            w="full"
            border="2px dashed"
            borderColor="gray.300"
            borderRadius="xl"
            p={6}
            textAlign="center"
            _hover={{
              borderColor: "blue.500",
              bg: "gray.50",
              textColor: "blue.500",
              fontWeight: "bold",
            }}
          >
            <Flex direction="column" align="center" gap={2}>
              <Icon as={FiUploadCloud} boxSize={6} color="gray.500" />
              <Text>{file ? file.name : "Clique para escolher um ficheiro"}</Text>
            </Flex>
          </Field.Label>

          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            hidden
          />
        </Field.Root>

        <HStack>
          <Button colorPalette="blue" onClick={handleUpload}>
            Enviar
          </Button>
          <Button colorPalette="purple" onClick={handleBackup}>
            Executar Backup
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
