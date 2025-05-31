import {
  FormControl,
  GridItem,
  Input,
  Select,
  IconButton,
} from "@chakra-ui/react";
import React from "react";
import { Fragment, useEffect, useState, useMemo } from "react";
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
  // const [initFlag, setInitFlag] = useState(true);
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  // Define qualificações de forma memoizada
  const qualP = useMemo(() => {
    const pos = member.position;
    if (["PC", "PI", "P", "CP"].includes(pos)) return PILOT_QUALIFICATIONS;
    if (["OC", "OCI", "OCA"].includes(pos)) return CREW_QUALIFICATIONS;
    return [];
  }, [member.position]);

  // Lista de pilotos filtrada consoante a posição selecionada
  const pilotosFiltrados = useMemo(() => {
    const pos = member.position;
    return pilotos.filter((crew) => {
      if (pos === "PC") return ["PI", "PC"].includes(crew.position);
      if (pos === "P") return ["PI", "PC", "P"].includes(crew.position);
      if (pos === "OC") return ["OCI", "OC"].includes(crew.position);
      if (pos === "CT") return ["CTI", "CT"].includes(crew.position);
      if (pos === "OPV") return ["OPVI", "OPV"].includes(crew.position);
      return crew.position === pos;
    });
  }, [pilotos, member.position]);

  // useEffect(() => {
  //   let temp = pilotos.filter((piloto) => piloto.name == member.name);
  //   if (temp[0] === undefined || temp[0].name === undefined) {
  //     setValue(`flight_pilots.${index}.nip`, "");
  //   } else {
  //     setValue(`flight_pilots.${index}.nip`, temp[0].nip);
  //   }
  // }, [member.name, setValue]);
  // Atualiza automaticamente o NIP quando muda o nome
  useEffect(() => {
    const piloto = pilotos.find((p) => p.name === member.name);
    setValue(`flight_pilots.${index}.nip`, piloto?.nip || "");
  }, [member.name, pilotos, setValue, index]);

  // useEffect(() => {
  //   if (initFlag) {
  //     setInitFlag(false);
  //   } else {
  //     setValue(`flight_pilots.${index}.nip`, "");
  //   }
  //   if (
  //     member.position === "PC" ||
  //     member.position === "PI" ||
  //     member.position === "P"
  //   ) {
  //     setQualP(PILOT_QUALIFICATIONS);
  //   } else if (member.position === "CP") {
  //     setQualP(PILOT_QUALIFICATIONS);
  //   } else if (
  //     member.position === "OC" ||
  //     member.position === "OCI" ||
  //     member.position === "OCA"
  //   ) {
  //     setQualP(CREW_QUALIFICATIONS);
  //   }
  // }, [member.position]);

  return (
    <Fragment>
      <GridItem alignContent={"center"} alignItems={"center"}>
        <FormControl alignContent={"center"} alignItems={"center"}>
          <Select
            // m="auto"
            minW={"100px"}
            // maxW={"200px"}
            // width={"100px"}
            name="posição"
            placeholder=" "
            type="text"
            {...register(`flight_pilots.${index}.position`)}
            // value={member.position}
            // onChange={(e) => {
            //   handleCrewChange(index, "position", e.target.value);
            // }}
            textAlign={"center"}
            alignSelf={"center"}
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
            {/* {pilotos
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
              ))} */}
            {pilotosFiltrados.map((crew) => (
              <option key={crew.name} value={crew.name}>
                {crew.name}
              </option>
            ))}
          </Select>
        </FormControl>
      </GridItem>
      <GridItem bg={"whiteAlpha.100"} w={"80px"}>
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
      {/* <GridItem ml={3} w={"50px"}>
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
      </GridItem> */}
      {["VIR", "VN", "CON", "ATR", "ATN", "precapp", "nprecapp"].map(
        (campo) => (
          <GridItem
            key={campo}
            w={
              ["VIR", "VN", "CON", "ATR", "ATN"].includes(campo)
                ? "50px"
                : "100px"
            }
          >
            <FormControl>
              <Input
                p={0}
                name={campo}
                type={["VIR", "VN", "CON"].includes(campo) ? "time" : "number"}
                textAlign={"center"}
                {...register(`flight_pilots.${index}.${campo}`)}
              />
            </FormControl>
          </GridItem>
        ),
      )}
      {/* <GridItem ml={2} minW={"80px"}>
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
      </GridItem> */}
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <GridItem key={n} minW={"70px"}>
          <FormControl>
            <Select
              name={`Qual${n}`}
              placeholder=" "
              {...register(`flight_pilots.${index}.QUAL${n}`)}
            >
              {qualP.map((qual, i) => (
                <option key={i} value={qual}>
                  {qual}
                </option>
              ))}
            </Select>
          </FormControl>
        </GridItem>
      ))}
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

export default React.memo(PilotInput);
