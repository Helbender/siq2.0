import { Can } from "@/common/components/Can";
import { useDialogForm } from "@/common/hooks/useDialogForm";
import { Role } from "@/common/roles";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/features/auth/contexts/AuthContext";
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
import { useDeleteUser } from "../mutations/useDeleteUser";
import { useUpdateUser } from "../mutations/useUpdateUser";

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const {
    filteredUsers,
    searchTerm,
    setSearchTerm,
    loading,
  } = useUsers();
  const dialog = useDialogForm();
  const displayAsTable = useBreakpointValue({ base: false, xl: true });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const currentUserRoleLevel = currentUser?.roleLevel || currentUser?.role?.level;
  const canCreateUsers = currentUserRoleLevel !== Role.READONLY;

  const handleSubmit = async (userNip, formData) => {
    let loadingToast = null;
    
    try {
      if (userNip) {
        // Show loading toast for updates
        loadingToast = toaster.create({
          title: "A atualizar utilizador",
          description: "Por favor aguarde...",
          type: "info",
          duration: null,
          closable: false,
        });
        
        await updateUser.mutateAsync({ userId: userNip, userData: formData });
        
        // Close all toasts (including loading) and show success
        toaster.dismiss();
        toaster.create({
          title: "Utilizador atualizado com sucesso",
          type: "success",
        });
      } else {
        await createUser.mutateAsync(formData);
        // Close all existing toasts before showing success
        toaster.dismiss();
        toaster.create({
          title: "Utilizador criado com sucesso",
          type: "success",
        });
      }
      dialog.close();
    } catch (error) {
      // Close all toasts (including loading) if it exists
      toaster.dismiss();
      
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "An error occurred";
      toaster.create({
        title: userNip ? "Erro ao atualizar utilizador" : "Erro ao criar utilizador",
        description: errorMessage,
        type: "error",
      });
      throw error;
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    try {
      const res = await deleteUser.mutateAsync(user.nip);
      if (res?.deleted_id) {
        toaster.create({
          title: "Utilizador apagado com sucesso",
          description: `Utilizador com o nip ${res.deleted_id} apagado`,
          type: "info",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "An error occurred";
      toaster.create({
        title: "Erro ao apagar utilizador",
        description: errorMessage,
        type: "error",
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
        {canCreateUsers && (
          <Button onClick={(e) => {e.preventDefault(); dialog.openCreate()}} colorPalette="green">Novo Utilizador</Button>
        )}
        <CreateUserModal
          isOpen={dialog.isOpen}
          onClose={dialog.close}
          editingUser={dialog.editing}
          onSubmit={handleSubmit}
          isSubmitting={updateUser.isPending || createUser.isPending}
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
      <Can minLevel={Role.UNIF}>
        <FileUpload />
      </Can>
    </Container>
  );
}
