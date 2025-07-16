import React from "react";
import {
  Stack,
  Card,
  Flex,
  CardHeader,
  Text,
  Heading,
  Divider,
  CardBody,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useBreakpointValue,
  Box,
} from "@chakra-ui/react";
const TableQ = ({ data }) => {
  return (
    <TableContainer
      borderWidth="1px"
      borderRadius="md"
      overflow="hidden"
      maxWidth={"max-content"}
    >
      <Table>
        <Thead>
          <Tr>
            <Th>Nome</Th>
            <Th>QA1</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item, index) => (
            <Tr key={index}>
              <Td>{item.name}</Td>
              <Td>{item.value}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default TableQ;
