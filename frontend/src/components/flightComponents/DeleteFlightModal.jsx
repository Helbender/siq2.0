import React, { Fragment } from "react";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../../Contexts/AuthContext";
import {
  Button,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { BiTrash } from "react-icons/bi";
import { FlightContext } from "../../Contexts/FlightsContext";
function DeleteFlightModal({ flight }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { token } = useContext(AuthContext);
  const { flights, setFlights } = useContext(FlightContext);
  const toast = useToast();
  const handleDeleteFlight = async (flight) => {
    try {
      const res = await axios.delete(`/api/flights/${flight.id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.data?.deleted_id) {
        console.log(`Flight is Deleted ${flight.id}`);
        toast({
          title: "Voo Apagado com Sucesso",
          description: `Airstask ${flight.airtask} às ${flight.ATD} de ${flight.date}.`,
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        // window.location.reload(f);
        setFlights(flights.filter((f) => f.id != flight.id));
        onClose();
        // setFilteredFlights(flights.filter((flight) => flight.id != id));
      }
    } catch (error) {
      if (error.response.status === 404) {
        toast({
          title: "Erro a apagar",
          description: `ID é ${flight.id}. Voo não encontrado.\nExperimente fazer refresh à página`,
          status: "error",
          duration: 5000,
          position: "bottom",
        });
      }
      console.log(error.response);
    }
  };

  return (
    <>
      <IconButton
        variant="ghost"
        colorScheme="red"
        size={"lg"}
        onClick={onOpen}
        icon={<BiTrash />}
      />
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{`Modelo ${flight.airtask} de ${flight.date} às ${flight.ATD}`}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{"Deseja mesmo apagar o modelo 1M"}</ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={() => handleDeleteFlight(flight)}
            >
              Sim
            </Button>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Não
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
export default DeleteFlightModal;
