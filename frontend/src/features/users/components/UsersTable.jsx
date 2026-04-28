import { canModifyUser, getRoleName } from "@/shared/roles";
import { HStack, IconButton, Table } from "@chakra-ui/react";
import { useAuth } from "@features/auth";
import { BiTrash } from "react-icons/bi";
import { FaEdit } from "react-icons/fa";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";

export function UsersTable({ users, onEdit, onDelete }) {
  const { user: currentUser } = useAuth();

  const currentUserRoleLevel =
    currentUser?.roleLevel || currentUser?.role?.level;
  const currentUserNip = currentUser?.nip;
  return (
    <Table.Root mt={4} overflowX="auto">
      <Table.Header border="none">
        <Table.Row>
          <Table.ColumnHeader>NIP</Table.ColumnHeader>
          <Table.ColumnHeader>Nome</Table.ColumnHeader>
          <Table.ColumnHeader>Posto</Table.ColumnHeader>
          <Table.ColumnHeader>Função</Table.ColumnHeader>
          <Table.ColumnHeader>Tipo</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Role</Table.ColumnHeader>
          <Table.ColumnHeader>Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {users.map((user, index) => (
          <Table.Row
            key={user.nip}
            // bg={index % 2 === 0 ? "" : "blackAlpha.400"}
          >
            <Table.Cell>{user.nip}</Table.Cell>
            <Table.Cell>{user.name}</Table.Cell>
            <Table.Cell>{user.rank}</Table.Cell>
            <Table.Cell>{user.position}</Table.Cell>
            <Table.Cell>{user.tipo}</Table.Cell>
            <Table.Cell>
              {user.status === "Presente" ? (
                <IoIosCheckmark size={"30px"} color="green" />
              ) : (
                <IoIosClose size={"30px"} color="red" />
              )}
            </Table.Cell>
            <Table.Cell>
              {getRoleName(user.roleLevel || user.role?.level)}
            </Table.Cell>
            <Table.Cell>
              <HStack gap={2} align="center">
                {canModifyUser(
                  currentUserRoleLevel,
                  user.roleLevel || user.role?.level,
                  currentUserNip,
                  user.nip,
                ) ? (
                  <>
                    <IconButton
                      variant={"edit"}
                      onClick={() => onEdit(user)}
                      aria-label="Edit User"
                    >
                      <FaEdit />
                    </IconButton>
                    {/* <InsertInitQual user={user} /> */}
                    <IconButton
                      variant={"danger"}
                      onClick={() => onDelete(user)}
                      aria-label="Delete User"
                    >
                      <BiTrash />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton
                      colorPalette="yellow"
                      disabled
                      aria-label="Edit User (disabled)"
                    >
                      <FaEdit />
                    </IconButton>
                    <IconButton
                      colorPalette="red"
                      disabled
                      aria-label="Delete User (disabled)"
                    >
                      <BiTrash />
                    </IconButton>
                  </>
                )}
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
