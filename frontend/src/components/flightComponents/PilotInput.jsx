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
  "BSKIT",
  "CTO",
  "SID",
  "MONO",
  "NFP",
];
const CREW_QUALIFICATIONS = ["BSOC"];
const BASE_PILOT = {
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
  BSKIT: false,
  BSOC: false,
};
const PilotInput = ({ inputs, setInputs, pilotNumber, pilotos }) => {
  const [name, setName] = useState([]);
  const [nip, setNip] = useState("");
  const [qualP, setQualP] = useState([]);
  const [pilot, setPilot] = useState(BASE_PILOT);
  const [selectedName, setSelectedName] = useState("");

  const handleNipForm = (name) => {
    // console.log(name);
    // console.log(!name);
    if (!name) return setNip("");
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

    let filteredPilots = pilotos.filter((piloto) => {
      if (p === "PC") {
        return piloto.position === "PI" || piloto.position === "PC";
      } else if (p === "OC") {
        return piloto.position === "OCI" || piloto.position === "OC";
      } else if (p === "P") {
        return (
          piloto.position === "PI" ||
          piloto.position === "PC" ||
          piloto.position === "P"
        );
      } else if (p === "CT") {
        return piloto.position === "CTI" || piloto.position === "CT";
      } else {
        return piloto.position === p;
      }
    });

    setName(filteredPilots);
    let newinput = { ...inputs, [pilotNumber]: newpilot };
    setInputs(newinput);
  };
  const handlePositionSelect = (e) => {
    e.preventDefault();
    setNip("");
    setSelectedName("");
    if (!e.target.value) {
      let newinput = inputs;
      delete newinput[pilotNumber];
      setPilot(BASE_PILOT);
      setInputs(newinput);

      return;
    }

    if (
      e.target.value === "PC" ||
      e.target.value === "PI" ||
      e.target.value === "P"
    ) {
      setPilotSelect(e.target.value);
      // setNip("");
      setQualP(PILOT_QUALIFICATIONS);
    } else if (e.target.value === "CP") {
      setPilotSelect("CP");
      // setNip("");
      setQualP(PILOT_QUALIFICATIONS);
    } else if (
      e.target.value === "OC" ||
      e.target.value === "OCI" ||
      e.target.value === "OCA"
    ) {
      setPilotSelect("OC");
      setQualP(CREW_QUALIFICATIONS);
    }
    // setNip("");
  };
  return (
    <Fragment
    // colSpan={12}
    // alignSelf={"center"}
    // alignContent={"center"}
    // alignItems={"center"}
    >
      <GridItem>
        <FormControl
          m="auto"
          // alignItems={"center"}
          // alignContent={"center"}
        >
          <Select
            m="auto"
            name="posição"
            placeholder=" "
            type="text"
            onChange={handlePositionSelect}
            maxW={"100px"}
            textAlign={"center"}
          >
            <option value="PI">PI</option>
            <option value="PC">PC</option>
            <option value="P">P</option>
            <option value="CP">CP</option>
            <option value="OCI">OCI</option>
            <option value="OC">OC</option>
            <option value="OCA">OCA</option>
            <option value="CT">CT</option>
            <option value="CTI">CTI</option>
            <option value="CTA">CTA</option>
            <option value="OPV">OPV</option>
            <option value="OPVI">OPVI</option>
            <option value="OPVA">OPVA</option>
          </Select>
        </FormControl>
      </GridItem>
      <GridItem colSpan={2}>
        <FormControl mx={1}>
          <Select
            name="name"
            textAlign={"center"}
            type="text"
            value={selectedName}
            onChange={(e) => {
              const selected = e.target.value;
              setSelectedName(selected);
              const nip = handleNipForm(selected);
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

      <GridItem>
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
      </GridItem>
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
