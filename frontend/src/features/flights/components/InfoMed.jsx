import { Fragment } from "react";
import { StyledText } from "@/shared/components/StyledText";
import { Spacer, Stack } from "@chakra-ui/react";

export function InfoMed({ flight }) {
  return (
    <Fragment>
      {!flight.activationFirst || flight.activationFirst === "__:__" ? null : (
        <>
          <Spacer />
          <Stack>
            <StyledText
              query={"Ativação 1º:"}
              text={`Ativação 1º: ${flight.activationFirst}`}
            />
            <StyledText
              query={"Ativação Ult:"}
              text={`Ativação Ult: ${flight.activationLast}`}
            />
            <StyledText
              query={"AC Pronta:"}
              text={`AC Pronta: ${flight.readyAC}`}
            />
            <StyledText
              query={"Equipa Med:"}
              text={`Equipa Med: ${flight.medArrival}`}
            />
          </Stack>
        </>
      )}
    </Fragment>
  );
}
