"use client";

// Igual à v2: ChakraProvider depende de Context em runtime, então mesmo
// uma página sem estado e sem eventos precisa ser Client Component.
// A diferença de v3 é que o motor de estilo por trás (Panda-like, tokens
// estáticos) não é mais o motivo — é só a árvore de Context do Provider.

import {
  Accordion,
  Badge,
  Box,
  Card,
  Container,
  HStack,
  Heading,
  Separator,
  Table,
  Text,
} from "@chakra-ui/react";

import { FAQ } from "@/lib/api";

const ROWS = [
  { id: 1, metric: "First Load JS", note: "JS baixado antes da interacao" },
  { id: 2, metric: "node_modules", note: "Peso do diretorio de dependencias" },
  { id: 3, metric: "Build", note: "Tempo de next build com Turbopack" },
];

export default function StaticPage() {
  return (
    <Container as="main" maxW="3xl" px={4} py={10}>
      <HStack gap={2}>
        <Heading as="h1" size="lg" letterSpacing="tight">
          Pagina 100% estatica
        </Heading>
        <Badge colorPalette="gray" variant="subtle" borderRadius="md" px={2} py={1}>
          Client Component
        </Badge>
      </HStack>
      <Text mt={2} fontSize="sm" color="fg.muted">
        Sem estado e sem eventos, mas ainda assim marcada com &quot;use client&quot;. Serve para medir o piso de
        JavaScript de cada biblioteca.
      </Text>

      <Separator my={6} />

      <Box borderWidth="1px" borderRadius="md" p={4} bg="blue.subtle">
        <Text fontWeight="semibold">Por que esta rota existe</Text>
        <Text fontSize="sm" color="fg.muted">
          O Provider da v3 ainda usa Context de tema e de cor. Diferente do shadcn/ui, cuja
          folha de estilo é estatica e nao depende de nenhum provider React.
        </Text>
      </Box>

      <Card.Root mt={6} variant="outline">
        <Card.Header>
          <Heading size="md">Metricas comparadas</Heading>
          <Text fontSize="sm" color="fg.muted">
            Os tres eixos do benchmark
          </Text>
        </Card.Header>
        <Card.Body pt={0}>
          <Table.ScrollArea>
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader width="64px">#</Table.ColumnHeader>
                  <Table.ColumnHeader>Metrica</Table.ColumnHeader>
                  <Table.ColumnHeader>Descricao</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {ROWS.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell color="fg.muted">{row.id}</Table.Cell>
                    <Table.Cell fontWeight="medium">{row.metric}</Table.Cell>
                    <Table.Cell color="fg.muted">{row.note}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </Card.Body>
      </Card.Root>

      <Box mt={6} display="flex" flexDirection="column" gap={4}>
        {FAQ.map((item) => (
          <Card.Root key={item.q} variant="outline">
            <Card.Header pb={2}>
              <Heading size="sm">{item.q}</Heading>
            </Card.Header>
            <Card.Body pt={0}>
              <Text fontSize="sm" color="fg.muted">
                {item.a}
              </Text>
            </Card.Body>
          </Card.Root>
        ))}
      </Box>
    </Container>
  );
}
