export type Character = {
  id: number;
  name: string;
  status: "Alive" | "Dead" | "unknown";
  species: string;
  type: string;
  gender: string;
  origin: { name: string };
  location: { name: string };
  image: string;
  episode: string[];
  created: string;
};

export type ApiInfo = { count: number; pages: number; next: string | null; prev: string | null };
export type ApiResponse = { info: ApiInfo; results: Character[] };

export type Filters = { name: string; status: string; gender: string; page: number };

export const EMPTY_RESPONSE: ApiResponse = {
  info: { count: 0, pages: 0, next: null, prev: null },
  results: [],
};

export function buildUrl({ name, status, gender, page }: Filters) {
  const params = new URLSearchParams({ page: String(page) });
  if (name) params.set("name", name);
  if (status) params.set("status", status);
  if (gender) params.set("gender", gender);
  return `https://rickandmortyapi.com/api/character?${params.toString()}`;
}

export async function fetchCharacters(filters: Filters): Promise<ApiResponse> {
  try {
    const res = await fetch(buildUrl(filters), { cache: "no-store" });
    if (!res.ok) return EMPTY_RESPONSE;
    return (await res.json()) as ApiResponse;
  } catch {
    return EMPTY_RESPONSE;
  }
}

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "alive", label: "Vivo" },
  { value: "dead", label: "Morto" },
  { value: "unknown", label: "Desconhecido" },
];

export const GENDER_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
  { value: "genderless", label: "Sem genero" },
  { value: "unknown", label: "Desconhecido" },
];

export const FAQ = [
  {
    q: "De onde vem os dados?",
    a: "Da Rick and Morty API publica (rickandmortyapi.com), sem autenticacao. A primeira pagina e buscada no servidor (RSC) e a navegacao seguinte acontece no cliente.",
  },
  {
    q: "Os dois apps sao identicos?",
    a: "Sim. Mesma estrutura de rotas, mesmos dados, mesmos estados de carregamento e mesma hierarquia de componentes. So muda a biblioteca de UI.",
  },
  {
    q: "Como a comparacao foi medida?",
    a: "next build com Turbopack, tamanho de node_modules via du, First Load JS do relatorio de build e Lighthouse em modo producao.",
  },
];

export function statusTone(status: Character["status"]) {
  if (status === "Alive") return "alive" as const;
  if (status === "Dead") return "dead" as const;
  return "unknown" as const;
}
