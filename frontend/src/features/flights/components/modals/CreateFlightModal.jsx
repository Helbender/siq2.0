import {
  Button,
  Dialog,
  Field,
  Grid,
  GridItem,
  IconButton,
  Input,
  Portal,
  Select,
  Separator,
  Stack,
  useDisclosure
} from "@chakra-ui/react";
import { useEffect } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { BiEdit } from "react-icons/bi";
import { FaPlus } from "react-icons/fa";
import { HiX } from "react-icons/hi";

import { useToast } from "@/utils/useToast";
import { useCreateFlight } from "../../hooks/useCreateFlight";
import { flightDefaults } from "../../mappers/flightDefaults";
import { PilotInput } from "../pilots/PilotInput";

export function CreateFlightModal({ flight }) {
  const isEdit = Boolean(flight);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync, isLoading } = useCreateFlight();
  const toast = useToast();

  const methods = useForm({
    defaultValues: flight ?? flightDefaults,
  });

  const {
    control,
    handleSubmit,
    reset,
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "flight_pilots",
  });

  useEffect(() => {
    if (isOpen) {
      reset(flight ?? flightDefaults);
    }
  }, [isOpen, flight, reset]);

  const onSubmit = async (data) => {
    try {
      await mutateAsync({
        id: flight?.id,
        payload: data,
      });

      toast({
        title: isEdit ? "Voo atualizado" : "Voo criado",
        status: "success",
      });

      onClose();
    } catch {
      toast({
        title: "Erro ao guardar voo",
        status: "error",
      });
    }
  };

  return (
    <>
      <IconButton
        onClick={onOpen}
        icon={isEdit ? <BiEdit /> : <FaPlus />}
        aria-label="Criar voo"
      />

      <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="900px">
              <Dialog.Header>
                {isEdit ? "Editar voo" : "Criar voo"}
              </Dialog.Header>

              <Dialog.CloseTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <HiX />
                </IconButton>
              </Dialog.CloseTrigger>

              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Dialog.Body>
                    <Stack spacing={4}>
                      <Grid templateColumns="repeat(4, 1fr)" gap={4}>
                        <GridItem colSpan={2}>
                          <Field.Root label="Airtask">
                            <Input {...methods.register("airtask")} />
                          </Field.Root>
                        </GridItem>

                        <GridItem>
                          <Field.Root label="Tipo">
                            <Select {...methods.register("flightType")}>
                              <option value="OP">OP</option>
                              <option value="TRG">TRG</option>
                            </Select>
                          </Field.Root>
                        </GridItem>

                        <GridItem>
                          <Field.Root label="Ação">
                            <Select {...methods.register("flightAction")}>
                              <option value="REAL">REAL</option>
                              <option value="SIM">SIM</option>
                            </Select>
                          </Field.Root>
                        </GridItem>
                      </Grid>

                      <Separator />

                      {fields.map((field, index) => (
                        <PilotInput
                          key={field.id}
                          index={index}
                          member={field}
                          remove={remove}
                        />
                      ))}

                      <Button
                        onClick={() => append({ name: "" })}
                        variant="outline"
                      >
                        Adicionar piloto
                      </Button>
                    </Stack>
                  </Dialog.Body>

                  <Dialog.Footer>
                    <Button variant="ghost" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                    >
                      Guardar
                    </Button>
                  </Dialog.Footer>
                </form>
              </FormProvider>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
