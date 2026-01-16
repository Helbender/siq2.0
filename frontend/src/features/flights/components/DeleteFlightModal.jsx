import React from "react";
import { useContext } from "react";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import {
  Button,
  IconButton,
  useDisclosure,
  Dialog,
  Portal,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useToast } from "@/utils/useToast";
import { BiTrash } from "react-icons/bi";
import { FlightContext } from "../contexts/FlightsContext";
import { api, apiAuth } from "@/utils/api";

export function DeleteFlightModal({ flight }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { token } = useContext(AuthContext);
  const { flights, setFlights } = useContext(FlightContext);
  const toast = useToast();
  const handleDeleteFlight = async (flight) => {
    try {
      toast({
        title: "A apagar o voo",
        description: "Em processo.",
        status: "loading",
        duration: 10000,
        isClosable: true,
        position: "bottom",
      });
      const res = await apiAuth.delete(`/flights/${flight.id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.data?.deleted_id) {
        console.log(`Flight is Deleted ${flight.id}`);
        toast.closeAll();
        toast({
          title: "Voo Apagado com Sucesso",
          description: `Airstask ${flight.airtask} às ${flight.ATD} de ${flight.date}.`,
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        setFlights(flights.filter((f) => f.id != flight.id));
        onClose();
      }
    } catch (error) {
      console.log(error.response);
      if (error.response.status === 404) {
        toast.closeAll();

        toast({
          title: "Erro a apagar",
          description: `ID é ${flight.id}. Voo não encontrado.\nExperimente fazer refresh à página`,
          status: "error",
          duration: 5000,
          position: "bottom",
        });
      }
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
      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>{`Modelo ${flight.airtask} de ${flight.date} às ${flight.ATD}`}</Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>
              <Dialog.Body>{"Deseja mesmo apagar o modelo 1M"}</Dialog.Body>
              <Dialog.Footer>
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
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
