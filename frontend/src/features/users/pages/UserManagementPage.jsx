import { Can } from "@/shared/components/Can";
import { useDialogForm } from "@/shared/hooks/useDialogForm";
import { Role } from "@/shared/roles";
import { toaster } from "@/shared/utils/toaster";
import { useAuth } from "@features/auth";
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
    const promise = userNip
      ? updateUser.mutateAsync({ userId: userNip, userData: formData })
      : createUser.mutateAsync(formData);

    toaster.promise(promise, {
      loading: {
        title: userNip ? "A atualizar utilizador" : "A criar utilizador",
        description: "Por favor aguarde",
      },
      success: {
        title: userNip ? "Utilizador atualizado com sucesso" : "Utilizador criado com sucesso",
        description: "Operação concluída",
      },
      error: (err) => ({
        title: userNip ? "Erro ao atualizar utilizador" : "Erro ao criar utilizador",
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred",
      }),
    });

    try {
      await promise;
      dialog.close();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.name}?`)) return;

    const promise = deleteUser.mutateAsync(user.nip);

    toaster.promise(promise, {
      loading: {
        title: "A apagar utilizador…",
        description: "Por favor aguarde",
      },
      success: (res) => ({
        title: "Utilizador apagado com sucesso",
        description: res?.deleted_id
          ? `Utilizador com o nip ${res.deleted_id} apagado`
          : "Operação concluída",
      }),
      error: (err) => ({
        title: "Erro ao apagar utilizador",
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          "An error occurred",
      }),
    });

    try {
      await promise;
    } catch {
      // Error toast handled by toaster.promise
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
