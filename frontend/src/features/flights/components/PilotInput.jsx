import { http } from "@/app/config/http";
import { useCrewTypes } from "@/app/providers/CrewTypesProvider";
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

// Fallback position -> tipo when CrewTypesProvider hasn't loaded (e.g. on edit modal open)
const POSITION_TO_TIPO_FALLBACK = {
  PI: "PILOTO",
  PC: "PILOTO",
  P: "PILOTO",
  CP: "PILOTO",
  OCI: "OPERADOR CABINE",
  OC: "OPERADOR CABINE",
  OCA: "OPERADOR CABINE",
  CTI: "COORDENADOR TATICO",
  CT: "COORDENADOR TATICO",
  CTA: "COORDENADOR TATICO",
  OPVI: "OPERADOR VIGILANCIA",
  OPV: "OPERADOR VIGILANCIA",
  OPVA: "OPERADOR VIGILANCIA",
};

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

  // Get tipo from position for qualifications fetching (use fallback when provider not ready, e.g. edit mode)
  const tipo = useMemo(() => {
    const pos = position ?? member?.position;
    if (!pos) return null;
    const fromProvider = positionToCrewType?.(pos);
    if (fromProvider) return fromProvider;
    return POSITION_TO_TIPO_FALLBACK[pos] ?? null;
  }, [position, member?.position, positionToCrewType]);

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
        const response = await http.get("/v2/qualificacoes");
        const all = response.data || [];
        const tipoNorm = String(tipo).trim().toUpperCase();
        const filteredQuals = all.filter((qual) => {
          const aplicavel = String(qual.tipo_aplicavel ?? "").trim().toUpperCase();
          return aplicavel === tipoNorm;
        });
        setQualP(filteredQuals);
      } catch (error) {
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

  // Ensure qualification values are preserved when options load (IDs may be number or string)
  useEffect(() => {
    if (!qualP?.length) {
      return;
    }
    for (let n = 1; n <= 6; n++) {
      const qualFieldName = `flight_pilots.${index}.QUAL${n}`;
      const currentValue = getValues(qualFieldName);
      if (currentValue == null || currentValue === "") continue;
      const valueAsString = String(currentValue).trim();
      const matchedById = qualP.find((qual) => String(qual.id) === valueAsString);
      if (matchedById) {
        setValue(qualFieldName, String(matchedById.id), { shouldValidate: false });
        continue;
      }
      const matchedByName = qualP.find(
        (qual) => (qual.nome ?? "").toUpperCase() === valueAsString.toUpperCase(),
      );
      if (matchedByName) {
        setValue(qualFieldName, String(matchedByName.id), { shouldValidate: false });
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
            variant="readOnly"
            {...register(`flight_pilots.${index}.nip`)}
          ></Input>
        </Field.Root>
      </GridItem>
      {["PI", "PC", "CP", "P"].includes(position || member.position)
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
                render={({ field }) => {
                  const options = (qualP || [])
                    .filter(
                      (qual) =>
                        !HIDDEN_QUALIFICATIONS.includes(
                          (qual.nome || "").toUpperCase(),
                        ),
                    )
                    .map((qual) => ({
                      value: String(qual.id),
                      label: qual.nome,
                      id: qual.id,
                    }));
                  const currentVal = field.value ? String(field.value).trim() : "";
                  const valueInOptions = options.some(
                    (o) => o.value === currentVal || (o.label ?? "").toUpperCase() === currentVal.toUpperCase(),
                  );
                  const showFallbackOption = currentVal && !valueInOptions;

                  return (
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        {...field}
                        placeholder=" "
                        value={currentVal || ""}
                        onChange={(event) =>
                          field.onChange(event.target.value || "")
                        }
                      >
                        {options.map((opt) => (
                          <option key={opt.id} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        {showFallbackOption && (
                          <option value={currentVal}>
                            {currentVal}
                          </option>
                        )}
                      </NativeSelect.Field>
                      <NativeSelect.Indicator />
                    </NativeSelect.Root>
                  );
                }}
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