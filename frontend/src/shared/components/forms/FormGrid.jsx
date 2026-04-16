import { Grid } from "@chakra-ui/react";

export function FormGrid({ children }) {
  return (
    <Grid templateColumns="repeat(auto-fit,minmax(220px,1fr))" gap="4">
      {children}
    </Grid>
  );
}
