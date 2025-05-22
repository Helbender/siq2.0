import {
  FormControl,
  GridItem,
  Input,
  Select,
  IconButton,
} from "@chakra-ui/react";
import { Fragment, useEffect, useState } from "react";
import { FaMinus } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
const PILOT_QUALIFICATIONS = [
  "QA1",
  "QA2",
  "BSP1",
  "BSP2",
  "TA",
  "VRP1",
  "VRP2",
  "BSKIT",
  "PARAS",
  "NVG",
  "CTO",
  "SID",
  "MONO",
  "NFP",
];
const CREW_QUALIFICATIONS = ["BSOC", "BSKIT"];
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
const PilotInput = ({ index, pilotos, member, remove }) => {
  const [initFlag, setInitFlag] = useState(true);
  const [qualP, setQualP] = useState([]);
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  useEffect(() => {
    let temp = pilotos.filter((piloto) => piloto.name == member.name);
    if (temp[0] === undefined || temp[0].name === undefined) {
      setValue(`flight_pilots.${index}.nip`, "");
    } else {
      setValue(`flight_pilots.${index}.nip`, temp[0].nip);
    }
  }, [member.name, setValue]);

  useEffect(() => {
    if (initFlag) {
      setInitFlag(false);
    } else {
      setValue(`flight_pilots.${index}.nip`, "");
    }
    if (
      member.position === "PC" ||
      member.position === "PI" ||
      member.position === "P"
    ) {
      setQualP(PILOT_QUALIFICATIONS);
    } else if (member.position === "CP") {
      setQualP(PILOT_QUALIFICATIONS);
    } else if (
      member.position === "OC" ||
      member.position === "OCI" ||
      member.position === "OCA"
    ) {
      setQualP(CREW_QUALIFICATIONS);
    }
  }, [member.position]);

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
            {...register(`flight_pilots.${index}.position`)}
            // value={member.position}
            // onChange={(e) => {
            //   handleCrewChange(index, "position", e.target.value);
            // }}
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
            {...register(`flight_pilots.${index}.name`)}
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
            isReadOnly
            {...register(`flight_pilots.${index}.nip`)}
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
            textAlign={"center"}
            {...register(`flight_pilots.${index}.VIR`)}
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
            textAlign={"center"}
            {...register(`flight_pilots.${index}.VN`)}
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
            textAlign={"center"}
            {...register(`flight_pilots.${index}.CON`)}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"50px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="ATR"
            type="number"
            textAlign={"center"}
            {...register(`flight_pilots.${index}.ATR`)}
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
            {...register(`flight_pilots.${index}.ATN`)}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"80px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="precapp"
            type="number"
            textAlign={"center"}
            {...register(`flight_pilots.${index}.precapp`)}
          />
        </FormControl>
      </GridItem>
      <GridItem w={"80px"}>
        <FormControl>
          <Input
            display="inline-block"
            name="nprecapp"
            type="number"
            textAlign={"center"}
            {...register(`flight_pilots.${index}.nprecapp`)}
          />
        </FormControl>
      </GridItem>
      <GridItem ml={2} minW={"80px"}>
        <FormControl>
          <Select
            display="inline-block"
            name="Qual1"
            placeholder=" "
            type="text"
            {...register(`flight_pilots.${index}.QUAL1`)}
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
            {...register(`flight_pilots.${index}.QUAL2`)}
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
            {...register(`flight_pilots.${index}.QUAL3`)}
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
            {...register(`flight_pilots.${index}.QUAL4`)}
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
            {...register(`flight_pilots.${index}.QUAL5`)}
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
            {...register(`flight_pilots.${index}.QUAL6`)}
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
          onClick={() => remove(index)}
          aria-label="Edit User"
          maxW={"50%"}
        />
      </GridItem>
    </Fragment>
  );
};

export default PilotInput;
