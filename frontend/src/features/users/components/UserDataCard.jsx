import { StyledText } from "@/common/components/StyledText";
import { useSendEmail } from "@/utils/useSendEmail";
import { useToast } from "@/utils/useToast";
import {
  Card,
  Circle,
  Flex,
  Heading,
  IconButton,
  Spacer,
  VStack
} from "@chakra-ui/react";
import { FaMailBulk } from "react-icons/fa";
import { CreateUserModal } from "./CreateUserModal";
import { InsertInitQual } from "./InsertInitQual";

const colors = {
  PI: "red.500",
  PC: "blue.900",
  P: "blue.500",
  CP: "blue.300",
  OC: "green",
  OCI: "red.500",
  Default: "violet.500",
};

export function UserDataCard({ user }) {
  const toast = useToast();
  const sendEmail = useSendEmail();
  return (
    <Card.Root bg="bg.cardSubtle" boxShadow={"xl"}>
      <Card.Header>
        <Flex gap={4}>
          <Flex flex={"1"} flexDirection={"row"} align="center" gap={"5"}>
            <Circle
              bg={colors[user.position] || colors["Default"]}
              size="40px"
              boxShadow="dark-lg"
            >
              {user.position}
            </Circle>
            <Heading size="md">{`${user.rank} ${user.name}`}</Heading>
          </Flex>
        </Flex>
      </Card.Header>
      <Card.Body>
        <VStack spacing={3} alignItems={"left"}>
          <StyledText query={"NIP:"} text={`NIP:  ${user.nip}`} />
          <StyledText query={"Email:"} text={`Email:  ${user.email}`} />
          <StyledText
            query={"Esquadra:"}
            text={`Esquadra:  ${user.squadron}`}
          />
          <StyledText
            query={"Status:"}
            text={`Status:  ${user.status || "Presente"}`}
          />
          <StyledText
            query={"Admin:"}
            text={`Admin:  ${user.admin ? "Sim" : "Não"}`}
          />
        </VStack>
      </Card.Body>
      <Card.Footer>
        <Flex gap={5}>
          <Spacer />
          <CreateUserModal edit={true} user={user} />
          <InsertInitQual user={user} />

          <IconButton
            icon={<FaMailBulk />}
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
          />
          <CreateUserModal isDelete={true} user={user} />
        </Flex>
      </Card.Footer>
    </Card.Root>
  );
}
