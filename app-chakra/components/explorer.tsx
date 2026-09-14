"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Moon, MoreHorizontal, RotateCcw, Search, Sun } from "lucide-react";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuGroup,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";

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

const STATUS_SCHEME: Record<Character["status"], string> = {
  Alive: "green",
  Dead: "red",
  unknown: "gray",
};

function ThemeSwitch() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <HStack spacing={2}>
      <Box as={Sun} boxSize={4} color="gray.500" />
      <Switch
        aria-label="Alternar tema"
        isChecked={colorMode === "dark"}
        onChange={toggleColorMode}
      />
      <Box as={Moon} boxSize={4} color="gray.500" />
    </HStack>
  );
}

function CardSkeleton() {
  return (
    <Card overflow="hidden" variant="outline">
      <Skeleton height="176px" />
      <CardHeader pb={2}>
        <Skeleton height="20px" width="75%" mb={2} />
        <Skeleton height="16px" width="50%" />
      </CardHeader>
      <CardFooter gap={2}>
        <Skeleton height="36px" width="96px" />
        <Skeleton height="36px" width="36px" />
      </CardFooter>
    </Card>
  );
}

export function Explorer({ initial }: { initial: ApiResponse }) {
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<ApiResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Character | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const first = useRef(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const muted = useColorModeValue("gray.600", "gray.400");

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
    toast({
      title: isFav ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: character.name,
      status: isFav ? "info" : "success",
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  }

  function openDetails(character: Character) {
    setSelected(character);
    onOpen();
  }

  function reset() {
    setSearch("");
    setFilters(INITIAL_FILTERS);
    toast({ title: "Filtros limpos", status: "info", duration: 3000, position: "top-right" });
  }

  return (
    <Container as="main" maxW="6xl" px={4} py={8}>
      <Flex wrap="wrap" align="flex-start" justify="space-between" gap={4}>
        <Stack spacing={1}>
          <HStack spacing={2}>
            <Heading as="h1" size="lg" letterSpacing="tight">
              Multiverso UI
            </Heading>
            <Badge colorScheme="gray" variant="subtle" borderRadius="md" px={2} py={1}>
              Chakra UI v2
            </Badge>
          </HStack>
          <Text fontSize="sm" color={muted}>
            Mesmo app, duas bibliotecas de UI. Dados da Rick and Morty API.
          </Text>
        </Stack>
        <ThemeSwitch />
      </Flex>

      <Divider my={6} />

      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
        <Box gridColumn={{ lg: "span 2" }}>
          <FormControl>
            <FormLabel htmlFor="search" fontSize="sm">
              Buscar por nome
            </FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Box as={Search} boxSize={4} color="gray.500" />
              </InputLeftElement>
              <Input
                id="search"
                placeholder="Rick, Morty, Summer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </InputGroup>
          </FormControl>
        </Box>
        <FormControl>
          <FormLabel htmlFor="status" fontSize="sm">
            Status
          </FormLabel>
          <Select
            id="status"
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
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="gender" fontSize="sm">
            Genero
          </FormLabel>
          <Select
            id="gender"
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
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid mt={6} columns={{ base: 1, sm: 3 }} spacing={4}>
        <Card variant="outline">
          <CardHeader pb={2}>
            <Text fontSize="sm" color={muted}>
              Resultados
            </Text>
            <Heading size="lg" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {data.info.count}
            </Heading>
          </CardHeader>
        </Card>
        <Card variant="outline">
          <CardHeader pb={2}>
            <Text fontSize="sm" color={muted}>
              Pagina
            </Text>
            <Heading size="lg" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {filters.page}
              <Text as="span" fontSize="md" fontWeight="normal" color={muted}>
                {" "}
                / {pages}
              </Text>
            </Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Progress value={progress} size="sm" borderRadius="full" />
          </CardBody>
        </Card>
        <Card variant="outline">
          <CardHeader pb={2}>
            <Text fontSize="sm" color={muted}>
              Favoritos
            </Text>
            <Heading size="lg" sx={{ fontVariantNumeric: "tabular-nums" }}>
              {favorites.length}
            </Heading>
          </CardHeader>
          <CardBody pt={2}>
            <Button size="sm" variant="outline" leftIcon={<Box as={RotateCcw} boxSize={4} />} onClick={reset}>
              Limpar filtros
            </Button>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs mt={8} variant="soft-rounded" colorScheme="gray" isLazy>
        <TabList>
          <Tab>Cards</Tab>
          <Tab>Tabela</Tab>
          <Tab>Sobre</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0} pt={4}>
            {loading ? (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                {Array.from({ length: 8 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))}
              </SimpleGrid>
            ) : characters.length === 0 ? (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Nenhum personagem encontrado</AlertTitle>
                  <AlertDescription>Ajuste os filtros e tente novamente.</AlertDescription>
                </Box>
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                {characters.map((character) => (
                  <Card key={character.id} variant="outline" overflow="hidden">
                    <Box position="relative" height="176px" width="100%">
                      <Image
                        src={character.image}
                        alt={character.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    </Box>
                    <CardHeader pb={2}>
                      <Heading size="sm" noOfLines={1}>
                        {character.name}
                      </Heading>
                      <Text fontSize="sm" color={muted} noOfLines={1}>
                        {character.species} · {character.origin.name}
                      </Text>
                      <HStack spacing={1} pt={2} wrap="wrap">
                        <Badge colorScheme={STATUS_SCHEME[character.status]} variant="subtle">
                          {character.status}
                        </Badge>
                        <Badge colorScheme="gray" variant="subtle">
                          {character.gender}
                        </Badge>
                      </HStack>
                    </CardHeader>
                    <CardFooter gap={2} pt={0}>
                      <Button size="sm" colorScheme="gray" flex="1" onClick={() => openDetails(character)}>
                        Detalhes
                      </Button>
                      <Tooltip label="Favoritar">
                        <IconButton
                          size="sm"
                          aria-label="Favoritar"
                          variant={favorites.includes(character.id) ? "solid" : "outline"}
                          colorScheme="gray"
                          icon={<Box as={Heart} boxSize={4} />}
                          onClick={() => toggleFavorite(character)}
                        />
                      </Tooltip>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          size="sm"
                          variant="ghost"
                          aria-label="Acoes"
                          icon={<Box as={MoreHorizontal} boxSize={4} />}
                        />
                        <MenuList>
                          <MenuGroup title={character.name}>
                            <MenuDivider />
                            <MenuItem onClick={() => openDetails(character)}>Ver detalhes</MenuItem>
                            <MenuItem onClick={() => toggleFavorite(character)}>Favoritar</MenuItem>
                            <MenuItem
                              onClick={() =>
                                toast({
                                  title: "Local",
                                  description: character.location.name,
                                  duration: 3000,
                                  position: "top-right",
                                })
                              }
                            >
                              Mostrar local
                            </MenuItem>
                          </MenuGroup>
                        </MenuList>
                      </Menu>
                    </CardFooter>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <Card variant="outline">
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th width="64px">#</Th>
                      <Th>Personagem</Th>
                      <Th>Status</Th>
                      <Th>Especie</Th>
                      <Th isNumeric>Episodios</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loading
                      ? Array.from({ length: 6 }).map((_, index) => (
                          <Tr key={index}>
                            <Td colSpan={5}>
                              <Skeleton height="24px" />
                            </Td>
                          </Tr>
                        ))
                      : characters.map((character) => (
                          <Tr key={character.id}>
                            <Td color={muted}>{character.id}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <Avatar size="sm" name={character.name} src={character.image} />
                                <Text fontWeight="medium">{character.name}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={STATUS_SCHEME[character.status]} variant="subtle">
                                {character.status}
                              </Badge>
                            </Td>
                            <Td color={muted}>{character.species}</Td>
                            <Td isNumeric>{character.episode.length}</Td>
                          </Tr>
                        ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Card>
          </TabPanel>

          <TabPanel px={0} pt={4}>
            <Stack spacing={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Projeto de benchmark</AlertTitle>
                  <AlertDescription>
                    Esta versao usa Chakra UI v2 com Emotion. Os componentes vem do pacote npm e sao
                    customizados via theme tokens.
                  </AlertDescription>
                </Box>
              </Alert>
              <Accordion allowToggle>
                {FAQ.map((item) => (
                  <AccordionItem key={item.q}>
                    <AccordionButton>
                      <Box as="span" flex="1" textAlign="left" fontWeight="medium">
                        {item.q}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4} color={muted}>
                      {item.a}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </Stack>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Flex mt={8} align="center" justify="space-between">
        <Button
          variant="outline"
          isDisabled={filters.page <= 1 || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
        >
          Anterior
        </Button>
        <Text fontSize="sm" color={muted} sx={{ fontVariantNumeric: "tabular-nums" }}>
          {filters.page} de {pages}
        </Text>
        <Button
          variant="outline"
          isDisabled={filters.page >= pages || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
        >
          Proxima
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW="md">
          <ModalHeader>
            <Heading size="md">{selected?.name}</Heading>
            <Text fontSize="sm" fontWeight="normal" color={muted}>
              {selected?.species} · {selected?.gender}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selected ? (
              <Stack spacing={4}>
                <HStack spacing={4}>
                  <Avatar size="lg" name={selected.name} src={selected.image} />
                  <Stack spacing={1}>
                    <Badge colorScheme={STATUS_SCHEME[selected.status]} variant="subtle" width="fit-content">
                      {selected.status}
                    </Badge>
                    <Text fontSize="sm" color={muted}>
                      {selected.episode.length} episodios
                    </Text>
                  </Stack>
                </HStack>
                <Divider />
                <SimpleGrid columns={2} spacing={3} fontSize="sm">
                  <Box>
                    <Text color={muted}>Origem</Text>
                    <Text fontWeight="medium">{selected.origin.name}</Text>
                  </Box>
                  <Box>
                    <Text color={muted}>Localizacao</Text>
                    <Text fontWeight="medium">{selected.location.name}</Text>
                  </Box>
                </SimpleGrid>
                <Button
                  width="100%"
                  colorScheme="gray"
                  leftIcon={<Box as={Heart} boxSize={4} />}
                  onClick={() => toggleFavorite(selected)}
                >
                  {favorites.includes(selected.id) ? "Remover dos favoritos" : "Favoritar"}
                </Button>
              </Stack>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
