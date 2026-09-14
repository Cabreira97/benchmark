# Chakra UI v2 × Chakra UI v3 × shadcn/ui — benchmark comparativo

Três aplicativos **idênticos** em Next.js 16 (App Router + Turbopack), mudando apenas a
biblioteca de interface. Serve para medir bundle, build, peso de dependências, SSR e DX.

```
.
├── app-chakra/       Next 16 + React 19 + Chakra UI v2 (Emotion)
├── app-chakra-v3/    Next 16 + React 19 + Chakra UI v3 (Ark UI / Zag.js)
├── app-shadcn/       Next 16 + React 19 + shadcn/ui (Radix) + Tailwind CSS v4
├── bench/            scripts de medição reproduzível
└── RELATORIO.md      resultado completo com os números
```

## O app

"Multiverso UI" — explorador da [Rick and Morty API](https://rickandmortyapi.com) (pública, sem chave).

Rotas:

| Rota | O que faz |
|---|---|
| `/` | Server Component busca a página 1 na API e entrega para um Client Component que faz busca com debounce, dois filtros, paginação, favoritos e detalhes |
| `/estatico` | Página sem estado nem eventos — mede o piso de JavaScript de cada biblioteca |
| `/tema` | **Só no `app-shadcn`** — demonstra os quatro níveis de customização de tema (tokens, tokens novos, variantes do `cva`, tema por escopo). Fora da comparação: veja a nota no topo do relatório |

Componentes exercitados nos três: Button, Input, Select, Card, Badge, Avatar, Skeleton,
Modal/Dialog, Toast, Tabs, Accordion, Switch (dark mode), Tooltip, Alert, Separator, Label,
Progress, Table, DropdownMenu/Menu.

## Rodando

```bash
cd app-chakra    && npm install && npm run dev   # v2 — http://localhost:3000
cd app-chakra-v3 && npm install && npm run dev   # v3 — http://localhost:3000
cd app-shadcn    && npm install && npm run dev   # http://localhost:3000
```

Produção:

```bash
npm run build && npm run start -- --port 3001
```

## Reproduzindo o benchmark

```bash
bash bench/medir.sh
```

Mede: tamanho de `node_modules` (dev e produção), tempo de build a frio e a quente,
tempo de subida do dev server, bytes de HTML/JS/CSS por rota e TTFB de SSR — para os três apps.

## Resultado em uma linha

shadcn/ui entrega o menor bundle e o build mais rápido dos três. Chakra v2 escreve menos código
de aplicação, mas está congelado (1 release em 12 meses) e tem um *hydration mismatch* sem
correção conhecida. **Chakra v3 não é uma evolução limpa sobre a v2**: moderniza a arquitetura
(Ark UI/Zag.js, igual em espírito ao Radix do shadcn) e larga o `framer-motion`, mas é **mais
pesado em bundle**, o **build a frio dobra de tamanho** (44,7 s × 22,1 s) e a **primeira
compilação de uma rota em dev sobe de ~6 s para ~28-30 s** — o próprio Chakra documenta um
*hydration mismatch* causado pelo Turbopack cuja correção oficial (`next dev --webpack`) está
quebrada no Next.js 16.3.4. Detalhes em [RELATORIO.md](./RELATORIO.md).
