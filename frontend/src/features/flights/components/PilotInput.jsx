import { http } from "@/api/http";
import { useCrewTypes } from "@/common/CrewTypesProvider";
import {
  Field,
  GridItem,
  IconButton,
  Input,
  NativeSelect,
} from "@chakra-ui/react";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { FaMinus } from "react-icons/fa";

const HIDDEN_QUALIFICATIONS = ["ATR", "ATN", "PREC", "NPREC"];

export const PilotInput = React.memo(({ index, pilotos, member, remove }) => {
  const { positionToCrewType } = useCrewTypes();
  const [qualP, setQualP] = useState([]);
  const { register, setValue, getValues, control } = useFormContext();
  
  // Watch the position, name, and NIP values from the form to ensure reactivity
  const position = useWatch({ control, name: `flight_pilots.${index}.position` });
  const name = useWatch({ control, name: `flight_pilots.${index}.name` });
  const nip = useWatch({ control, name: `flight_pilots.${index}.nip` });
  
  // Track previous position to detect changes
  const prevPositionRef = useRef(position || member.position);

  // Get tipo from position for qualifications fetching
  const tipo = useMemo(() => {
    const pos = position || member.position;
    return pos ? positionToCrewType(pos) : null;
  }, [position, member.position, positionToCrewType]);

  // Lista de pilotos filtrada consoante a posição selecionada
  const pilotosFiltrados = useMemo(() => {
    const pos = position || member.position;
    if (!pos) return [];
    return pilotos.filter((crew) => {
      if (pos === "PC") return ["PI", "PC"].includes(crew.position);
      if (pos === "P") return ["PI", "PC", "P"].includes(crew.position);
      if (pos === "OC") return ["OCI", "OC"].includes(crew.position);
      if (pos === "CT") return ["CTI", "CT"].includes(crew.position);
      if (pos === "OPV") return ["OPVI", "OPV"].includes(crew.position);
      return crew.position === pos;
    });
  }, [pilotos, position, member.position]);

  // Fetch qualifications by tipo (memoized based on position)
  useEffect(() => {
    const fetchQualifications = async () => {
      if (!tipo) {
        setQualP([]);
        return;
      }

      try {
        console.log("Fetching qualifications by tipo:", tipo);
        // Fetch all qualifications and filter by tipo_aplicavel
        const response = await http.get("/v2/qualificacoes");
        console.log("All qualifications:", response.data);
        console.log("Looking for tipo_aplicavel:", tipo);
        
        // Filter qualifications by tipo_aplicavel
        const filteredQuals = (response.data || []).filter(
          (qual) => qual.tipo_aplicavel === tipo
        );
        console.log("Filtered qualifications:", filteredQuals);
        setQualP(filteredQuals);
      } catch (error) {
        console.error("Error fetching qualifications by tipo:", error);
        setQualP([]);
      }
    };

    fetchQualifications();
  }, [tipo]);

  // Clear name and NIP when position changes
  useEffect(() => {
    const currentPosition = position || member.position;
    const previousPosition = prevPositionRef.current;
    
    // If position actually changed (skip initial render)
    if (prevPositionRef.current !== undefined && currentPosition !== previousPosition) {
      setValue(`flight_pilots.${index}.name`, "");
      setValue(`flight_pilots.${index}.nip`, "");
    }
    
    // Update the ref for next comparison
    prevPositionRef.current = currentPosition;
  }, [position, member.position, setValue, index]);

  // Atualiza automaticamente o NIP quando muda o nome
  useEffect(() => {
    const currentName = name || member.name;
    if (!currentName) {
      setValue(`flight_pilots.${index}.nip`, "");
      return;
    }
    // Search in filtered pilots first, then fallback to all pilots
    const piloto = pilotosFiltrados.find((p) => p.name === currentName) 
      || pilotos.find((p) => p.name === currentName);
    setValue(`flight_pilots.${index}.nip`, piloto?.nip || "");
  }, [name, member.name, pilotos, pilotosFiltrados, setValue, index]);

  // Ensure qualification values are preserved when options load
  useEffect(() => {
    if (!qualP?.length) {
      return;
    }
    for (let n = 1; n <= 6; n++) {
      const qualFieldName = `flight_pilots.${index}.QUAL${n}`;
      const currentValue = getValues(qualFieldName);
      if (!currentValue) continue;
      const valueAsString = String(currentValue);
      const matchedById = qualP.find((qual) => qual.id === valueAsString);
      if (matchedById) {
        // Ensure stored value is normalized to the ID string
        setValue(qualFieldName, matchedById.id, { shouldValidate: false });
        continue;
      }
      const matchedByName = qualP.find(
        (qual) => qual.nome?.toUpperCase() === valueAsString.toUpperCase(),
      );
      if (matchedByName) {
        setValue(qualFieldName, matchedByName.id, { shouldValidate: false });
      }
    }
  }, [qualP, index, getValues, setValue]);
  return (
    <Fragment>
      <GridItem alignContent={"center"} alignItems={"center"}>
        <Field.Root alignContent={"center"} alignItems={"center"}>
          <NativeSelect.Root minW={"100px"}>
            <NativeSelect.Field
              nome="posição"
              placeholder=" "
              type="text"
              {...register(`flight_pilots.${index}.position`)}
              textAlign={"center"}
              alignSelf={"center"}
              border="1px solid"
              borderColor="border.subtle"
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
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </GridItem>
      <GridItem mx={1} w={"200px"}>
        <Field.Root>
          <NativeSelect.Root>
            <NativeSelect.Field
              nome="nome"
              textAlign={"center"}
              type="text"
              placeholder="Selecione"
              disabled={!(position || member.position)}
              {...register(`flight_pilots.${index}.name`)}
              border="1px solid"
              borderColor="border.subtle"
              _placeholder={{ color: "text.muted" }}
            >
              {pilotosFiltrados.map((crew) => (
                <option key={crew.name} value={crew.name}>
                  {crew.name}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
      </GridItem>
      <GridItem bg={"whiteAlpha.100"} w={"80px"}>
        <Field.Root isReadOnly alignSelf={"center"}>
          <Input
            p={0}
            display="inline-block"
            textAlign={"center"}
            readOnly
            {...register(`flight_pilots.${index}.nip`)}
            border="1px solid"
            borderColor="border.subtle"
            _placeholder={{ color: "text.muted" }}
          ></Input>
        </Field.Root>
      </GridItem>
      {["PI", "PC", "CP", "P"].includes(member.position)
        ? ["VIR", "VN", "CON", "ATR", "ATN", "precapp", "nprecapp"].map(
            (campo) => (
              <GridItem
                key={campo}
                w={
                  ["VIR", "VN", "CON", "ATR", "ATN"].includes(campo)
                    ? "50px"
                    : "100px"
                }
              >
                <Field.Root>
                  <Input
                    p={0}
                    nome={campo}
                    type={
                      ["VIR", "VN", "CON"].includes(campo) ? "time" : "number"
                    }
                    textAlign={"center"}
                    {...register(`flight_pilots.${index}.${campo}`)}
                    border="1px solid"
                    borderColor="border.subtle"
                    _placeholder={{ color: "text.muted" }}
                  />
                </Field.Root>
              </GridItem>
            ),
          )
        : [1, 2, 3, 4, 5, 6, 7].map((n) => (
            <GridItem key={n} minW={"70px"}></GridItem>
          ))}

      {[1, 2, 3, 4, 5, 6].map((n) => {
        const qualFieldName = `flight_pilots.${index}.QUAL${n}`;

        return (
          <GridItem key={n} minW={"70px"}>
            <Field.Root>
              <Controller
                name={qualFieldName}
                control={control}
                render={({ field }) => (
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      {...field}
                      placeholder=" "
                      value={field.value ? String(field.value) : ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || "")
                      }
                      border="1px solid"
                      borderColor="border.subtle"
                      _placeholder={{ color: "text.muted" }}
                    >
                      {qualP &&
                        qualP
                          .filter(
                            (qual) =>
                              !HIDDEN_QUALIFICATIONS.includes(
                                (qual.nome || "").toUpperCase(),
                              ),
                          )
                          .map((qual) => (
                            <option key={qual.id} value={qual.id}>
                              {qual.nome}
                            </option>
                          ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                )}
              />
            </Field.Root>
          </GridItem>
        );
      })}
      <GridItem justifyContent={"flex-end"} display={"flex"}>
        <IconButton
          colorPalette="red"
          onClick={() => remove(index)}
          aria-label="Edit User"
          maxW={"50%"}
        >
          <FaMinus />
        </IconButton>
      </GridItem>
    </Fragment>
  );
});

PilotInput.displayName = "PilotInput";