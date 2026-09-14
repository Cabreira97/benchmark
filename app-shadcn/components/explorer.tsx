"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Moon, MoreHorizontal, RotateCcw, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  type ApiResponse,
  type Character,
  type Filters,
  FAQ,
  GENDER_OPTIONS,
  STATUS_OPTIONS,
  fetchCharacters,
} from "@/lib/api";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const INITIAL_FILTERS: Filters = { name: "", status: "", gender: "", page: 1 };

const STATUS_CLASS: Record<Character["status"], string> = {
  Alive: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Dead: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun className="size-4 text-muted-foreground" />
      <Switch
        aria-label="Alternar tema"
        checked={dark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
      <Moon className="size-4 text-muted-foreground" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardFooter className="gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-9" />
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
    toast[isFav ? "info" : "success"](isFav ? "Removido dos favoritos" : "Adicionado aos favoritos", {
      description: character.name,
    });
  }

  function reset() {
    setSearch("");
    setFilters(INITIAL_FILTERS);
    toast.info("Filtros limpos");
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Multiverso UI</h1>
            <Badge variant="secondary">shadcn/ui + Tailwind v4</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Mesmo app, duas bibliotecas de UI. Dados da Rick and Morty API.
          </p>
        </div>
        <ThemeSwitch />
      </header>

      <Separator className="my-6" />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="search">Buscar por nome</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              className="pl-9"
              placeholder="Rick, Morty, Summer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value, page: 1 }))}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Genero</Label>
          <Select
            value={filters.gender || "all"}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, gender: value === "all" ? "" : value, page: 1 }))}
          >
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Genero" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resultados</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{data.info.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagina</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {filters.page}
              <span className="text-base font-normal text-muted-foreground"> / {pages}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Favoritos</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{favorites.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="size-4" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="grid" className="mt-8">
        <TabsList>
          <TabsTrigger value="grid">Cards</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CardSkeleton key={index} />
              ))}
            </div>
          ) : characters.length === 0 ? (
            <Alert>
              <AlertTitle>Nenhum personagem encontrado</AlertTitle>
              <AlertDescription>Ajuste os filtros e tente novamente.</AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {characters.map((character) => (
                <Card key={character.id} className="overflow-hidden pt-0">
                  <div className="relative h-44 w-full">
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="truncate text-base">{character.name}</CardTitle>
                    <CardDescription className="truncate">
                      {character.species} · {character.origin.name}
                    </CardDescription>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <Badge variant="outline" className={STATUS_CLASS[character.status]}>
                        {character.status}
                      </Badge>
                      <Badge variant="secondary">{character.gender}</Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="gap-2">
                    <Button size="sm" className="flex-1" onClick={() => setSelected(character)}>
                      Detalhes
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={favorites.includes(character.id) ? "default" : "outline"}
                          aria-label="Favoritar"
                          onClick={() => toggleFavorite(character)}
                        >
                          <Heart className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Favoritar</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label="Acoes">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{character.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSelected(character)}>Ver detalhes</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFavorite(character)}>Favoritar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.message("Local", { description: character.location.name })}>
                          Mostrar local
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[64px]">#</TableHead>
                    <TableHead>Personagem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Especie</TableHead>
                    <TableHead className="text-right">Episodios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    : characters.map((character) => (
                        <TableRow key={character.id}>
                          <TableCell className="tabular-nums text-muted-foreground">{character.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarImage src={character.image} alt={character.name} />
                                <AvatarFallback>{character.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{character.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={STATUS_CLASS[character.status]}>
                              {character.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{character.species}</TableCell>
                          <TableCell className="text-right tabular-nums">{character.episode.length}</TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4 space-y-4">
          <Alert>
            <AlertTitle>Projeto de benchmark</AlertTitle>
            <AlertDescription>
              Esta versao usa shadcn/ui (Radix UI) com Tailwind CSS v4. O codigo dos componentes vive em
              components/ui e pertence ao projeto.
            </AlertDescription>
          </Alert>
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={filters.page <= 1 || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground tabular-nums">
          {filters.page} de {pages}
        </span>
        <Button
          variant="outline"
          disabled={filters.page >= pages || loading}
          onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
        >
          Proxima
        </Button>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.species} · {selected?.gender}
            </DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src={selected.image} alt={selected.name} />
                  <AvatarFallback>{selected.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Badge variant="outline" className={STATUS_CLASS[selected.status]}>
                    {selected.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{selected.episode.length} episodios</p>
                </div>
              </div>
              <Separator />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Origem</dt>
                  <dd className="font-medium">{selected.origin.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Localizacao</dt>
                  <dd className="font-medium">{selected.location.name}</dd>
                </div>
              </dl>
              <Button className="w-full" onClick={() => toggleFavorite(selected)}>
                <Heart className="size-4" />
                {favorites.includes(selected.id) ? "Remover dos favoritos" : "Favoritar"}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
