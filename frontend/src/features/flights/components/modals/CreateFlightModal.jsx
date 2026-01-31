import {
  Box,
  Button,
  Dialog,
  Grid,
  GridItem,
  Portal,
  Separator,
  Spacer,
  Stack,
  useDisclosure
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { FaPlus } from "react-icons/fa";

import { useUsersQuery } from "@/features/users/queries/useUsersQuery";
import { getTimeDiff } from "@/utils/timeCalc";
import { toaster } from "@/utils/toaster";
import { Field, Flex, Input, NativeSelect } from "@chakra-ui/react";
import { useCreateFlight } from "../../hooks/useCreateFlight";
import { flightDefaults } from "../../mappers/flightDefaults";
import { PilotInput } from "../PilotInput";

export function CreateFlightModal({ flight, trigger }) {
  const isEdit = Boolean(flight);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync, isLoading } = useCreateFlight();
  const { data: pilotos = [] } = useUsersQuery();

  const methods = useForm({
    defaultValues: flight ?? flightDefaults,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    register,
  } = methods;

  // Register origin and destination with combined onChange handlers
  const originRegister = register("origin", {
    maxLength: {
      value: 4,
      message: "Máximo 4 caracteres"
    }
  });
  const destinationRegister = register("destination", {
    maxLength: {
      value: 4,
      message: "Máximo 4 caracteres"
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "flight_pilots",
  });

  // Watch ATD and ATA to calculate ATE
  const ATD = useWatch({ control, name: "ATD" });
  const ATA = useWatch({ control, name: "ATA" });

  // Ref for horizontal scrolling
  const scrollRef = useRef(null);

  // Handle wheel event to enable horizontal scrolling with vertical wheel
  const handleWheel = (e) => {
    if (scrollRef.current && !e.shiftKey) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScrollHorizontally = scrollWidth > clientWidth;
      
      if (canScrollHorizontally) {
        e.preventDefault();
        scrollRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  useEffect(() => {
    if (ATD && ATA) {
      const ATE = getTimeDiff(ATD, ATA);
      setValue("ATE", ATE);
    } else {
      setValue("ATE", "");
    }
  }, [ATD, ATA, setValue]);

  // Update numberOfCrew when flight_pilots changes
  useEffect(() => {
    setValue("numberOfCrew", fields.length);
  }, [fields.length, setValue]);

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

      toaster.create({
        title: isEdit ? "Voo atualizado" : "Voo criado",
        type: "success",
      });

      onClose();
    } catch {
      toaster.create({
        title: "Erro ao guardar voo",
        type: "error",
      });
    }
  };

  return (
      <Dialog.Root 
        open={isOpen} 
        onOpenChange={({ open }) => {
          if (open) {
            onOpen();
          } else {
            reset(flight ?? flightDefaults);
            onClose();
          }
        }}
        size="full"
        preventScroll
      >
        {!isEdit ? (
          <Dialog.Trigger asChild>
            <Button colorPalette="green">Novo Voo</Button>
          </Dialog.Trigger>
        ) : trigger ? (
          <Dialog.Trigger asChild>
            {trigger}
          </Dialog.Trigger>
        ) : null}
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="bg.surface">
              <Dialog.Header>
                {isEdit ? "Editar voo" : "Criar voo"}
              </Dialog.Header>

              <Dialog.CloseTrigger />


              <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Dialog.Body>
                    <Stack>
                      <Flex gap={"5"}
                      direction={{ base: "column", lg: "row" }}
                      alignItems="center"
                      justifyContent="space-between">
<Flex gap={2}>
                          <Field.Root>
                            <Field.Label>Airtask</Field.Label>
                            <Input 
                              bg="bg.canvas"
                              border="1px solid"
                              borderColor="border.subtle"
                              _placeholder={{ color: "text.muted" }}
                              placeholder="00A0000"
                               {...methods.register("airtask", {
                          required: "Campo obrigatório",
                          pattern: {
                            value: /^\d{2}[A-Za-z]\d{4}$/,
                            message: "Formato inválido. Ex: 00A0000",
                          },
                        })}
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Modalidade</Field.Label>
                            <NativeSelect.Root>
                              <NativeSelect.Field 
                                {...methods.register("flightType")}
                                bg="bg.canvas"
                                border="1px solid"
                                borderColor="border.subtle"
                                placeholder=""
                                _placeholder={{ color: "text.muted" }}
                              >
                                  <option value="ADEM">ADEM</option>
                        <option value="ADROP">ADROP</option>
                        <option value="AIREV">AIREV</option>
                        <option value="ALSO">ALSO</option>
                        <option value="AMOV">AMOV</option>
                        <option value="AQUAL">AQUAL</option>
                        <option value="ITAS">ITAS</option>
                        <option value="MNT">MNT</option>
                        <option value="PHOTO">PHOTO</option>
                        <option value="RECCE">RECCE</option>
                        <option value="SAO">SAO</option>
                        <option value="SAR">SAR</option>
                        <option value="SMOV">SMOV</option>
                        <option value="TALD">TALD</option>
                        <option value="VIPLF">VIPLF</option>
                        <option value="VIS">VIS</option>
                        <option value="ISR">ISR</option>
                        <option value="TRCA">TRCA</option>
                        <option value="SIM">SIM</option>
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Ação</Field.Label>
                            <NativeSelect.Root>
                              <NativeSelect.Field 
                                {...methods.register("flightAction")}
                                bg="bg.canvas"
                                border="1px solid"
                                borderColor="border.subtle"
                                placeholder=""
                                _placeholder={{ color: "text.muted" }}
                              >
                                <option value="OPER">OPER</option>
                                <option value="MNT">MNT</option>
                                <option value="TRM">TRM</option>
                                <option value="TRQ">TRQ</option>
                                <option value="TRU">TRU</option>
                                <option value="INST">INST</option>
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
 
</Flex>

                      <Flex gap={2} direction={{ base: "column", lg: "row" }}>
                        <Field.Root>
                          <Field.Label>Data</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="date"
                            {...methods.register("date")}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>ATD</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="time"
                            {...methods.register("ATD")}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>ATA</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="time"
                            {...methods.register("ATA")}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>TOTAL</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="time"
                            {...methods.register("ATE")}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            readOnly
                            bg="bg.muted"
                          />
                        </Field.Root>
                      </Flex>
                      <Flex gap={2}>
                        <Field.Root>
                          <Field.Label>Origem</Field.Label>
                          <Input
                            {...originRegister}
                            bg="bg.canvas"
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="XXXX"
                            maxLength={4}
                            textAlign="center"
                            onChange={(e) => {
                              const upperValue = e.target.value.toUpperCase();
                              e.target.value = upperValue;
                              originRegister.onChange(e);
                              setValue("origin", upperValue, { shouldValidate: true });
                            }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Destino</Field.Label>
                          <Input
                            {...destinationRegister}
                            bg="bg.canvas"
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="XXXX"
                            maxLength={4}
                            textAlign="center"
                            onChange={(e) => {
                              const upperValue = e.target.value.toUpperCase();
                              e.target.value = upperValue;
                              destinationRegister.onChange(e);
                              setValue("destination", upperValue, { shouldValidate: true });
                            }}
                          />
                        </Field.Root>
                      </Flex>

                      </Flex>
         
<Flex
                  mt="5"
                  gap={"5"}
                  direction={{ base: "column", lg: "row" }}
                >
                        <Flex gap={2}
                        direction={{ base: "column", lg: "row" }}
                        >
                          <Field.Root>
                            <Field.Label>Nº Cauda</Field.Label>
                            <NativeSelect.Root>
                              <NativeSelect.Field
                                {...methods.register("tailNumber", {
                                  setValueAs: (value) => value ? parseInt(value) : 0
                                })}
                                bg="bg.canvas"
                                border="1px solid"
                                borderColor="border.subtle"
                                placeholder=""
                                _placeholder={{ color: "text.muted" }}
                              >
                                <option value="16701">16701</option>
                                <option value="16702">16702</option>
                                <option value="16703">16703</option>
                                <option value="16704">16704</option>
                                <option value="16705">16705</option>
                                <option value="16706">16706</option>
                                <option value="16707">16707</option>
                                <option value="16708">16708</option>
                                <option value="16709">16709</option>
                                <option value="16710">16710</option>
                                <option value="16711">16711</option>
                                <option value="16712">16712</option>
                              </NativeSelect.Field>
                              <NativeSelect.Indicator />
                            </NativeSelect.Root>
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Aterragens</Field.Label>
                            <Input
                              bg="bg.canvas"
                              type="number"
                              {...methods.register("totalLandings", {
                                valueAsNumber: true,
                                min: { value: 0, message: "Mínimo 0" }
                              })}
                              border="1px solid"
                              borderColor="border.subtle"
                              _placeholder={{ color: "text.muted" }}
                              placeholder="0"
                              textAlign="center"
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>Nº Tripulantes</Field.Label>
                            <Input
                              bg="bg.canvas"
                                  type="number"
                              {...methods.register("numberOfCrew", {
                                valueAsNumber: true
                              })}
                              border="1px solid"
                              borderColor="border.subtle"
                              _placeholder={{ color: "text.muted" }}
                              readOnly
                              bg="bg.muted"
                              textAlign="center"
                            />
                          </Field.Root>
                          <Field.Root>
                            <Field.Label>PAX</Field.Label>
                            <Input
                              bg="bg.canvas"
                              type="number"
                              {...methods.register("passengers", {
                                valueAsNumber: true,
                                min: { value: 0, message: "Mínimo 0" }
                              })}
                              border="1px solid"
                              borderColor="border.subtle"
                              _placeholder={{ color: "text.muted" }}
                              placeholder="0"
                              textAlign="center"
                            />
                          </Field.Root>
                        </Flex>
                        <Spacer />
                  <Flex gap={2}
                  direction={{ base: "column", lg: "row" }}
                  >
                        <Field.Root>
                          <Field.Label>Doentes</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="number"
                            {...methods.register("doe", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" }
                            })}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Carga</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="number"
                            {...methods.register("cargo", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" }
                            })}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>ORM</Field.Label>
                          <Input
                            bg="bg.canvas"
                            type="number"
                            {...methods.register("orm", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" }
                            })}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>FUEL</Field.Label>
                          <Input
                            bg="bg.canvas"
                              type="number"
                            {...methods.register("fuel", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" }
                            })}
                            border="1px solid"
                            borderColor="border.subtle"
                            _placeholder={{ color: "text.muted" }}
                            placeholder="Kg"
                            textAlign="right"
                          />
                        </Field.Root>
                  </Flex>
</Flex>

        <Separator borderWidth="1px" borderColor="teal.400" mb={2} mx={2}/>

                      <Box 
                      
                  ref={scrollRef}
                  overflowX="auto"
                  paddingBottom={5}
                  onWheel={handleWheel}
                  >

                        <Grid
                    minW="max-content"
                    // maxWidth={"1000px"}
                    templateColumns="repeat(17, auto)"
                    rowGap={2}
                    columnGap={1}
                  >
                     <GridItem textAlign={"center"}>Posição</GridItem>
                    <GridItem textAlign={"center"}>Nome</GridItem>
                    <GridItem w={"80px"} textAlign={"center"}>
                      NIP
                    </GridItem>
                    <GridItem w={"50px"} textAlign={"center"} ml={2}>
                      VIR
                    </GridItem>
                    <GridItem w={"50px"} textAlign={"center"}>
                      VN
                          </GridItem>
                    <GridItem w={"50px"} textAlign={"center"}>
                      CON
                    </GridItem>
                    <GridItem w={"50px"} textAlign={"center"}>
                      ATR
                    </GridItem>
                    <GridItem w={"50px"} textAlign={"center"}>
                      ATN
                    </GridItem>
                    <GridItem w={"80px"} textAlign={"center"}>
                      Precisão
                    </GridItem>
                    <GridItem w={"80px"} textAlign={"center"}>
                      Não Precisão
                    </GridItem>
                      <GridItem textAlign={"center"} colSpan={6}>
                      Qualificações
                    </GridItem>
                    <GridItem m="auto" />
                          {fields.map((field, index) => (
                            <PilotInput
                              key={field.id}
                              index={index}
                              pilotos={pilotos}
                              member={field}
                              remove={remove}
                            />
                          ))}
                        </Grid>
                      </Box>

                      <Button
                      alignSelf="center"
                        colorPalette="green"
                        size="sm"
                        onClick={() => append({ name: "" })}
                        variant="solid"
                        leftIcon={<FaPlus />}
                        type="button"
                      >
                        Adicionar Tripulante
                      </Button>
                    </Stack>
                  </Dialog.Body>
                </form>

                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="ghost">
                      Cancelar
                    </Button>
                  </Dialog.ActionTrigger>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    loading={isLoading}
                    colorPalette="blue"
                    type="button"
                  >
                    Registar Voo
                  </Button>
                </Dialog.Footer>
              </FormProvider>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
  );
}
