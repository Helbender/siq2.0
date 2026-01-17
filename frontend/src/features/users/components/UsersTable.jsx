import { useSendEmail } from "@/utils/useSendEmail";
import { useToast } from "@/utils/useToast";
import {
  HStack,
  IconButton,
  Table,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { FaEdit } from "react-icons/fa";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";
import { IoCheckmarkCircleSharp, IoCloseCircleSharp } from "react-icons/io5";

export function UsersTable({ users, onEdit, onDelete }) {
  const sendEmail = useSendEmail();
  const toast = useToast();
  return (
    <Table.Root mt={4} overflowX="auto" variant="simple"  >
      <Table.Header border="none" >
        <Table.Row fontWeight="bold" fontSize="lg" bg={"teal.500"} border="none">
          <Table.ColumnHeader color="black">NIP</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Nome</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Posto</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Função</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Tipo</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Status</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Admin</Table.ColumnHeader>
          <Table.ColumnHeader color="black">Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {users.map((user, index) => (
          <Table.Row key={user.nip} bg={index % 2 === 0 ? "" : "blackAlpha.400"}>
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
              {user.admin ? (
                <IoCheckmarkCircleSharp size={"30px"} color="green" />
              ) : (
                <IoCloseCircleSharp size={"30px"} color="red" />
              )}
            </Table.Cell>
            <Table.Cell>
              <HStack spacing={2} align="center">
                {/* <IconButton
                  colorPalette="blue"
                  onClick={() => {
                    toast({
                      title: "Sending Email",
                      description: "Wait while we send the Email",
                      status: "info",
                      duration: 5000,
                      isClosable: true,
                      position: "top",
                    });
                    sendEmail(user.email, `/api/recover/${user.email}`);
                  }}
                  aria-label="Email User"
                >
                  <FaMailBulk />
                </IconButton> */}
                <IconButton
                  colorPalette="yellow"
                  onClick={() => onEdit(user)}
                  aria-label="Edit User"
                >
                  <FaEdit />
                </IconButton>
                {/* <InsertInitQual user={user} /> */}
                <IconButton
                  colorPalette="red"
                  onClick={() => onDelete(user)}
                  aria-label="Delete User"
                >
                  <BiTrash />
                </IconButton>
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
