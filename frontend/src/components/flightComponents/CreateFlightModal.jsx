import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Stack,
  GridItem,
  Grid,
  Divider,
  Select,
  useToast,
  FormErrorMessage,
  Box,
  Center,
  IconButton,
} from "@chakra-ui/react";
import { useContext, useRef, useEffect } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import PilotInput from "./PilotInput";
import { FlightContext } from "../../Contexts/FlightsContext";
import { AuthContext } from "@/features/auth/contexts/AuthContext";
import { UserContext } from "../../Contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { api, apiAuth } from "../../utils/api";
import { getTimeDiff } from "../../Functions/timeCalc";
import { BiEdit } from "react-icons/bi";

const today = new Date();

// Componente
function CreateFlightModal({ flight }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { setFlights } = useContext(FlightContext);
  const { token, removeToken } = useContext(AuthContext);
  const { users } = useContext(UserContext);
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
        res = await apiAuth.patch(`/flights/${flightId}`, data);
      } else {
        res = await apiAuth.post("/flights", data);
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
          colorScheme="yellow"
          size={"lg"}
          onClick={onOpen}
          icon={<BiEdit />}
        />
      ) : (
        <Button onClick={onOpen} colorScheme="green">
          Novo Modelo
        </Button>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside"
        size={"full"}
        closeOnOverlayClick={false}
        closeOnEsc={true}
      >
        <ModalOverlay />
        <FormProvider {...methods}>
          <form
          // onSubmit={handleSubmit(handleCreateFlight)}
          >
            <ModalContent
            // minWidth={"1200px"}
            >
              <ModalHeader textAlign={"center"}>
                {flight ? `Editar o Modelo ${flight.id}` : "Novo Modelo 1M"}
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Stack>
                  <Flex
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                    alignItems={"center"}
                    justifyContent={"space-between"}
                  >
                    <Flex gap={2}>
                      <FormControl minW={"100px"} isInvalid={!!errors.airtask}>
                        <FormLabel htmlFor="airtask" textAlign={"center"}>
                          Airtask
                        </FormLabel>
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
                        <FormErrorMessage>
                          {errors.airtask?.message}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl minW={"100px"}>
                        <FormLabel textAlign={"center"}>Modalidade</FormLabel>
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
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>Acção</FormLabel>
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
                      </FormControl>
                    </Flex>
                    <Flex dir="row" gap={2}>
                      <FormControl maxWidth={"fit-content"}>
                        <FormLabel textAlign={"center"}>Data</FormLabel>
                        <Input name="date" type="date" {...register("date")} />
                      </FormControl>
                      <FormControl maxW={"fit-content"}>
                        <FormLabel textAlign={"center"}>ATD</FormLabel>
                        <Input type="time" {...register("ATD")} />
                      </FormControl>
                      <FormControl
                        // maxW={{ lg: "fit-content" }}
                        maxW={"fit-content"}
                      >
                        <FormLabel textAlign={"center"}>ATA</FormLabel>
                        <Input
                          textAlign={"center"}
                          type="time"
                          {...register("ATA")}
                        />
                      </FormControl>
                      <FormControl maxW={"fit-content"}>
                        <FormLabel textAlign={"center"}>TOTAL</FormLabel>
                        <Input
                          bg={"whiteAlpha.100"}
                          textAlign="center"
                          type="time"
                          {...register("ATE")}
                          isReadOnly
                        />
                      </FormControl>
                    </Flex>
                    <Flex gap={2}>
                      <FormControl ml={[0, 0, 5]}>
                        <FormLabel textAlign={"center"}>Origem</FormLabel>
                        <Input
                          p={0}
                          textAlign="center"
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          {...register("origin")}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>Destino</FormLabel>
                        <Input
                          p={0}
                          textAlign="center"
                          name="destination"
                          type="text"
                          maxLength={4}
                          placeholder="XXXX"
                          {...register("destination")}
                        />
                      </FormControl>
                    </Flex>
                  </Flex>
                  <Flex
                    mt="5"
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                  >
                    <Flex gap={2}>
                      <FormControl isInvalid={!!errors.tailNumber}>
                        <FormLabel textAlign={"center"}>Nº Cauda</FormLabel>
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
                        <FormErrorMessage>
                          {errors.tailNumber?.message}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl isInvalid={!!errors.aterragens}>
                        <FormLabel textAlign={"center"}>Aterragens</FormLabel>
                        <Input
                          textAlign="center"
                          name="aterragens"
                          type="number"
                          {...register("totalLandings", {
                            required: "Ficaste lá em cima?",
                          })}
                        />
                        <FormErrorMessage>
                          {errors.aterragens?.message}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>
                          Nº Tripulantes
                        </FormLabel>
                        <Input
                          bg={"whiteAlpha.100"}
                          textAlign={"center"}
                          type="number"
                          {...register("numberOfCrew", { required: true })}
                          isReadOnly
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>PAX</FormLabel>
                        <Input
                          textAlign={"center"}
                          name="passengers"
                          type="number"
                          {...register("passengers")}
                        />
                      </FormControl>
                    </Flex>
                    <Flex gap={2}>
                      <FormControl>
                        <FormLabel textAlign={"center"}>Doentes</FormLabel>
                        <Input
                          textAlign={"center"}
                          name="doe"
                          type="number"
                          inputMode="numeric"
                          {...register("doe")}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>Carga</FormLabel>
                        <Input
                          name="cargo"
                          type="number"
                          {...register("cargo")}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel textAlign={"center"}>ORM</FormLabel>
                        <Input type="number" {...register("orm")} />
                      </FormControl>
                      <FormControl isInvalid={!!errors.fuel}>
                        <FormLabel textAlign={"center"}>FUEL</FormLabel>
                        <Input
                          name="fuel"
                          textAlign={"right"}
                          placeholder="Kg"
                          type="number"
                          {...register("fuel", { required: "Anda a água?" })}
                        />
                        <FormErrorMessage>
                          {errors.fuel?.message}
                        </FormErrorMessage>
                      </FormControl>
                    </Flex>
                  </Flex>
                  <Center
                    mt="5"
                    gap={"5"}
                    direction={{ base: "column", lg: "row" }}
                    alignItems={"center"}
                    alignContent={"center"}
                  >
                    <FormControl maxW={"fit-content"}>
                      <FormLabel textAlign={"center"}>ACT 1º</FormLabel>
                      <Input
                        name="activationFirst"
                        type="time"
                        {...register("activationFirst")}
                      />
                    </FormControl>
                    <FormControl maxW={"fit-content"}>
                      <FormLabel textAlign={"center"}>ACT Ult.</FormLabel>
                      <Input
                        name="activationLast"
                        {...register("activationLast")}
                        type="time"
                      />
                    </FormControl>
                    <FormControl maxW={"fit-content"}>
                      <FormLabel textAlign={"center"}>AC Pronta</FormLabel>
                      <Input
                        name="readyAC"
                        type="time"
                        {...register("readyAC")}
                      />
                    </FormControl>
                    <FormControl maxW={"fit-content"}>
                      <FormLabel textAlign={"center"}>Equipa Med</FormLabel>
                      <Input
                        textAlign={"center"}
                        name="medArrival"
                        type="time"
                        {...register("medArrival")}
                      />
                    </FormControl>
                  </Center>
                  <Divider my={8} />
                  <Box
                    overflowX="auto"
                    paddingBottom={5}
                    ref={scrollRef}
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
              </ModalBody>
              <ModalFooter>
                {flight && (
                  <Button
                    type="button"
                    colorScheme="purple"
                    mr={3}
                    onClick={handleCreateNewFlight}
                  >
                    Novo Voo
                  </Button>
                )}
                <Button
                  type="button"
                  colorScheme="green"
                  mr={3}
                  onClick={flight ? handleEditFlight : handleCreateNewFlight}
                >
                  {flight ? "Editar Voo" : "Registar Voo"}
                </Button>
                <Button
                  type="button"
                  colorScheme="blue"
                  mr={3}
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                >
                  Fechar
                </Button>
              </ModalFooter>
            </ModalContent>
          </form>
        </FormProvider>
      </Modal>
    </>
  );
}

export default CreateFlightModal;
