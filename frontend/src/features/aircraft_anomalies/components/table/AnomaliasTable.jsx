import { For, Table } from "@chakra-ui/react";
import StatusBadge from "../StatusBadge";

export default function AnomaliasTable({ planes }) {
  return (
    <Table.Root
      interactive={true}
      variant="simple"
      boxShadow={"lg"}
      bg="bg.cardSubtle"
    >
      {/* <Table.Caption /> */}
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Número</Table.ColumnHeader>
          <Table.ColumnHeader>Anomalias</Table.ColumnHeader>
          <Table.ColumnHeader>Data Inicial</Table.ColumnHeader>
          <Table.ColumnHeader>Counter</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <For each={planes}>
          {(item) => (
            <For each={item.anomalias}>
              {(anomalia, index) => (
                <Table.Row key={`${item.num}-${index}`}>
                  {index === 0 && (
                    <Table.Cell
                      rowSpan={item.anomalias.length}
                      borderRight={"1px solid"}
                      borderColor={"border.subtle"}
                    >
                      {item.num}
                    </Table.Cell>
                  )}
                  <Table.Cell>{anomalia.name}</Table.Cell>
                  <Table.Cell>{item.dataInicial}</Table.Cell>
                  <Table.Cell>
                    {anomalia.counter[0]} / {anomalia.counter[1]}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge
                      percentage={anomalia.counter[0] / anomalia.counter[1]}
                    />
                  </Table.Cell>
                </Table.Row>
              )}
            </For>
          )}
        </For>
      </Table.Body>
      {/* <Table.Footer>
    <Table.Row>
      <Table.Cell />
    </Table.Row>
  </Table.Footer> */}
    </Table.Root>
  );
}
