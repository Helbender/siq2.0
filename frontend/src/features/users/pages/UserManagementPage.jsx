import { useDialogForm } from "@/common/hooks/useDialogForm";
import { useToast } from "@/utils/useToast";
import {
  Box,
  Button,
  Container,
  Grid,
  HStack,
  Input,
  Spacer,
  Spinner,
  Text,
  useBreakpointValue
} from "@chakra-ui/react";
import { CreateUserModal } from "../components/CreateUserModal";
import { FileUpload } from "../components/FileUpload";
import { UserDataCard } from "../components/UserDataCard";
import { UsersTable } from "../components/UsersTable";
import { useUsers } from "../hooks/useUsers";
import { useCreateUser } from "../mutations/useCreateUser";
import { useUpdateUser } from "../mutations/useUpdateUser";
import { useDeleteUser } from "../mutations/useDeleteUser";

export function UserManagementPage() {
  const {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
  } = useUsers();
  const dialog = useDialogForm();
  const toast = useToast();
  const displayAsTable = useBreakpointValue({ base: false, xl: true });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleSubmit = async (userNip, formData) => {
    try {
      if (userNip) {
        await updateUser.mutateAsync({ userId: userNip, userData: formData });
        toast({ title: "User updated successfully", status: "success" });
      } else {
        await createUser.mutateAsync(formData);
        toast({ title: "User created successfully", status: "success" });
      }
      dialog.close();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "An error occurred";
      toast({
        title: userNip ? "Error updating user" : "Error creating user",
        description: errorMessage,
        status: "error",
      });
      throw error;
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    try {
      const res = await deleteUser.mutateAsync(user.nip);
      if (res?.deleted_id) {
        toast({
          title: "Utilizador apagado com sucesso",
          description: `Utilizador com o nip ${res.deleted_id} apagado`,
          status: "info",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "An error occurred";
      toast({
        title: "Error deleting user",
        description: errorMessage,
        status: "error",
      });
    }
  };
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="50vh"
      >
        <Spinner size="xl" colorPalette="brand" />
      </Box>
    );
  }
  return (
    <Container maxW="90%" py={6} mb={35}>
      <HStack mb={10} align={"center"}>
        <Button onClick={(e) => {e.preventDefault(); dialog.openCreate()}} colorPalette="green">Novo Utilizador</Button>
        <CreateUserModal
          isOpen={dialog.isOpen}
          onClose={dialog.close}
          editingUser={dialog.editing}
          onSubmit={handleSubmit}
        />
        <Spacer />
        <Text>Nº de Utilizadores: {filteredUsers.length}</Text>
        <Spacer />
        <Input
          bg="bg.surface"
          color="text.primary"
          border="1px solid"
          borderColor="border.subtle"
          borderRadius="md"
          placeholder="Search..."
          maxWidth={200}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="md"
          _hover={{
            borderColor: "border.focus",
          }}
        />
      </HStack>
      <HStack>
        {Array.from(
          filteredUsers.reduce((set, user) => {
            if (user.position) set.add(user.position);
            return set;
          }, new Set()),
        ).map((position) => (
          <Text key={position}>
            <b>{position}</b>:{" "}
            {filteredUsers.filter((user) => user.position === position).length}
          </Text>
        ))}
      </HStack>

      {displayAsTable ? (
        <UsersTable
          users={filteredUsers}
          onEdit={dialog.openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2,1fr)",
            xl: "repeat(3,1fr)",
          }}
          gap={5}
          mt="8"
        >
          {filteredUsers.map((user) => (
            <UserDataCard m={5} key={user.nip} user={user} />
          ))}
        </Grid>
      )}
      <FileUpload />
    </Container>
  );
}
