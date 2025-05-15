 
import {
  FormControl,
  GridItem,
  Input,
  Select,
  IconButton,
  Spacer,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { FaMinus } from "react-icons/fa";

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
// const BASE_PILOT = {
//   nip: "",
//   name: "",
//   ATR: 0,
//   ATN: 0,
//   precapp: 0,
//   nprecapp: 0,
//   QA1: false,
//   QA2: false,
//   BSP1: false,
//   BSP2: false,
//   TA: false,
//   VRP1: false,
//   VRP2: false,
//   CTO: false,
//   SID: false,
//   MONO: false,
//   NFP: false,
//   BSKIT: false,
//   BSOC: false,
// };
const PilotInput = ({
  index,
  setFlightdata,
  pilotos,
  member,
  setCrewMembers,
  crewMembers,
}) => {
  const [nip, setNip] = useState(member.nip);
  const [qualP, setQualP] = useState([]);

  const handleNipForm = (name) => {
    if (name === "") {
      setNip("");
      return "";
    }
    let temp = pilotos.filter((piloto) => piloto.name == name);
    setNip(temp[0].nip);
    return temp[0].nip;
  };

  const handlePositionSelect = (position) => {
    if (position === "PC" || position === "PI" || position === "P") {
      setQualP(PILOT_QUALIFICATIONS);
    } else if (position === "CP") {
      setQualP(PILOT_QUALIFICATIONS);
    } else if (position === "OC" || position === "OCI" || position === "OCA") {
      setQualP(CREW_QUALIFICATIONS);
    }
  };
  const handleCrewChange = (index, field, value) => {
    console.log(field, value);
    const updated = [...crewMembers];
    if (field === "name") {
      updated[index].nip = handleNipForm(value);
    }
    updated[index] = { ...updated[index], [field]: value };
    if (field === "position") {
      handlePositionSelect(value);
      console.log(true);
      updated[index].name = "";
      updated[index].nip = "";
      setNip("");
    }
    setCrewMembers(updated);
    setFlightdata((prev) => ({
      ...prev,
      flight_pilots: updated,
    }));
    console.log(updated);
  };
  const removeCrewMember = (index) => {
    const updated = crewMembers.filter((_, i) => i !== index);
    setCrewMembers(updated);
    setFlightdata((prev) => ({
      ...prev,
      flight_pilots: updated,
    }));
  };
  return (
    <Fragment>
      <GridItem>
        <FormControl>
          <Select
            // m="auto"
            minW={"100px"}
            name="posição"
            placeholder=" "
            type="text"
            value={member.position}
            onChange={(e) => {
              handleCrewChange(index, "position", e.target.value);
            }}
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
      <GridItem mx={1} w={"200px"}>
        <FormControl>
          <Select
            name="name"
            textAlign={"center"}
            type="text"
            placeholder="Selecione"
            isDisabled={!member.position}
            value={member.name}
            onChange={(e) => {
              handleCrewChange(index, "name", e.target.value);
              handleNipForm(e.target.value);
            }}
          >
            {pilotos
              .filter((crew) => {
                if (member.position === "PC") {
                  return crew.position === "PI" || crew.position === "PC";
                } else if (member.position === "OC") {
                  return crew.position === "OCI" || crew.position === "OC";
                } else if (member.position === "P") {
                  return (
                    crew.position === "PI" ||
                    crew.position === "PC" ||
                    crew.position === "P"
                  );
                } else if (member.position === "CT") {
                  return crew.position === "CTI" || crew.position === "CT";
                } else {
                  return crew.position === member.position;
                }
              })
              .map((crew) => (
                <option key={crew.name} value={crew.name}>
                  {crew.name}
                </option>
              ))}
          </Select>
        </FormControl>
      </GridItem>
      <GridItem w={"80px"} bg={"whiteAlpha.100"}>
        <FormControl isReadOnly alignSelf={"center"}>
          <Input
            p={0}
            display="inline-block"
            textAlign={"center"}
            value={nip}
            isReadOnly
          ></Input>
        </FormControl>
      </GridItem>
      <GridItem ml={3} w={"50px"}>
        <FormControl>
          <Input
            p={0}
            display="inline-block"
            name="VIR"
            type="time"
            value={member.VIR}
            textAlign={"center"}
            onChange={(e) => {
              handleCrewChange(index, "VIR", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"50px"}>
        <FormControl>
          <Input
            p={0}
            display="inline-block"
            name="VN"
            type="time"
            value={member.VN}
            textAlign={"center"}
            onChange={(e) => {
              handleCrewChange(index, "VN", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem mr={3} w={"50px"}>
        <FormControl>
          <Input
            p={0}
            display="inline-block"
            name="CON"
            type="time"
            value={member.CON}
            textAlign={"center"}
            onChange={(e) => {
              handleCrewChange(index, "CON", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"50px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="ATR"
            type="number"
            value={member.ATR}
            textAlign={"center"}
            onChange={(e) => {
              handleCrewChange(index, "ATR", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"50px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="ATN"
            type="number"
            textAlign={"center"}
            value={member.ATN}
            onChange={(e) => {
              handleCrewChange(index, "ATN", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"80px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="PrecApp"
            type="number"
            textAlign={"center"}
            value={member.precapp}
            onChange={(e) => {
              handleCrewChange(index, "precapp", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"80px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="NPrecApp"
            type="number"
            textAlign={"center"}
            value={member.nprecapp}
            onChange={(e) => {
              handleCrewChange(index, "nprecapp", e.target.value);
            }}
          />
        </FormControl>
      </GridItem>
      {/* <Spacer /> */}
      <GridItem ml={2} minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual1"
            placeholder=" "
            type="text"
            value={member.QUAL1}
            onChange={(e) => {
              handleCrewChange(index, "QUAL1", e.target.value);
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
      <GridItem minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual2"
            placeholder=" "
            type="text"
            value={member.QUAL2}
            onChange={(e) => {
              handleCrewChange(index, "QUAL2", e.target.value);
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
      <GridItem minW={"70px"}>
        <FormControl>
          <Select
            p={0}
            display="inline-block"
            name="Qual3"
            placeholder=" "
            type="text"
            value={member.QUAL3}
            onChange={(e) => {
              handleCrewChange(index, "QUAL3", e.target.value);
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
      <GridItem minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual4"
            placeholder=" "
            type="text"
            value={member.QUAL4}
            onChange={(e) => {
              handleCrewChange(index, "QUAL4", e.target.value);
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
      <GridItem minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual5"
            placeholder=" "
            type="text"
            value={member.QUAL5}
            onChange={(e) => {
              handleCrewChange(index, "QUAL5", e.target.value);
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
      <GridItem minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual6"
            placeholder=" "
            type="text"
            value={member.QUAL6}
            onChange={(e) => {
              handleCrewChange(index, "QUAL6", e.target.value);
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
      <GridItem justifyContent={"flex-end"} display={"flex"}>
        <IconButton
          icon={<FaMinus />}
          colorScheme="red"
          onClick={() => removeCrewMember(index)}
          aria-label="Edit User"
          maxW={"50%"}
        />
      </GridItem>
      {/* <Button
        colorScheme="red"
        size="sm"
        onClick={() => removeCrewMember(index)}
      >
        Remover
      </Button> */}
    </Fragment>
  );
};

export default PilotInput;
