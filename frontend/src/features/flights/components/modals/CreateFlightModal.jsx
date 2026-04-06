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
  useDisclosure,
} from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { FaPlus } from "react-icons/fa";

import { getTimeDiff } from "@/shared/utils/timeCalc";
import { toaster } from "@/shared/utils/toaster";
import { Field, Flex, Input, NativeSelect } from "@chakra-ui/react";
import { useUsersQuery } from "@features/users";
import { useAnomalyDescriptionsByPlane } from "../../hooks/useAnomalyDescriptionsByPlane";
import { useCreateFlight } from "../../hooks/useCreateFlight";
import { flightDefaults } from "../../mappers/flightDefaults";
import { PilotInput } from "../PilotInput";

export function CreateFlightModal({ flight, trigger }) {
  const isEdit = Boolean(flight);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { mutateAsync } = useCreateFlight();
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
    formState: { errors, isSubmitting },
  } = methods;

  // Register origin and destination with combined onChange handlers
  const originRegister = register("origin", {
    maxLength: {
      value: 4,
      message: "Máximo 4 caracteres",
    },
  });
  const destinationRegister = register("destination", {
    maxLength: {
      value: 4,
      message: "Máximo 4 caracteres",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "flight_pilots",
  });

  // Watch ATD and ATA to calculate ATE
  const ATD = useWatch({ control, name: "ATD" });
  const ATA = useWatch({ control, name: "ATA" });
  const tailNumber = useWatch({ control, name: "tailNumber" });
  const { data: anomalyDescriptions = [], isLoading: isLoadingAnomalies } =
    useAnomalyDescriptionsByPlane(tailNumber);

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
      if (flight) {
        const firstAnomaly = flight.anomalies?.[0];
        reset({
          ...flight,
          anomalyOption: firstAnomaly ?? "NO_ANOMALY",
          anomalyNewText: "",
        });
      } else {
        reset(flightDefaults);
      }
    }
  }, [isOpen, flight, reset]);

  // When editing, if current anomaly is not in the list, show "Add new" with that value
  const currentOption = methods.watch("anomalyOption");
  useEffect(() => {
    if (
      !isOpen ||
      !currentOption ||
      currentOption === "NO_ANOMALY" ||
      currentOption === "__NEW__" ||
      anomalyDescriptions.includes(currentOption)
    ) {
      return;
    }
    setValue("anomalyNewText", currentOption);
    setValue("anomalyOption", "__NEW__");
  }, [isOpen, anomalyDescriptions, currentOption, setValue]);

  const onSubmit = async (data) => {
    const anomalyOption = data.anomalyOption ?? "";
    const anomalyNewText = (data.anomalyNewText ?? "").trim().slice(0, 50);
    const anomalies =
      anomalyOption === "__NEW__"
        ? anomalyNewText
          ? [anomalyNewText]
          : []
        : anomalyOption && anomalyOption !== "NO_ANOMALY"
          ? [anomalyOption]
          : [];
    const payload = { ...data, anomalies };
    const promise = mutateAsync({
      id: flight?.id,
      payload,
    });

    toaster.promise(promise, {
      loading: {
        title: isEdit ? "A atualizar voo…" : "A registar voo…",
        description: "Por favor aguarde",
      },
      success: {
        title: isEdit ? "Voo atualizado" : "Voo criado",
        description: "Operação concluída com sucesso",
      },
      error: (err) => ({
        title: "Erro ao guardar voo",
        description:
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Algo correu mal",
      }),
    });

    try {
      await promise;
      onClose();
    } catch {
      // Error toast handled by toaster.promise
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
          <Button variant="success">Novo Voo</Button>
        </Dialog.Trigger>
      ) : trigger ? (
        <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      ) : null}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="bg.cardSubtle"
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header>
              <Dialog.Title>{isEdit ? "Editar voo" : "Criar voo"}</Dialog.Title>
            </Dialog.Header>

            <Dialog.CloseTrigger />

            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <Dialog.Body
                  display="flex"
                  flexDirection="column"
                  flex="1"
                  minH="0"
                >
                  <Stack flex="1" minH="0">
                    <Flex
                      gap={"5"}
                      direction={{ base: "column", md: "row" }}
                      alignItems="flex-start"
                      justifyContent="space-between"
                    >
                      <Flex gap={2} alignItems="flex-start">
                        <Field.Root invalid={!!errors.airtask}>
                          <Field.Label>Airtask</Field.Label>
                          <Input
                            placeholder="00A0000"
                            {...methods.register("airtask", {
                              required: "Airtask é obrigatório",
                              pattern: {
                                value: /^\d{2}[A-Za-z]\d{4}$/,
                                message: "Formato inválido. Ex: 00A0000",
                              },
                            })}
                          />
                          {errors.airtask && (
                            <Field.ErrorText>
                              {errors.airtask.message}
                            </Field.ErrorText>
                          )}
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Modalidade</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              {...methods.register("flightType")}
                              placeholder=""
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
                              placeholder=""
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

                      <Flex
                        gap={2}
                        direction={{ base: "column", md: "row" }}
                        alignItems="flex-start"
                      >
                        <Field.Root invalid={!!errors.date}>
                          <Field.Label>Data</Field.Label>
                          <Input
                            type="date"
                            {...methods.register("date", {
                              required: "Data é obrigatória",
                            })}
                          />
                          {errors.date && (
                            <Field.ErrorText>
                              {errors.date.message}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root invalid={!!errors.ATD}>
                          <Field.Label>ATD</Field.Label>
                          <Input
                            type="time"
                            {...methods.register("ATD", {
                              required: "ATD é obrigatório",
                            })}
                          />
                          {errors.ATD && (
                            <Field.ErrorText>
                              {errors.ATD.message}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>ATA</Field.Label>
                          <Input type="time" {...methods.register("ATA")} />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>TOTAL</Field.Label>
                          <Input
                            type="time"
                            {...methods.register("ATE")}
                            readOnly
                            variant="readOnly"
                          />
                        </Field.Root>
                      </Flex>
                      <Flex gap={2} alignItems="flex-start">
                        <Field.Root>
                          <Field.Label>Origem</Field.Label>
                          <Input
                            {...originRegister}
                            placeholder="XXXX"
                            maxLength={4}
                            textAlign="center"
                            onChange={(e) => {
                              const upperValue = e.target.value.toUpperCase();
                              e.target.value = upperValue;
                              originRegister.onChange(e);
                              setValue("origin", upperValue, {
                                shouldValidate: true,
                              });
                            }}
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>Destino</Field.Label>
                          <Input
                            {...destinationRegister}
                            placeholder="XXXX"
                            maxLength={4}
                            textAlign="center"
                            onChange={(e) => {
                              const upperValue = e.target.value.toUpperCase();
                              e.target.value = upperValue;
                              destinationRegister.onChange(e);
                              setValue("destination", upperValue, {
                                shouldValidate: true,
                              });
                            }}
                          />
                        </Field.Root>
                      </Flex>
                    </Flex>

                    <Flex
                      mt="5"
                      gap={"5"}
                      direction={{ base: "column", md: "row" }}
                    >
                      <Flex
                        gap={2}
                        direction={{ base: "column", md: "row" }}
                        alignItems="flex-start"
                      >
                        <Field.Root invalid={!!errors.tailNumber}>
                          <Field.Label>Nº Cauda</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              {...methods.register("tailNumber", {
                                required: "Nº Cauda é obrigatório",
                                setValueAs: (value) =>
                                  value ? parseInt(value) : 0,
                              })}
                              placeholder=""
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
                          {errors.tailNumber && (
                            <Field.ErrorText>
                              {errors.tailNumber.message}
                            </Field.ErrorText>
                          )}
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Aterragens</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("totalLandings", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Nº Tripulantes</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("numberOfCrew", {
                              valueAsNumber: true,
                            })}
                            readOnly
                            variant="readOnly"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>PAX</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("passengers", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                      </Flex>
                      <Spacer />
                      <Flex
                        gap={2}
                        direction={{ base: "column", md: "row" }}
                        alignItems="flex-start"
                      >
                        <Field.Root>
                          <Field.Label>Doentes</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("doe", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>Carga</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("cargo", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>
                        <Field.Root>
                          <Field.Label>ORM</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("orm", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="0"
                            textAlign="center"
                          />
                        </Field.Root>

                        <Field.Root>
                          <Field.Label>FUEL</Field.Label>
                          <Input
                            type="number"
                            {...methods.register("fuel", {
                              valueAsNumber: true,
                              min: { value: 0, message: "Mínimo 0" },
                            })}
                            placeholder="Kg"
                            textAlign="right"
                          />
                        </Field.Root>
                      </Flex>
                    </Flex>

                    <Separator
                      borderWidth="1px"
                      borderColor="teal.400"
                      mb={2}
                      mt={5}
                      mx={2}
                    />
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
                      onClick={() =>
                        append({ name: "", VIR: "", VN: "", CON: "" })
                      }
                      variant="solid"
                      leftIcon={<FaPlus />}
                      type="button"
                    >
                      Adicionar Tripulante
                    </Button>

                    <Spacer />

                    <Box>
                      <Field.Root invalid={!!errors.anomalyOption}>
                        <Field.Label>Anomalias</Field.Label>
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            {...methods.register("anomalyOption", {
                              required:
                                "Selecione uma opção (ex.: Nenhuma anomalia a reportar)",
                            })}
                            placeholder={
                              tailNumber
                                ? isLoadingAnomalies
                                  ? "A carregar…"
                                  : "Selecionar"
                                : "Selecione o Nº Cauda primeiro"
                            }
                            disabled={!tailNumber || isLoadingAnomalies}
                          >
                            <option value="NO_ANOMALY">
                              Nenhuma anomalia a reportar
                            </option>
                            {anomalyDescriptions.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                            <option value="__NEW__">Adicionar nova…</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        {errors.anomalyOption && (
                          <Field.ErrorText>
                            {errors.anomalyOption.message}
                          </Field.ErrorText>
                        )}
                        {methods.watch("anomalyOption") === "__NEW__" && (
                          <Input
                            mt={2}
                            placeholder="Descrição da anomalia (máx. 50 caracteres)"
                            maxLength={50}
                            {...methods.register("anomalyNewText", {
                              maxLength: 50,
                            })}
                          />
                        )}
                        {methods.watch("anomalyOption") === "__NEW__" && (
                          <Field.HelperText>
                            {(methods.watch("anomalyNewText") ?? "").length}/50
                          </Field.HelperText>
                        )}
                      </Field.Root>
                    </Box>
                  </Stack>
                </Dialog.Body>
              </form>

              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="subtle" colorPalette="gray">
                    Cancelar
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  onClick={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  colorPalette="blue"
                  type="button"
                  disabled={isSubmitting}
                >
                  {isEdit ? "Editar voo" : "Registar voo"}
                </Button>
              </Dialog.Footer>
            </FormProvider>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
