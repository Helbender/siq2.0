import { Tabs, VStack } from "@chakra-ui/react";
import { FlightActivityTab } from "../components/FlightActivityTab";
import { PlanningTab } from "../components/PlanningTab";
import { QualificationsTab } from "../components/QualificationsTab";
import SectionsTab from "../components/SectionsTab";
export function BriefingPage() {
  return (
    <VStack align="stretch" gap={3}>
      <Tabs.Root defaultValue="qualificacoes" lazyMount variant="outline">
        <Tabs.List>
          <Tabs.Trigger value="qualificacoes">Qualificações</Tabs.Trigger>
          <Tabs.Trigger value="atividade">Atividade de voo</Tabs.Trigger>
          <Tabs.Trigger value="planeamento">Planeamento</Tabs.Trigger>
          <Tabs.Trigger value="sections">Secções</Tabs.Trigger>
          <Tabs.Indicator />
        </Tabs.List>

        <Tabs.Content value="qualificacoes">
          <QualificationsTab />
        </Tabs.Content>

        <Tabs.Content value="atividade">
          <FlightActivityTab />
        </Tabs.Content>

        <Tabs.Content value="planeamento">
          <PlanningTab />
        </Tabs.Content>

        <Tabs.Content value="sections">
          <SectionsTab />
        </Tabs.Content>
      </Tabs.Root>
    </VStack>
  );
}
