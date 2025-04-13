/* eslint-disable react/prop-types */
import { FormControl, GridItem, Input, Select } from "@chakra-ui/react";
import { Fragment, useState } from "react";

const PILOT_QUALIFICATIONS = [
  "QA1",
  "QA2",
  "BSP1",
  "BSP2",
  "TA",
  "VRP1",
  "VRP2",
  "CTO",
  "SID",
  "MONO",
  "NFP",
];
const CREW_QUALIFICATIONS = ["BSOC"];
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
    CTO: false,
    SID: false,
    MONO: false,
    NFP: false,
    BSOC: false,
  });

  const handleNipForm = (name) => {
    console.log(name);
    let temp = pilotos.filter((piloto) => piloto.name == name);
    setNip(temp[0].nip);
    return temp[0].nip;
  };
  const setPilotSelect = (p) => {
    setPilot({
      ...pilot,
      position: p,
    });
    let newpilot = { ...pilot, position: p };
    if (p === "PI") {
      p = "PC";
    }
    setName(pilotos.filter((piloto) => piloto.position == p));
    let newinput = { ...inputs, [pilotNumber]: newpilot };
    setInputs(newinput);
  };
  const handlePositionSelect = (e) => {
    e.preventDefault();
    console.log(e.target.value);
    if (e.target.value === "PC" || e.target.value === "PI") {
      setPilotSelect(e.target.value);
      setNip("");
      setQualP(PILOT_QUALIFICATIONS);
    } else if (e.target.value === "CP") {
      setPilotSelect("CP");
      setNip("");
      setQualP(PILOT_QUALIFICATIONS);
    } else if (e.target.value === "OC") {
      setPilotSelect("OC");
      setNip("");
      setQualP(CREW_QUALIFICATIONS);
    }
  };
  return (
    <Fragment
    // colSpan={12}
    // alignSelf={"center"}
    // alignContent={"center"}
    // alignItems={"center"}
    >
      {/* <Flex flexDirection={"row"} mt={2}> */}
      <GridItem>
        <FormControl ml={5} alignItems={"center"}>
          <Select
            name="posição"
            placeholder=" "
            type="text"
            onChange={handlePositionSelect}
            maxW={20}
            textAlign={"center"}
          >
            <option value="PI">PI</option>
            <option value="PC">PC</option>
            <option value="CP">CP</option>
            <option value="OC">OC</option>
          </Select>
        </FormControl>
      </GridItem>
      <GridItem colSpan={2}>
        <FormControl mx={1}>
          <Select
            name="name"
            textAlign={"center"}
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
      </GridItem>
      <GridItem>
        <FormControl mx={1} isReadOnly alignSelf={"center"}>
          <Input textAlign={"center"} value={nip}></Input>
        </FormControl>
      </GridItem>

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
      <GridItem>
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
      </GridItem>
      <GridItem>
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
      </GridItem>

      <GridItem>
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
      </GridItem>

      <GridItem>
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
      </GridItem>

      <GridItem>
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
      </GridItem>

      <GridItem>
        <FormControl mx={1}>
          <Select
            name="Qual3"
            placeholder=" "
            type="text"
            onChange={(e) => {
              setPilot({
                ...pilot,
                QUAL3: e.target.value,
              });
              let newpilot = { ...pilot, QUAL3: e.target.value };
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
      </GridItem>

      <GridItem>
        <FormControl mx={1}>
          <Select
            name="Qual4"
            placeholder=" "
            type="text"
            onChange={(e) => {
              setPilot({
                ...pilot,
                QUAL4: e.target.value,
              });
              let newpilot = { ...pilot, QUAL4: e.target.value };
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
      </GridItem>

      {/* </Flex> */}
    </Fragment>
  );
};

export default PilotInput;
