import { HStack, Table } from "@chakra-ui/react";
import { CreateQualModal } from "./CreateQualModal";
import { DeleteQualModal } from "./DeleteQualModal";

export function QualificationTable({ qualifications, setQualifications }) {
  return (
    <Table.Root mt={4} overflowX="auto" striped variant="simple">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>ID</Table.ColumnHeader>
          <Table.ColumnHeader>Qualificação</Table.ColumnHeader>
          <Table.ColumnHeader>Validade (Dias)</Table.ColumnHeader>
          <Table.ColumnHeader>Tipo Tripulante</Table.ColumnHeader>
          <Table.ColumnHeader>Grupo</Table.ColumnHeader>
          <Table.ColumnHeader>Ações</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {qualifications.map((qual) => (
          <Table.Row key={qual.id}>
            <Table.Cell>{qual.id}</Table.Cell>
            <Table.Cell>{qual.nome}</Table.Cell>
            <Table.Cell>{qual.validade}</Table.Cell>
            <Table.Cell>{qual.tipo_aplicavel}</Table.Cell>
            <Table.Cell>{qual.grupo}</Table.Cell>
            <Table.Cell>
              <HStack spacing={2} align="center">
                <CreateQualModal
                  qualification={qual}
                  setQualifications={setQualifications}
                  edit={true}
                />
                <DeleteQualModal
                  qual={qual}
                  setQualifications={setQualifications}
                />
              </HStack>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
