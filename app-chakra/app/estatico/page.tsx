"use client";

// Chakra UI v2 depende de React Context + Emotion em tempo de execucao.
// Mesmo sem estado ou eventos, esta pagina precisa ser um Client Component.

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  HStack,
  Heading,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";

import { FAQ } from "@/lib/api";

const ROWS = [
  { id: 1, metric: "First Load JS", note: "JS baixado antes da interacao" },
  { id: 2, metric: "node_modules", note: "Peso do diretorio de dependencias" },
  { id: 3, metric: "Build", note: "Tempo de next build com Turbopack" },
];

export default function StaticPage() {
  const muted = useColorModeValue("gray.600", "gray.400");

  return (
    <Container as="main" maxW="3xl" px={4} py={10}>
      <HStack spacing={2}>
        <Heading as="h1" size="lg" letterSpacing="tight">
          Pagina 100% estatica
        </Heading>
        <Badge colorScheme="gray" variant="subtle" borderRadius="md" px={2} py={1}>
          Client Component
        </Badge>
      </HStack>
      <Text mt={2} fontSize="sm" color={muted}>
        Sem estado e sem eventos, mas ainda assim marcada com &quot;use client&quot;. Serve para medir o piso de
        JavaScript de cada biblioteca.
      </Text>

      <Divider my={6} />

      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Por que esta rota existe</AlertTitle>
          <AlertDescription>
            Componentes shadcn/ui puramente visuais rodam como Server Components. Chakra UI v2 depende de Context
            e Emotion, entao a mesma rota precisa virar Client Component.
          </AlertDescription>
        </Box>
      </Alert>

      <Card mt={6} variant="outline">
        <CardHeader>
          <Heading size="md">Metricas comparadas</Heading>
          <Text fontSize="sm" color={muted}>
            Os tres eixos do benchmark
          </Text>
        </CardHeader>
        <CardBody pt={0}>
          <TableContainer>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th width="64px">#</Th>
                  <Th>Metrica</Th>
                  <Th>Descricao</Th>
                </Tr>
              </Thead>
              <Tbody>
                {ROWS.map((row) => (
                  <Tr key={row.id}>
                    <Td color={muted}>{row.id}</Td>
                    <Td fontWeight="medium">{row.metric}</Td>
                    <Td color={muted}>{row.note}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>

      <Stack mt={6} spacing={4}>
        {FAQ.map((item) => (
          <Card key={item.q} variant="outline">
            <CardHeader pb={2}>
              <Heading size="sm">{item.q}</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Text fontSize="sm" color={muted}>
                {item.a}
              </Text>
            </CardBody>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
