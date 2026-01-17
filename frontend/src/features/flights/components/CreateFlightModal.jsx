import {
  Button,
  useDisclosure,
  Flex,
  Input,
  Stack,
  GridItem,
  Grid,
  Separator,
  Select,
  Box,
  Center,
  IconButton,
  Dialog,
  Portal,
  Field,
} from "@chakra-ui/react";
import { HiX } from "react-icons/hi";
import { useContext, useRef, useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import { PilotInput } from "./PilotInput";
import { FlightContext } from "../contexts/FlightsContext";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { useUsersQuery } from "@/features/users/hooks/useUsersQuery";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/utils/useToast";
import { http } from "@/api/http";
import { getTimeDiff } from "@/utils/timeCalc";
import { BiEdit } from "react-icons/bi";

const today = new Date();

// Componente
export function CreateFlightModal({ flight }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setFlights } = useContext(FlightContext);
  const { token, removeToken } = useContext(AuthContext);
  const { data: users = [] } = useUsersQuery();
  const scrollRef = useRef(null);
  const flightRef = useRef(flight); // Store initial flight reference
  const navigate = useNavigate();
  const toast = useToast();

  // Update flightRef when modal opens, so it doesn't change during editing
  useEffect(() => {
    if (isOpen) {
      flightRef.current = flight;
    }
  }, [isOpen, flight]);

  const defaultFlightData = flight ?? {
    airtask: "",
    flightType: "",
    flightAction: "",
    date: today.toISOString().substring(0, 10),
    origin: "",
    destination: "",
    ATD: "",
    ATA: "",
    ATE: "",
    tailNumber: 0,
    totalLandings: 0,
    passengers: 0,
    doe: 0,
    cargo: 0,
    orm: 0,
    fuel: 0,
    numberOfCrew: 1,
    activationFirst: "__:__",
    activationLast: "__:__",
    readyAC: "__:__",
    medArrival: "__:__",
    flight_pilots: [{ name: "" }],
  };
  const flightdata = flight ?? defaultFlightData;
  const methods = useForm({
    defaultValues: flightdata,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "flight_pilots",
  });

  const handleWheel = (e) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // Usar `watch` para monitorizar os campos de entrada
  const ATD = watch("ATD");
  const ATA = watch("ATA");
  const flight_pilots = watch("flight_pilots") || [];
  const AIRTASK = watch("airtask");
  const ORIGIN = watch("origin");
  const DESTINATION = watch("destination");

  // Handle creating new flight from existing form data
  const handleCreateNewFlight = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const formData = methods.getValues();

    // Ensure flight_pilots data is properly formatted
    if (formData.flight_pilots && formData.flight_pilots.length > 0) {
      formData.flight_pilots = formData.flight_pilots.map((pilot) => ({
        ...pilot,
        // Ensure required fields have default values
        ATR: pilot.ATR || null,
        ATN: pilot.ATN || null,
        precapp: pilot.precapp || null,
        nprecapp: pilot.nprecapp || null,
        // Ensure qualification fields are properly set
        QUAL1: pilot.QUAL1 ? String(pilot.QUAL1) : "",
        QUAL2: pilot.QUAL2 ? String(pilot.QUAL2) : "",
        QUAL3: pilot.QUAL3 ? String(pilot.QUAL3) : "",
        QUAL4: pilot.QUAL4 ? String(pilot.QUAL4) : "",
        QUAL5: pilot.QUAL5 ? String(pilot.QUAL5) : "",
        QUAL6: pilot.QUAL6 ? String(pilot.QUAL6) : "",
      }));
    }

    console.log("Creating new flight with data:", formData);
    await handleCreateFlight(formData, true);
  };
  const handleEditFlight = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const formData = methods.getValues();

    // Use flightRef.current to get stable flight reference even after state updates
    const currentFlight = flightRef.current || flight;
    if (currentFlight && currentFlight.id) {
      formData.id = currentFlight.id;
    }
    console.log("Editingflight with data:", formData);
    await handleCreateFlight(formData, false);
  };
  // Create Flight Endpoint
  const handleCreateFlight = async (data, isNewFlight = false) => {
    toast({
      title: isNewFlight ? "A adicionar voo" : "A editar voo",
      description: "Em processo.",
      status: "loading",
      duration: 10000,
      isClosable: true,
      position: "bottom",
    });
    try {
      let res;
      // Check if we're editing an existing flight (has ID and not creating new)
      // Use flightRef.current for stable reference even after state updates
      const currentFlight = flightRef.current || flight;
      if ((currentFlight?.id || data?.id) && !isNewFlight) {
        const flightId = data?.id || currentFlight?.id;
        res = await http.patch(`/flights/${flightId}`, data);
      } else {
        res = await http.post("/flights", data);
      }
      // Response 201 is for creating new flight
      console.log(res);
      if (res.status === 201) {
        toast.closeAll();
        const message = isNewFlight
          ? "Novo voo criado com sucesso"
          : "Voo adicionado com sucesso";
        toast({
          title: "Sucesso",
          description: `${message}. ID: ${res.data?.message}`,
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        data.id = res.data?.message;
        setFlights((prev) => [...prev, data]);
        // If creating new flight from edit mode, reset form to create mode
        if (isNewFlight && flightRef.current) {
          reset(defaultFlightData);
        }
      }
      //Response 204 is for editing flight
      if (res.status === 204) {
        toast.closeAll();
        toast({
          title: "Sucesso",
          description: "Voo atualizado com sucesso.",
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        setFlights((prevFlights) =>
          prevFlights.map((flight) =>
            flight.id === data.id ? { ...flight, ...data } : flight,
          ),
        );
      }
    } catch (error) {
      if (error.response.status === 401) {
        console.log("Removing Token");
        removeToken();
        navigate("/");
      }
      toast.closeAll();

      toast({
        title: `Erro com o código ${error.response.status}`,
        description: error.response.data.message,
        status: "error",
        duration: 10000,
        position: "bottom",
      });
      console.log(error.response.data.message);
    }
  };

  // Atualiza o número de tripulantes automaticamente
  useEffect(() => {
    setValue("numberOfCrew", flight_pilots.length);
  }, [flight_pilots.length]);

  // Atualiza ATE automaticamente
  useEffect(() => {
    if (ATD && ATA) {
      const ATE = getTimeDiff(ATD, ATA);
      setValue("ATE", ATE);
    }
  }, [ATD, ATA]);
  useEffect(() => {
    setValue("airtask", AIRTASK.toUpperCase());
  }, [AIRTASK]);
  useEffect(() => {
    setValue("origin", ORIGIN.toUpperCase());
  }, [ORIGIN]);
  useEffect(() => {
    setValue("destination", DESTINATION.toUpperCase());
  }, [DESTINATION]);

  // Reset form when modal opens with flight data
  // Use flightRef.current to avoid re-triggering when flight prop changes during edit
  useEffect(() => {
    if (isOpen && flightRef.current) {
      reset(flightRef.current);
    } else if (isOpen && !flightRef.current) {
      reset(defaultFlightData);
    }
  }, [isOpen, reset]);
  return (
    <>
      {flight ? (
        <IconButton
          variant="ghost"
          colorPalette="yellow"
          size={"lg"}
          onClick={onOpen}
          icon={<BiEdit />}
        />
      ) : (
        <Button onClick={onOpen} colorPalette="green">
          Novo Modelo
        </Button>
      )}
      <Dialog.Root
        open={isOpen}
        onOpenChange={(e) => !e.open && onClose()}
        size={"full"}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <FormProvider {...methods}>
              <form>
                <Dialog.Content>
                  <Dialog.Header textAlign={"center"}>
                    {flight ? `Editar o Modelo ${flight.id}` : "Novo Modelo 1M"}
                  </Dialog.Header>
                  <Dialog.CloseTrigger asChild>
                    <IconButton variant="ghost" size="sm">
                      <HiX />
                    </IconButton>
                  </Dialog.CloseTrigger>
                  <Dialog.Body>
                <Stack>
                  <Flex
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <Flex gap={2}>
                      <Field.Root minW={"100px"} invalid={!!errors.airtask}>
                        <Field.Label htmlFor="airtask" textAlign={"center"}>
                          Airtask
                        </Field.Label>
                        <Input
                          id="airtask"
                          name="airtask"
                          placeholder="00A0000"
                          type="text"
                          textAlign={"center"}
                          {...register("airtask", {
                            required: "Campo obrigatório",
                            pattern: {
                              value: /^\d{2}[A-Z]\d{4}$/,
                              message: "Formato inválido. Ex: 00A0000",
                            },
                          })}
                        />
                        <Field.ErrorText>
                          {errors.airtask?.message}
                        </Field.ErrorText>
                      </Field.Root>
                      <Field.Root minW={"100px"}>
                        <Field.Label textAlign={"center"}>Modalidade</Field.Label>
                        <Select
                          textAlign={"center"}
                          type="text"
                          placeholder=" "
                          {...register("flightType")}
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
                        </Select>
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>Acção</Field.Label>
                        <Select
                          type="text"
                          placeholder=" "
                          {...register("flightAction")}
                        >
                          <option value="OPER">OPER</option>
                          <option value="MNT">MNT</option>
                          <option value="TRM">TRM</option>
                          <option value="TRQ">TRQ</option>
                          <option value="TRU">TRU</option>
                          <option value="INST">INST</option>
                        </Select>
                      </Field.Root>
                    </Flex>
                    <Flex dir="row" gap={2}>
                      <Field.Root maxWidth={"fit-content"}>
                        <Field.Label textAlign={"center"}>Data</Field.Label>
                        <Input name="date" type="date" {...register("date")} />
                      </Field.Root>
                      <Field.Root maxW={"fit-content"}>
                        <Field.Label textAlign={"center"}>ATD</Field.Label>
                        <Input type="time" {...register("ATD")} />
                      </Field.Root>
                      <Field.Root maxW={"fit-content"}>
                        <Field.Label textAlign={"center"}>ATA</Field.Label>
                        <Input
                          textAlign={"center"}
                          type="time"
                          {...register("ATA")}
                        />
                      </Field.Root>
                      <Field.Root maxW={"fit-content"}>
                        <Field.Label textAlign={"center"}>TOTAL</Field.Label>
                        <Input
                          bg={"whiteAlpha.100"}
                          textAlign="center"
                          type="time"
                          {...register("ATE")}
                          isReadOnly
                        />
                      </Field.Root>
                    </Flex>
                    <Flex gap={2}>
                      <Field.Root ml={[0, 0, 5]}>
                        <Field.Label textAlign={"center"}>Origem</Field.Label>
                        <Input
                          p={0}
                          textAlign="center"
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          {...register("origin")}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>Destino</Field.Label>
                        <Input
                          p={0}
                          textAlign="center"
                          name="destination"
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          {...register("destination")}
                        />
                      </Field.Root>
                    </Flex>
                  </Flex>
                  <Flex
                    mt="5"
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                  >
                    <Flex gap={2}>
                      <Field.Root invalid={!!errors.tailNumber}>
                        <Field.Label textAlign={"center"}>Nº Cauda</Field.Label>
                        <Select
                          name="tailNumber"
                          type="number"
                          placeholder=" "
                          {...register("tailNumber", {
                            required: "Campo obrigatório",
                          })}
                        >
                          <option value={16701}>16701</option>
                          <option value={16702}>16702</option>
                          <option value={16703}>16703</option>
                          <option value={16704}>16704</option>
                          <option value={16705}>16705</option>
                          <option value={16706}>16706</option>
                          <option value={16707}>16707</option>
                          <option value={16708}>16708</option>
                          <option value={16709}>16709</option>
                          <option value={16710}>16710</option>
                          <option value={16711}>16711</option>
                          <option value={16712}>16712</option>
                        </Select>
                        <Field.ErrorText>
                          {errors.tailNumber?.message}
                        </Field.ErrorText>
                      </Field.Root>
                      <Field.Root invalid={!!errors.aterragens}>
                        <Field.Label textAlign={"center"}>Aterragens</Field.Label>
                        <Input
                          textAlign="center"
                          name="aterragens"
                          type="number"
                          {...register("totalLandings", {
                            required: "Ficaste lá em cima?",
                          })}
                        />
                        <Field.ErrorText>
                          {errors.aterragens?.message}
                        </Field.ErrorText>
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>
                          Nº Tripulantes
                        </Field.Label>
                        <Input
                          bg={"whiteAlpha.100"}
                          textAlign={"center"}
                          type="number"
                          {...register("numberOfCrew", { required: true })}
                          isReadOnly
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>PAX</Field.Label>
                        <Input
                          textAlign={"center"}
                          name="passengers"
                          type="number"
                          {...register("passengers")}
                        />
                      </Field.Root>
                    </Flex>
                    <Flex gap={2}>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>Doentes</Field.Label>
                        <Input
                          textAlign={"center"}
                          name="doe"
                          type="number"
                          inputMode="numeric"
                          {...register("doe")}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>Carga</Field.Label>
                        <Input
                          name="cargo"
                          type="number"
                          {...register("cargo")}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label textAlign={"center"}>ORM</Field.Label>
                        <Input type="number" {...register("orm")} />
                      </Field.Root>
                      <Field.Root invalid={!!errors.fuel}>
                        <Field.Label textAlign={"center"}>FUEL</Field.Label>
                        <Input
                          name="fuel"
                          textAlign={"right"}
                          placeholder="Kg"
                          type="number"
                          {...register("fuel", { required: "Anda a água?" })}
                        />
                        <Field.ErrorText>
                          {errors.fuel?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    </Flex>
                  </Flex>
                  <Center
                    mt="5"
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                    alignItems={"center"}
                    alignContent={"center"}
                  >
                    <Field.Root maxW={"fit-content"}>
                      <Field.Label textAlign={"center"}>ACT 1º</Field.Label>
                      <Input
                        name="activationFirst"
                        type="time"
                        {...register("activationFirst")}
                      />
                    </Field.Root>
                    <Field.Root maxW={"fit-content"}>
                      <Field.Label textAlign={"center"}>ACT Ult.</Field.Label>
                      <Input
                        name="activationLast"
                        {...register("activationLast")}
                        type="time"
                      />
                    </Field.Root>
                    <Field.Root maxW={"fit-content"}>
                      <Field.Label textAlign={"center"}>AC Pronta</Field.Label>
                      <Input
                        name="readyAC"
                        type="time"
                        {...register("readyAC")}
                      />
                    </Field.Root>
                    <Field.Root maxW={"fit-content"}>
                      <Field.Label textAlign={"center"}>Equipa Med</Field.Label>
                      <Input
                        textAlign={"center"}
                        name="medArrival"
                        type="time"
                        {...register("medArrival")}
                      />
                    </Field.Root>
                  </Center>
                  <Separator my={8} />
                  <Box
                    overflowX="auto"
                    paddingBottom={5}
                    ref={scrollRef}
                    onWheel={handleWheel}
                  >
                    <Grid
                      minW="max-content"
                      templateColumns="repeat(17, auto)"
                      rowGap={2}
                      columnGap={1}
                    >
                      <GridItem textAlign={"center"}>Posição</GridItem>
                      <GridItem width={"200px"} textAlign={"center"}>
                        Nome
                      </GridItem>
                      <GridItem w={"80px"} textAlign={"center"}>
                        NIP
                      </GridItem>
                      <GridItem w={"50px"} textAlign={"center"}>
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
                      <GridItem w={"100px"} textAlign={"center"}>
                        Precisão
                      </GridItem>
                      <GridItem w={"100px"} textAlign={"center"}>
                        Não Precisão
                      </GridItem>
                      <GridItem textAlign={"center"} colSpan={6}>
                        Qualificações
                      </GridItem>
                      <GridItem m="auto" />
                      {fields.map((member, index) => (
                        <PilotInput
                          key={member.id}
                          index={index}
                          remove={remove}
                          member={flight_pilots[index]}
                          pilotos={users}
                        />
                      ))}
                    </Grid>
                  </Box>
                  <Button
                    leftIcon={<FaPlus />}
                    mt={5}
                    onClick={() => append({ name: "", position: "", nip: "" })}
                    mx="auto"
                  >
                    Adicionar Tripulante
                  </Button>
                </Stack>
                  </Dialog.Body>
                  <Dialog.Footer>
                {flight && (
                  <Button
                    type="button"
                    colorPalette="purple"
                    mr={3}
                    onClick={handleCreateNewFlight}
                  >
                    Novo Voo
                  </Button>
                )}
                <Button
                  type="button"
                  colorPalette="green"
                  mr={3}
                  onClick={flight ? handleEditFlight : handleCreateNewFlight}
                >
                  {flight ? "Editar Voo" : "Registar Voo"}
                </Button>
                <Button
                  type="button"
                  colorPalette="blue"
                  mr={3}
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                >
                  Fechar
                </Button>
                  </Dialog.Footer>
                </Dialog.Content>
              </form>
            </FormProvider>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
