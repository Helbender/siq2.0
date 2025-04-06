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
} from "@chakra-ui/react";
import { useState, useEffect, useContext } from "react";
import PilotInput from "./PilotInput";
import axios from "axios";
import { FlightContext } from "../../Contexts/FlightsContext";
import { AuthContext } from "../../Contexts/AuthContext";
import { UserContext } from "../../Contexts/UserContext";

function CreateFlightModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { flights, setFlights } = useContext(FlightContext);
  const { pilotos } = useContext(UserContext);
  const { token } = useContext(AuthContext);

  const toast = useToast();

  // const [pilotos, setPilotos] = useState([]);
  let today = new Date();
  const [inputs, setInputs] = useState({
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

  let pilotList = [0, 1, 2, 3, 4, 5];

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
    let data = inputs;
    !data.flight_pilots ? (data.flight_pilots = []) : null;
    for (let i = 0; i < 6; i++) {
      console.log(i);
      if (Object.hasOwn(inputs, `pilot${i}`)) {
        console.log(true);
        data.flight_pilots[i] = inputs[`pilot${i}`];
        delete data[`pilot${i}`];
      }
    }
    console.log(data);
    try {
      // console.log(token);
      const res = await axios.post("/api/flights", data, {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 201) {
        console.log(res);
        toast({
          title: "Sucesso",
          description: `Voo colocado com sucesso. ID: ${res.data?.message}`,
          status: "success",
          duration: 5000,
          position: "bottom",
        });
        setFlights([...flights, data]);
        // setFilteredFlights([...flights, data]);
        onClose();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error.data?.message,
        status: "error",
        duration: 5000,
        position: "right",
      });
      console.log(error.response);
    }
  };

  return (
    <>
      <Button onClick={onOpen} colorScheme="green">
        Novo Modelo
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        {/* <form onSubmit={handleCreateFlight}> */}
        <ModalContent minWidth={"1200px"}>
          <ModalHeader>Novo Modelo 1M</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack>
              <Flex gap={"5"}>
                <FormControl minW={"100px"}>
                  <FormLabel textAlign={"center"}>Airtask</FormLabel>
                  <Input
                    name="airtask"
                    type="text"
                    isRequired
                    textAlign={"center"}
                    value={inputs.airtask}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        airtask: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </FormControl>
                <FormControl minW={"100px"}>
                  <FormLabel textAlign={"center"}>Modalidade</FormLabel>
                  <Select
                    name="modalidade"
                    type="text"
                    isRequired
                    placeholder=" "
                    value={inputs.flightType}
                    onChange={(e) =>
                      setInputs({ ...inputs, flightType: e.target.value })
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
                    isRequired
                    placeholder=" "
                    value={inputs.flightAction}
                    onChange={(e) =>
                      setInputs({ ...inputs, flightAction: e.target.value })
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
                    value={inputs.date}
                    onChange={(e) =>
                      setInputs({ ...inputs, date: e.target.value })
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
                    value={inputs.ATD}
                    onChange={(e) =>
                      setInputs({ ...inputs, ATD: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl maxW={"fit-content"}>
                  <FormLabel textAlign={"center"}>ATA</FormLabel>
                  <Input
                    name="arrival_time"
                    type="time"
                    value={inputs.ATA}
                    onChange={(e) => {
                      setInputs({ ...inputs, ATA: e.target.value });
                    }}
                  />
                </FormControl>
                <FormControl maxW={"fit-content"}>
                  <FormLabel textAlign={"center"}>TOTAL</FormLabel>
                  <Input
                    textAlign="center"
                    type="time"
                    defaultValue={inputs.ATE}
                    // onChange={(e) => {
                    //   setInputs({ ...inputs, ATE: e.target.value });
                    // }}
                    // isReadOnly
                    onFocusCapture={() =>
                      setInputs({
                        ...inputs,
                        ATE: getTimeDiff(inputs.ATD, inputs.ATA),
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
                    value={inputs.origin}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
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
                    value={inputs.destination}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        destination: e.target.value.toUpperCase(),
                      })
                    }
                    // onInput={(e) =>
                    //   (e.target.value = ("" + e.target.value).toUpperCase())
                    // }
                  />
                </FormControl>
              </Flex>
              <Flex mt="5" gap={"5"}>
                <FormControl>
                  <FormLabel textAlign={"center"}>Nº Cauda</FormLabel>
                  <Select
                    name="tailNumber"
                    type="number"
                    isRequired
                    placeholder=" "
                    value={inputs.tailNumber}
                    onChange={(e) =>
                      setInputs({ ...inputs, tailNumber: e.target.value })
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
                    value={inputs.totalLandings}
                    onChange={(e) =>
                      setInputs({ ...inputs, totalLandings: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>Nº Tripulantes</FormLabel>
                  <Input
                    textAlign={"center"}
                    type="number"
                    value={inputs.numberOfCrew}
                    onChange={(e) =>
                      setInputs({ ...inputs, numberOfCrew: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>PAX</FormLabel>
                  <Input
                    textAlign={"center"}
                    name="passengers"
                    type="number"
                    value={inputs.passengers}
                    onChange={(e) =>
                      setInputs({ ...inputs, passengers: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>Doentes</FormLabel>
                  <Input
                    textAlign={"center"}
                    name="doe"
                    type="number"
                    value={inputs.doe}
                    onChange={(e) =>
                      setInputs({ ...inputs, doe: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>Carga</FormLabel>
                  <Input
                    name="cargo"
                    type="number"
                    value={inputs.cargo}
                    onChange={(e) =>
                      setInputs({ ...inputs, cargo: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>ORM</FormLabel>
                  <Input
                    type="number"
                    value={inputs.orm}
                    onChange={(e) =>
                      setInputs({ ...inputs, orm: e.target.value })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel textAlign={"center"}>FUEL</FormLabel>
                  <Input
                    placeholder="Kg"
                    type="number"
                    value={inputs.fuel}
                    onChange={(e) =>
                      setInputs({ ...inputs, fuel: e.target.value })
                    }
                  />
                </FormControl>
              </Flex>
              <Divider my={8} />
              <Grid
                alignItems={"center"}
                // alignContent={"center"}
                // alignSelf={"center"}
                templateColumns="repeat(12, 1fr)"
              >
                <GridItem textAlign={"center"}>Posição</GridItem>
                <GridItem textAlign={"center"} colSpan={2}>
                  Nome
                </GridItem>
                <GridItem textAlign={"center"}>NIP</GridItem>
                <GridItem textAlign={"center"}>ATR</GridItem>
                <GridItem textAlign={"center"}>ATN</GridItem>
                <GridItem textAlign={"center"}>Precisão</GridItem>
                <GridItem textAlign={"center"}>Não Precisão</GridItem>
                <GridItem textAlign={"center"} colSpan={4}>
                  Qualificações
                </GridItem>
                {/* <GridItem textAlign={"center"}>Qual2</GridItem>
                <GridItem textAlign={"center"}>Qual3</GridItem>
                <GridItem textAlign={"center"}>Qual4</GridItem> */}

                {pilotList.map((number) => (
                  <PilotInput
                    key={number}
                    inputs={inputs}
                    setInputs={setInputs}
                    pilotNumber={`pilot${number}`}
                    pilotos={pilotos}
                  />
                ))}
              </Grid>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              type="submit"
              onClick={handleCreateFlight}
            >
              Add
            </Button>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => {
                onClose();
                setInputs({
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
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
        {/* </form> */}
      </Modal>
    </>
  );
}

export default CreateFlightModal;
