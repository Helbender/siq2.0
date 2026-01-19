import { FeatureBasePage } from "@/common/components/FeatureBasePage";
import { Tabs } from "@chakra-ui/react";
import { PilotsPage } from "./PilotsPage";
import { QualificationTablePage } from "./QualificationTablePage";

export function CrewQualifications({ tipo }) {
  return (
    <FeatureBasePage title="Qualificações de Tripulantes">
      {/* <ColorModeProvider forcedTheme="dark"> */}
      <Tabs.Root variant="enclosed" defaultValue="Individuais" css={{
        "--tabs-indicator-bg": "colors.teal.500",
        "--tabs-indicator-shadow": "shadows.xs",
        // "--tabs-trigger-radius": "radii.full",
        // "--tabs-indicator-color": "colors.blue.500",
      }}>
        <Tabs.List>
          <Tabs.Indicator />
          <Tabs.Trigger 
            value="Individuais"
            bg="transparent"
            color="white"
            _selected={{
              color: "black",
            }}
          >Individuais</Tabs.Trigger>
          <Tabs.Trigger 
            value="Planeamento"
            bg="transparent"
            color="white"
            _selected={{
              color: "black",
            }}
          >Planeamento</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="Individuais">
          <PilotsPage tipo={tipo} />
        </Tabs.Content>
        <Tabs.Content value="Planeamento">
          <QualificationTablePage tipo={tipo} />
        </Tabs.Content>
      </Tabs.Root>
      {/* </ColorModeProvider> */}
    </FeatureBasePage>
  );
}