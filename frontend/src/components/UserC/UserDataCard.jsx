import {
  Card,
  CardHeader,
  Flex,
  Circle,
  Heading,
  IconButton,
  useColorModeValue,
  CardBody,
  CardFooter,
  VStack,
  Spacer,
  useToast,
} from "@chakra-ui/react";
import CreateUserModal from "../UserC/CreateUserModal";
import StyledText from "../styledcomponents/StyledText";
import { FaMailBulk } from "react-icons/fa";
import { useSendEmail } from "../../Functions/useSendEmail";

function UserDataCard({ user }) {
  const toast = useToast();
  const sendEmail = useSendEmail();
  return (
    <Card bg={useColorModeValue("gray.200", "gray.700")} boxShadow={"xl"}>
      <CardHeader>
        <Flex gap={4}>
          <Flex flex={"1"} flexDirection={"row"} align="center" gap={"5"}>
            <Circle
              bg={user.position === "PC" ? "blue.500" : "green"}
              size="40px"
              boxShadow="dark-lg"
              pt={"1"}
            >
              {user.position}
            </Circle>
            <Heading size="sm">{`${user.rank} ${user.name}`}</Heading>
          </Flex>
        </Flex>
      </CardHeader>
      <CardBody>
        <VStack spacing={3} alignItems={"left"}>
          <StyledText query={"NIP:"} text={`NIP:  ${user.nip}`} />
          <StyledText query={"Email:"} text={`Email:  ${user.email}`} />
          <StyledText
            query={"Esquadra:"}
            text={`Esquadra:  ${user.squadron}`}
          />
          <StyledText
            query={"Admin:"}
            text={`Admin:  ${user.admin ? "Sim" : "Não"}`}
          />
        </VStack>
      </CardBody>
      <CardFooter>
        <Flex gap={5}>
          <Spacer />
          <CreateUserModal edit={true} user={user} />
          <IconButton
            icon={<FaMailBulk />}
            colorScheme="blue"
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
      </CardFooter>
    </Card>
  );
}

export default UserDataCard;
