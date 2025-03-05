/* eslint-disable react/prop-types */
import { FormControl, GridItem, Input, Select, Flex } from "@chakra-ui/react";
import { useState } from "react";

const PilotInput = ({ inputs, setInputs, pilotNumber, pilotos }) => {
  const [name, setName] = useState([]);
  const [nip, setNip] = useState("");
  const [qualP, setQualP] = useState([]);
  const [pilot, setPilot] = useState({
    nip: "",
    name: "",
    ATR: 0,
    ATN: 0,
    precapp: 0,
    nprecapp: 0,
    QA1: false,
    QA2: false,
    BSP1: false,
    BSP2: false,
    TA: false,
    VRP1: false,
    VRP2: false,
    BSOC: false,
  });

  const handleNipForm = (name) => {
    console.log(name);
    let temp = pilotos.filter((piloto) => piloto.name == name);
    // console.log(temp[0].nip);
    setNip(temp[0].nip);
    return temp[0].nip;
  };
  const setPilotSelect = (p) => {
    setName(pilotos.filter((piloto) => piloto.position == p));
    setPilot({
      ...pilot,
      position: p,
    });
    let newpilot = { ...pilot, position: p };
    let newinput = { ...inputs, [pilotNumber]: newpilot };
    setInputs(newinput);
  };
  const handlePositionSelect = (e) => {
    e.preventDefault();
    if (e.target.value === "PC") {
      setPilotSelect("PC");
      setNip("");
      setQualP(["QA1", "QA2", "BSP1", "BSP2", "TA", "VRP1", "VRP2"]);
    } else if (e.target.value === "CP") {
      setPilotSelect("CP");
      setNip("");
      setQualP(["QA1", "QA2", "BSP1", "BSP2", "TA", "VRP1", "VRP2"]);
    } else if (e.target.value === "OC") {
      setPilotSelect("OC");
      setNip("");
      setQualP(["BSOC"]);
    }
  };
  return (
    <GridItem
      colSpan={9}
      alignSelf={"center"}
      alignContent={"center"}
      alignItems={"center"}
    >
      <Flex flexDirection={"row"} mt={2}>
        <FormControl ml={5} alignItems={"center"}>
          <Select
            name="posição"
            placeholder=" "
            type="text"
            onChange={handlePositionSelect}
            maxW={20}
            textAlign={"center"}
          >
            <option value="PC">PC</option>
            <option value="CP">CP</option>
            <option value="OC">OC</option>
          </Select>
        </FormControl>
        <FormControl mx={1}>
          <Select
            name="name"
            type="text"
            onChange={(e) => {
              let nip = handleNipForm(e.target.value);
              setPilot({
                ...pilot,
                name: e.target.value,
                nip: nip,
              });
              let newpilot = { ...pilot, name: e.target.value, nip: nip };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          >
            <option value=""> </option>
            {name.map((cat, i) => {
              return (
                <option key={i} value={cat.name}>
                  {cat.name}
                </option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl mx={1} isReadOnly alignSelf={"center"}>
          <Input
            // border="1px"
            // borderColor="gray"
            // borderRadius="5px"
            textAlign={"center"}
            value={nip}
          >
            {/* {!!nip ? nip : "-"} */}
          </Input>
        </FormControl>
        <FormControl mx={1}>
          <Input
            name="ATR"
            type="number"
            onChange={(e) => {
              setPilot({
                ...pilot,
                ATR: e.target.value,
              });
              let newpilot = { ...pilot, ATR: e.target.value };
              console.log(pilotNumber);
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          />
        </FormControl>
        <FormControl mx={1}>
          <Input
            name="ATN"
            type="number"
            onChange={(e) => {
              setPilot({
                ...pilot,
                ATN: e.target.value,
              });
              let newpilot = { ...pilot, ATN: e.target.value };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          />
        </FormControl>
        <FormControl mx={1}>
          <Input
            name="PrecApp"
            type="number"
            onChange={(e) => {
              setPilot({
                ...pilot,
                precapp: e.target.value,
              });
              let newpilot = { ...pilot, precapp: e.target.value };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          />
        </FormControl>
        <FormControl mx={1}>
          <Input
            name="NPrecApp"
            type="number"
            onChange={(e) => {
              // if (e.target.value === "") {
              //   e.target.value = 0;
              // }
              setPilot({
                ...pilot,
                nprecapp: e.target.value,
              });
              let newpilot = { ...pilot, nprecapp: e.target.value };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          />
        </FormControl>
        <FormControl mx={1}>
          <Select
            name="Qual1"
            placeholder=" "
            type="text"
            onChange={(e) => {
              setPilot({
                ...pilot,
                QUAL1: e.target.value,
              });
              let newpilot = { ...pilot, QUAL1: e.target.value };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          >
            {qualP.map((qual, i) => {
              return (
                <option key={i} value={qual}>
                  {qual}
                </option>
              );
            })}
          </Select>
        </FormControl>
        <FormControl mx={1}>
          <Select
            name="Qual2"
            placeholder=" "
            type="text"
            onChange={(e) => {
              setPilot({
                ...pilot,
                QUAL2: e.target.value,
              });
              let newpilot = { ...pilot, QUAL2: e.target.value };
              let newinput = { ...inputs, [pilotNumber]: newpilot };
              setInputs(newinput);
            }}
          >
            {qualP.map((qual, i) => {
              return (
                <option key={i} value={qual}>
                  {qual}
                </option>
              );
            })}
          </Select>
        </FormControl>
      </Flex>
    </GridItem>
  );
};

export default PilotInput;
