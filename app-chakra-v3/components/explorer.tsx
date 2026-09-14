"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Moon, MoreHorizontal, RotateCcw, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Accordion,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Field,
  Flex,
  HStack,
  Heading,
  Input,
  InputGroup,
  Menu,
  Portal,
  Progress,
  Separator,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";

import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
} from "@/components/ui/dialog";
import { NativeSelectField, NativeSelectRoot } from "@/components/ui/native-select";
import { toaster } from "@/components/ui/toaster";

import {
  type ApiResponse,
  type Character,
  type Filters,
  FAQ,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
  fetchCharacters,
} from "@/lib/api";

const INITIAL_FILTERS: Filters = { name: "", status: "", gender: "", page: 1 };

const STATUS_PALETTE: Record<Character["status"], string> = {
  Alive: "green",
  Dead: "red",
  unknown: "gray",
};

function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <HStack gap={2}>
      <Sun size={16} color="var(--chakra-colors-fg-muted)" />
      <Switch.Root
        checked={dark}
        onCheckedChange={(details) => setTheme(details.checked ? "dark" : "light")}
        aria-label="Alternar tema"
      >
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
      <Moon size={16} color="var(--chakra-colors-fg-muted)" />
    </HStack>
  );
}

function CardSkeleton() {
  return (
    <Card.Root overflow="hidden" variant="outline">
      <Skeleton height="176px" />
      <Card.Header pb={2}>
        <Skeleton height="20px" width="75%" mb={2} />
        <Skeleton height="16px" width="50%" />
      </Card.Header>
      <Card.Footer gap={2}>
        <Skeleton height="36px" width="96px" />
        <Skeleton height="36px" width="36px" />
      </Card.Footer>
    </Card.Root>
  );
}

export function Explorer({ initial }: { initial: ApiResponse }) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ApiResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const first = useRef(true);
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.name === search ? prev : { ...prev, name: search, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let active = true;
    setLoading(true);
    fetchCharacters(filters).then((res) => {
      if (!active) return;
      setData(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [filters]);

  const characters = data.results;
  const pages = data.info.pages || 1;
  const progress = useMemo(() => Math.round((filters.page / pages) * 100), [filters.page, pages]);

  function toggleFavorite(character: Character) {
    const isFav = favorites.includes(character.id);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== character.id) : [...prev, character.id]));
    toaster.create({
      title: isFav ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: character.name,
      type: isFav ? "info" : "success",
      duration: 3000,
    });
  }

  function openDetails(character: Character) {
    setSelected(character);
    setDialogOpen(true);
  }

  function reset() {
    setSearch("");
    setFilters(INITIAL_FILTERS);
    toaster.create({ title: "Filtros limpos", type: "info", duration: 3000 });
  }

  return (
    <Container as="main" maxW="6xl" px={4} py={8}>
      <Flex wrap="wrap" align="flex-start" justify="space-between" gap={4}>
        <Stack gap={1}>
          <HStack gap={2}>
            <Heading as="h1" size="lg" letterSpacing="tight">
              Multiverso UI
            </Heading>
            <Badge colorPalette="gray" variant="subtle" borderRadius="md" px={2} py={1}>
              Chakra UI v3
            </Badge>
          </HStack>
          <Text fontSize="sm" color="fg.muted">
            Mesmo app, tres bibliotecas de UI. Dados da Rick and Morty API.
          </Text>
        </Stack>
        <ThemeSwitch />
      </Flex>

      <Separator my={6} />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
        <Box gridColumn={{ lg: "span 2" }}>
          <Field.Root>
            <Field.Label fontSize="sm">Buscar por nome</Field.Label>
            <InputGroup startElement={<Search size={16} color="var(--chakra-colors-fg-muted)" />}>
              <Input
                placeholder="Rick, Morty, Summer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
          </Field.Root>
        </Box>
        <Field.Root>
          <Field.Label fontSize="sm">Status</Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              value={filters.status || "all"}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value === "all" ? "" : event.target.value,
                  page: 1,
                }))
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
        <Field.Root>
          <Field.Label fontSize="sm">Genero</Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              value={filters.gender || "all"}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  gender: event.target.value === "all" ? "" : event.target.value,
                  page: 1,
                }))
              }
            >
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>
      </SimpleGrid>

      <SimpleGrid mt={6} columns={{ base: 1, sm: 3 }} gap={4}>
        <Card.Root variant="outline">
          <Card.Header pb={2}>
            <Text fontSize="sm" color="fg.muted">
              Resultados
            </Text>
            <Heading size="lg" css={{ fontVariantNumeric: "tabular-nums" }}>
              {data.info.count}
            </Heading>
          </Card.Header>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Header pb={2}>
            <Text fontSize="sm" color="fg.muted">
              Pagina
            </Text>
            <Heading size="lg" css={{ fontVariantNumeric: "tabular-nums" }}>
              {filters.page}
              <Text as="span" fontSize="md" fontWeight="normal" color="fg.muted">
                {" "}
                / {pages}
              </Text>
            </Heading>
          </Card.Header>
          <Card.Body pt={2}>
            <Progress.Root value={progress} size="sm" borderRadius="full">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
          </Card.Body>
        </Card.Root>
        <Card.Root variant="outline">
          <Card.Header pb={2}>
            <Text fontSize="sm" color="fg.muted">
              Favoritos
            </Text>
            <Heading size="lg" css={{ fontVariantNumeric: "tabular-nums" }}>
              {favorites.length}
            </Heading>
          </Card.Header>
          <Card.Body pt={2}>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw size={16} />
              Limpar filtros
            </Button>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <Tabs.Root defaultValue="grid" mt={8} variant="enclosed" lazyMount unmountOnExit>
        <Tabs.List>
          <Tabs.Trigger value="grid">Cards</Tabs.Trigger>
          <Tabs.Trigger value="table">Tabela</Tabs.Trigger>
          <Tabs.Trigger value="about">Sobre</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="grid" pt={4} px={0}>
          {loading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
              {Array.from({ length: 8 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </SimpleGrid>
          ) : characters.length === 0 ? (
            <Box borderWidth="1px" borderRadius="md" p={4} bg="orange.subtle">
              <Text fontWeight="semibold">Nenhum personagem encontrado</Text>
              <Text fontSize="sm" color="fg.muted">
                Ajuste os filtros e tente novamente.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
              {characters.map((character) => (
                <Card.Root key={character.id} variant="outline" overflow="hidden">
                  <Box position="relative" height="176px" width="100%">
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  </Box>
                  <Card.Header pb={2}>
                    <Heading size="sm" lineClamp={1}>
                      {character.name}
                    </Heading>
                    <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                      {character.species} · {character.origin.name}
                    </Text>
                    <HStack gap={1} pt={2} wrap="wrap">
                      <Badge colorPalette={STATUS_PALETTE[character.status]} variant="subtle">
                        {character.status}
                      </Badge>
                      <Badge colorPalette="gray" variant="subtle">
                        {character.gender}
                      </Badge>
                    </HStack>
                  </Card.Header>
                  <Card.Footer gap={2} pt={0}>
                    <Button size="sm" colorPalette="gray" flex="1" onClick={() => openDetails(character)}>
                      Detalhes
                    </Button>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Button
                          size="sm"
                          aria-label="Favoritar"
                          variant={favorites.includes(character.id) ? "solid" : "outline"}
                          colorPalette="gray"
                          onClick={() => toggleFavorite(character)}
                        >
                          <Heart size={16} />
                        </Button>
                      </Tooltip.Trigger>
                      <Portal>
                        <Tooltip.Positioner>
                          <Tooltip.Content>Favoritar</Tooltip.Content>
                        </Tooltip.Positioner>
                      </Portal>
                    </Tooltip.Root>
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <Button size="sm" variant="ghost" aria-label="Acoes">
                          <MoreHorizontal size={16} />
                        </Button>
                      </Menu.Trigger>
                      <Portal>
                        <Menu.Positioner>
                          <Menu.Content>
                            <Menu.ItemGroup>
                              <Menu.ItemGroupLabel>{character.name}</Menu.ItemGroupLabel>
                              <Menu.Separator />
                              <Menu.Item value="details" onClick={() => openDetails(character)}>
                                Ver detalhes
                              </Menu.Item>
                              <Menu.Item value="favorite" onClick={() => toggleFavorite(character)}>
                                Favoritar
                              </Menu.Item>
                              <Menu.Item
                                value="location"
                                onClick={() =>
                                  toaster.create({ title: "Local", description: character.location.name, duration: 3000 })
                                }
                              >
                                Mostrar local
                              </Menu.Item>
                            </Menu.ItemGroup>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Card.Footer>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Content>

        <Tabs.Content value="table" pt={4} px={0}>
          <Card.Root variant="outline">
            <Table.ScrollArea>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader width="64px">#</Table.ColumnHeader>
                    <Table.ColumnHeader>Personagem</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Especie</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Episodios</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {loading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <Table.Row key={index}>
                          <Table.Cell colSpan={5}>
                            <Skeleton height="24px" />
                          </Table.Cell>
                        </Table.Row>
                      ))
                    : characters.map((character) => (
                        <Table.Row key={character.id}>
                          <Table.Cell color="fg.muted">{character.id}</Table.Cell>
                          <Table.Cell>
                            <HStack gap={2}>
                              <Avatar.Root size="sm">
                                <Avatar.Image src={character.image} alt={character.name} />
                                <Avatar.Fallback name={character.name} />
                              </Avatar.Root>
                              <Text fontWeight="medium">{character.name}</Text>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={STATUS_PALETTE[character.status]} variant="subtle">
                              {character.status}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell color="fg.muted">{character.species}</Table.Cell>
                          <Table.Cell textAlign="end">{character.episode.length}</Table.Cell>
                        </Table.Row>
                      ))}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
          </Card.Root>
        </Tabs.Content>

        <Tabs.Content value="about" pt={4} px={0}>
          <Stack gap={4}>
            <Box borderWidth="1px" borderRadius="md" p={4} bg="blue.subtle">
              <Text fontWeight="semibold">Projeto de benchmark</Text>
              <Text fontSize="sm" color="fg.muted">
                Esta versao usa Chakra UI v3, reescrito sobre Ark UI (Zag.js) — a mesma camada headless que
                inspirou boa parte do desenho do Radix. O sistema de estilo trocou Emotion runtime por tokens
                estaticos gerados em build (like Panda CSS).
              </Text>
            </Box>
            <Accordion.Root collapsible>
              {FAQ.map((item) => (
                <Accordion.Item key={item.q} value={item.q}>
                  <Accordion.ItemTrigger>
                    <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                      {item.q}
                    </Box>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody pb={4} color="fg.muted">
                      {item.a}
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Stack>
        </Tabs.Content>
      </Tabs.Root>

      <Flex mt={8} align="center" justify="space-between">
        <Button
          variant="outline"
          disabled={filters.page <= 1 || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
        >
          Anterior
        </Button>
        <Text fontSize="sm" color="fg.muted" css={{ fontVariantNumeric: "tabular-nums" }}>
          {filters.page} de {pages}
        </Text>
        <Button
          variant="outline"
          disabled={filters.page >= pages || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
        >
          Proxima
        </Button>
      </Flex>

      <DialogRoot
        open={dialogOpen}
        onOpenChange={(details) => setDialogOpen(details.open)}
        placement="center"
        size={isMobile ? "full" : "md"}
      >
        <DialogContent>
          <DialogCloseTrigger />
          <DialogHeader>
            <Heading size="md">{selected?.name}</Heading>
            <Text fontSize="sm" fontWeight="normal" color="fg.muted">
              {selected?.species} · {selected?.gender}
            </Text>
          </DialogHeader>
          <DialogBody pb={6}>
            {selected ? (
              <Stack gap={4}>
                <HStack gap={4}>
                  <Avatar.Root size="lg">
                    <Avatar.Image src={selected.image} alt={selected.name} />
                    <Avatar.Fallback name={selected.name} />
                  </Avatar.Root>
                  <Stack gap={1}>
                    <Badge colorPalette={STATUS_PALETTE[selected.status]} variant="subtle" width="fit-content">
                      {selected.status}
                    </Badge>
                    <Text fontSize="sm" color="fg.muted">
                      {selected.episode.length} episodios
                    </Text>
                  </Stack>
                </HStack>
                <Separator />
                <SimpleGrid columns={2} gap={3} fontSize="sm">
                  <Box>
                    <Text color="fg.muted">Origem</Text>
                    <Text fontWeight="medium">{selected.origin.name}</Text>
                  </Box>
                  <Box>
                    <Text color="fg.muted">Localizacao</Text>
                    <Text fontWeight="medium">{selected.location.name}</Text>
                  </Box>
                </SimpleGrid>
                <Button width="100%" colorPalette="gray" onClick={() => toggleFavorite(selected)}>
                  <Heart size={16} />
                  {favorites.includes(selected.id) ? "Remover dos favoritos" : "Favoritar"}
                </Button>
              </Stack>
            ) : null}
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </Container>
  );
}
