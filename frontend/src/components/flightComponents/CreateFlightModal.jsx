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
} from "@chakra-ui/react";
import { useState, useContext, useRef } from "react";
import { useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import PilotInput from "./PilotInput";
import axios from "axios";
import { FlightContext } from "../../Contexts/FlightsContext";
import { AuthContext } from "../../Contexts/AuthContext";
import { UserContext } from "../../Contexts/UserContext";
import { useNavigate } from "react-router-dom";

function CreateFlightModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { flights, setFlights } = useContext(FlightContext);
  const { pilotos } = useContext(UserContext);
  const { token, removeToken } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const handleWheel = (e) => {
    if (e.deltaY !== 0 && scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [crewMembers, setCrewMembers] = useState(
    Array(4).fill({ position: "", name: "" }),
  );

  // const [pilotos, setPilotos] = useState([]);
  let today = new Date();
  const [flightdata, setFlightdata] = useState({
    airtask: "",
    flightType: "",
    flightAction: "",
    date: `${today.toISOString().substring(0, 10)}`,
    origin: "",
    destination: "",
    ATD: "",
    ATA: "",
    ATE: "",
    tailNumber: "",
    totalLandings: "",
    passengers: "",
    doe: "",
    cargo: "",
    numberOfCrew: "",
    orm: "",
    fuel: "",
  });

  const addCrewMember = () => {
    setCrewMembers([...crewMembers, { position: "", name: "" }]);
  };
  const getTimeDiff = (time1, time2) => {
    time1 = time1.split(":");
    time2 = time2.split(":");
    let timeString1 = new Date(0, 0, 0, time1[0], time1[1], 0, 0);
    let timeString2 = new Date(0, 0, 0, time2[0], time2[1], 0, 0);
    let dif = (timeString2 - timeString1) / 3600 / 1000;
    let hours = Math.floor(dif);
    let minutes = Math.round((dif - hours) * 60);
    let time = String(
      (hours < 10 ? "0" + hours : hours) +
        ":" +
        (minutes < 10 ? "0" + minutes : minutes),
    );
    console.log(time);
    return time;
  };
  const handleCreateFlight = async (e) => {
    e.preventDefault();
    let data = flightdata;

    toast({
      title: "A adicionar voo",
      description: "Em processo.",
      status: "loading",
      duration: 10000,
      isClosable: true,
      position: "bottom",
    });
    console.log(data);
    try {
      const res = await axios.post("/api/flights", data, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 201) {
        console.log(res);
        toast.closeAll();
        toast({
          title: "Sucesso",
          description: `Voo colocado com sucesso. ID: ${res.data?.message}`,
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        data.id = res.data?.message;
        setFlights([...flights, data]);
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

  return (
    <>
      <Button onClick={onOpen} colorScheme="green">
        Novo Modelo
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        scrollBehavior="inside"
        size={"full"}
      >
        <ModalOverlay />
        <form onSubmit={handleSubmit(handleCreateFlight)}>
          <ModalContent minWidth={"1200px"}>
            <ModalHeader>Novo Modelo 1M</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack>
                <Flex gap={"5"}>
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
                          value: /^\d{2}[A-Za-z]\d{4}$/,
                          message: "Formato inválido. Ex: 00A0000",
                        },
                      })}
                      value={flightdata.airtask}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          airtask: e.target.value.toUpperCase(),
                        })
                      }
                    />
                    <FormErrorMessage>
                      {errors.airtask?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl minW={"100px"}>
                    <FormLabel textAlign={"center"}>Modalidade</FormLabel>
                    <Select
                      name="modalidade"
                      type="text"
                      placeholder=" "
                      value={flightdata.flightType}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          flightType: e.target.value,
                        })
                      }
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
                      name="action"
                      type="text"
                      placeholder=" "
                      value={flightdata.flightAction}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          flightAction: e.target.value,
                        })
                      }
                    >
                      <option value="OPER">OPER</option>
                      <option value="MNT">MNT</option>
                      <option value="TRM">TRM</option>
                      <option value="TRQ">TRQ</option>
                      <option value="TRU">TRU</option>
                      <option value="INST">INST</option>
                    </Select>
                  </FormControl>
                  <FormControl maxWidth={"fit-content"}>
                    <FormLabel textAlign={"center"}>Data</FormLabel>
                    <Input
                      name="date"
                      type="date"
                      value={flightdata.date}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, date: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl
                    // ml={"5"}
                    // maxWidth={"90px"}
                    maxW={"fit-content"}
                  >
                    <FormLabel textAlign={"center"}>ATD</FormLabel>
                    <Input
                      // as="text"
                      name="departure_time"
                      type="time"
                      value={flightdata.ATD}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, ATD: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl maxW={"fit-content"}>
                    <FormLabel textAlign={"center"}>ATA</FormLabel>
                    <Input
                      name="arrival_time"
                      type="time"
                      value={flightdata.ATA}
                      onChange={(e) => {
                        setFlightdata({ ...flightdata, ATA: e.target.value });
                      }}
                    />
                  </FormControl>
                  <FormControl maxW={"fit-content"}>
                    <FormLabel textAlign={"center"}>TOTAL</FormLabel>
                    <Input
                      textAlign="center"
                      type="time"
                      defaultValue={flightdata.ATE}
                      // onChange={(e) => {
                      //   setInputs({ ...inputs, ATE: e.target.value });
                      // }}
                      // isReadOnly
                      onFocusCapture={() =>
                        setFlightdata({
                          ...flightdata,
                          ATE: getTimeDiff(flightdata.ATD, flightdata.ATA),
                        })
                      }
                    />
                  </FormControl>
                  <FormControl ml={"5"}>
                    <FormLabel textAlign={"center"}>Origem</FormLabel>
                    <Input
                      textAlign="center"
                      name="origin"
                      type="text"
                      maxLength={4}
                      placeholder="XXXX"
                      // {...register("origin", {
                      //   required: "Campo obrigatório",
                      //   minLength: {
                      //     value: 4,
                      //     message: "Mínimo 4 caracteres",
                      //   },
                      //   maxLength: {
                      //     value: 4,
                      //     message: "Máximo 4 caracteres",
                      //   },
                      // })}
                      value={flightdata.origin}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          origin: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Destino</FormLabel>
                    <Input
                      textAlign="center"
                      name="destination"
                      type="text"
                      maxLength={4}
                      placeholder="XXXX"
                      value={flightdata.destination}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          destination: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </FormControl>
                </Flex>
                <Flex mt="5" gap={"5"}>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Nº Cauda</FormLabel>
                    <Select
                      name="tailNumber"
                      type="number"
                      placeholder=" "
                      value={flightdata.tailNumber}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          tailNumber: e.target.value,
                        })
                      }
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
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Aterragens</FormLabel>
                    <Input
                      textAlign="center"
                      name="aterragens"
                      type="number"
                      value={flightdata.totalLandings}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          totalLandings: e.target.value,
                        })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Nº Tripulantes</FormLabel>
                    <Input
                      textAlign={"center"}
                      type="number"
                      value={flightdata.numberOfCrew}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          numberOfCrew: e.target.value,
                        })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>PAX</FormLabel>
                    <Input
                      textAlign={"center"}
                      name="passengers"
                      type="number"
                      value={flightdata.passengers}
                      onChange={(e) =>
                        setFlightdata({
                          ...flightdata,
                          passengers: e.target.value,
                        })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Doentes</FormLabel>
                    <Input
                      textAlign={"center"}
                      name="doe"
                      type="number"
                      value={flightdata.doe}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, doe: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>Carga</FormLabel>
                    <Input
                      name="cargo"
                      type="number"
                      value={flightdata.cargo}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, cargo: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>ORM</FormLabel>
                    <Input
                      type="number"
                      value={flightdata.orm}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, orm: e.target.value })
                      }
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel textAlign={"center"}>FUEL</FormLabel>
                    <Input
                      placeholder="Kg"
                      type="number"
                      value={flightdata.fuel}
                      onChange={(e) =>
                        setFlightdata({ ...flightdata, fuel: e.target.value })
                      }
                    />
                  </FormControl>
                </Flex>
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
                    <GridItem textAlign={"center"}>Nome</GridItem>
                    <GridItem textAlign={"center"}>NIP</GridItem>
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
                    {crewMembers.map((member, index) => (
                      <PilotInput
                        key={index}
                        index={index}
                        setFlightdata={setFlightdata}
                        pilotos={pilotos}
                        member={member}
                        setCrewMembers={setCrewMembers}
                        crewMembers={crewMembers}
                      />
                    ))}
                  </Grid>
                </Box>
                <Button
                  leftIcon={<FaPlus />}
                  mt={5}
                  onClick={addCrewMember}
                  mx="auto"
                >
                  Adicionar Tripulante
                </Button>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                type="submit"
                // onClick={handleCreateFlight}
              >
                Registar Voo
              </Button>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={() => {
                  reset();
                  setFlightdata({
                    airtask: "",
                    flightType: "",
                    flightAction: "",
                    date: `${today.toISOString().substring(0, 10)}`,
                    origin: "",
                    destination: "",
                    ATD: "",
                    ATA: "",
                    ATE: "",
                    tailNumber: "",
                    totalLandings: "",
                    passengers: "",
                    doe: "",
                    cargo: "",
                    numberOfCrew: "",
                    orm: "",
                    fuel: "",
                  });
                  onClose();
                }}
              >
                Fechar
              </Button>
            </ModalFooter>
          </ModalContent>
        </form>
      </Modal>
    </>
  );
}

export default CreateFlightModal;
