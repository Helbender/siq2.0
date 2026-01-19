import { FeatureBasePage } from "@/features/shared/pages/FeatureBasePage";
import { Tabs } from "@chakra-ui/react";

export function CrewQualifications() {
  return (
   <FeatureBasePage title="Qualificações de Tripulantes">
    <Tabs.Root variant="outline">
  <Tabs.List>
    <Tabs.Trigger value="Individuais">Individuais</Tabs.Trigger>
    <Tabs.Trigger value="Planeamento">Planeamento</Tabs.Trigger>
    <Tabs.Indicator />
  </Tabs.List>
  <Tabs.Content />
</Tabs.Root>
   </FeatureBasePage>
  );
}