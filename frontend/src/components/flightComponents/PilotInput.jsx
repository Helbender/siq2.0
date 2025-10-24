import {
  FormControl,
  GridItem,
  Input,
  Select,
  IconButton,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { Fragment, useEffect, useMemo } from "react";
import { FaMinus } from "react-icons/fa";
import { useFormContext } from "react-hook-form";
import { apiAuth } from "../../utils/api";

const PilotInput = ({ index, pilotos, member, remove }) => {
  const [qualP, setQualP] = useState([]);
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  useEffect(() => {
    const fetchQualifications = async () => {
      if (!member.nip) {
        setQualP([]);
        return;
      
        try {
          console.log("Fetching Data");
          const response = await apiAuth.get(
            `/v2/qualificacoeslist/${member.nip}`,
          );
          console.log("Data Fetched");
          setQualP(response.data);
          // console.log(response.data);
        } catch (error) {
          console.error("Error fetching qualifications:", error);
          setQualP([]);
        }
      }
    };

    fetchQualifications();
  }, [member.nip]);

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

  // Atualiza automaticamente o NIP quando muda o nome
  useEffect(() => {
    const piloto = pilotos.find((p) => p.name === member.name);
    setValue(`flight_pilots.${index}.nip`, piloto?.nip || "");
  }, [member.name, pilotos, setValue, index]);

  return (
    <Fragment>
      <GridItem alignContent={"center"} alignItems={"center"}>
        <FormControl alignContent={"center"} alignItems={"center"}>
          <Select
            // m="auto"
            minW={"100px"}
            // maxW={"200px"}
            // width={"100px"}
            nome="posição"
            placeholder=" "
            type="text"
            {...register(`flight_pilots.${index}.position`)}
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
            nome="nome"
            textAlign={"center"}
            type="text"
            placeholder="Selecione"
            isDisabled={!member.position}
            {...register(`flight_pilots.${index}.name`)}
          >
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
                nome={campo}
                type={["VIR", "VN", "CON"].includes(campo) ? "time" : "number"}
                textAlign={"center"}
                {...register(`flight_pilots.${index}.${campo}`)}
              />
            </FormControl>
          </GridItem>
        ),
      )}
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <GridItem key={n} minW={"70px"}>
          <FormControl>
            <Select
              name={`QUAL${n}`}
              placeholder=" "
              {...register(`flight_pilots.${index}.QUAL${n}`)}
            >
              {qualP &&
                qualP.map((qual, i) => (
                  <option key={i} value={qual}>
                    {qual}
                  </option>
                ))}
            </Select>
          </FormControl>
        </GridItem>
      ))}
      {}
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
