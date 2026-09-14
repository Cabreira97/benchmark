# Chakra UI v2 × Chakra UI v3 × shadcn/ui + Tailwind CSS v4 sobre Next.js 16

**Data da medição:** 10-11 de setembro de 2026
**Máquina:** Linux x64, Node.js 22.12.0, npm 10.9.0
**Método:** três apps idênticos (mesmas rotas, mesmos dados, mesma hierarquia de componentes,
mesma fonte, mesmo `next.config.ts`), medidos no mesmo hardware, na mesma sessão.

## Versões usadas

| Pacote | Versão | Publicado em |
|---|---|---|
| `next` | 16.3.4 | — |
| `react` / `react-dom` | 19.2.8 | — |
| `@chakra-ui/react` (linha v2) | **2.10.10** (última da linha 2.x) | 2026-06-04 |
| `@emotion/react` (v2) / `styled` | 11.14.x | — |
| `framer-motion` (v2) | 11.18.2 (fixada — ver atrito) | — |
| `@chakra-ui/react` (linha v3) | **3.37.0** (última) | 2026-08-28 |
| `@ark-ui/react` (motor headless da v3) | 5.39.0 | — |
| `@chakra-ui/cli` | 3.37.0 | — |
| `tailwindcss` | 4.3.3 | 2026-07-16 |
| `radix-ui` | 1.6.7 | 2026-07-24 |
| `shadcn` (CLI) | 4.21.0 | 2026-09-04 |
| `lucide-react` | 1.44.0 / 1.45.0 (usada nos três) | 2026-09-10 |

---

## 1. Resumo executivo

> **Nota sobre a rota `/tema`.** Depois de fechadas as medições, o `app-shadcn` ganhou uma rota de
> demonstração de temas (`/tema`), ausente nos apps Chakra. Ela acrescenta tokens novos ao
> `globals.css` e duas variantes ao `Button`, o que mexe nos arquivos compartilhados. Impacto medido
> na rota `/`: CSS 12,3 → **14,1 KB** gzip, JS 212,2 → **216,5 KB** gzip, HTML 10,8 → **10,9 KB**.
> Total 235,3 → **241,5 KB** (+2,6 %). Nenhuma conclusão muda. Todos os números das tabelas abaixo são
> os da comparação com os três apps ainda idênticos — rode `bench/medir.sh` para os valores atuais.

O resultado central deste levantamento é o menos intuitivo dos três: **a v3 não é uma evolução
limpa sobre a v2**. Ela moderniza a arquitetura por baixo — troca a mistura bespoke +
`framer-motion` por Ark UI/Zag.js, a mesma família de máquinas de estado headless que inspirou o
desenho do Radix — e resolve o problema de DX mais grosseiro da v2 (`extendTheme()` client-only
quebrando o build). Mas em **todo eixo de performance mensurável — bundle, build, dev, TTFB — a v3
é igual ou pior que a v2**, e carrega dois atritos novos que a v2 não tinha: um *hydration
mismatch* cuja correção oficial está quebrada na versão do Next usada aqui, e uma dependência de
84 MB (`react-icons`) puxada silenciosamente pelos snippets do CLI.

| Eixo | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| Total gzip rota `/` | 287,8 KB | **298,2 KB** (pior) | **235,3 KB** (melhor) |
| Total gzip rota `/estatico` | 230,5 KB | 230,8 KB | **189,2 KB** (melhor) |
| Nós no DOM em `/` | 731 | **557** (melhor que v2) | **487** (melhor de todos) |
| TTFB de SSR (`/`) | 298 ms | **148 ms** (melhor que v2) | **179 ms** |
| `next build` a frio | 22,1 s | **44,7 s** (2× pior) | **16,5 s** (melhor) |
| 1ª compilação de `/` em dev | 6,44 s | **~29 s** (4-5× pior) | **4,93 s** (melhor) |
| `node_modules` produção (como o instalador deixa) | 469,5 MB | 559,2 MB | 527,8 MB |
| `node_modules` produção (corrigido) | 469,5 MB | **475,0 MB** | **456,3 MB** (melhor) |
| Lighthouse acessibilidade | 97 | **100** (melhor de todos) | 93 |
| Lighthouse boas práticas | 96 | 96 | **100** (melhor) |
| *Hydration mismatch* | sim, sem correção | sim, correção oficial quebrada no Next 16 | não |
| Releases nos últimos 12 meses | 1 | 14 | 62 (CLI) |
| `framer-motion` como dependência | sim (peer mal resolvido) | **não** (removida) | não |

Leitura: se o objetivo é **performance de bundle e build**, shadcn vence com folga em ambas as
versões do Chakra. Se o objetivo é **arquitetura e trajetória do projeto**, a v3 é
inequivocamente o alvo certo dentro do ecossistema Chakra — só não espere que a migração pague
por si em bytes ou em segundos de build; ela paga em ter, de novo, um pacote sendo atualizado.

---

## 2. Bundle e payload

Medido no Chrome, produção (`next build` + `next start`), mediana de 6 carregamentos por rota.
Gzip calculado com `gzip -9` sobre os arquivos de `.next/static`.

### Rota `/` (SSR dinâmico, 20 cards, tabela, modal, toast)

| Métrica | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| HTML (raw / gzip) | 171,8 / 17,6 KB | 194,9 / **20,5 KB** | 200,3 / **10,8 KB** |
| CSS embutido dentro do HTML | 49,9 KB | **89,1 KB** (pior) | 0 KB |
| JS (raw / gzip) | 868,6 / 269,2 KB | 969,4 / **276,7 KB** | 709,3 / **212,2 KB** |
| Chunks JS | 10 | 10 | 8 |
| CSS externo (raw / gzip) | 3,6 / 1,0 KB | 3,6 / 1,0 KB | 71,1 / 12,3 KB |
| **Total gzip (HTML + JS + CSS)** | **287,8 KB** | **298,2 KB** | **235,3 KB** |

A v3 piora dois números que deveriam ter melhorado: o HTML fica **mais pesado** (20,5 × 17,6 KB) e
o **CSS embutido quase dobra** (89,1 × 49,9 KB). O motor de estilo mudou de "Emotion puro" para
"tokens estáticos + Emotion ainda injetando CSS global e por-instância em runtime" — o
`EmotionGlobal` aparece **duas vezes** na árvore renderizada (ver atrito nº 2), e cada componente
Ark UI ainda gera classes atômicas via Emotion no servidor. A promessa de "CSS-in-JS
zero-runtime" da v3 não se confirma neste benchmark.

### Rota `/estatico` (sem estado, sem eventos)

| Métrica | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| HTML (raw / gzip) | 39,6 / 9,2 KB | 69,1 / **12,0 KB** | 27,1 / **5,1 KB** |
| CSS embutido no HTML | 25,1 KB | **54,6 KB** | 0 KB |
| JS (raw / gzip) | 719,4 / 220,3 KB | 768,1 / **217,8 KB** | 566,4 / **171,8 KB** |
| **Total gzip** | **230,5 KB** | **230,8 KB** | **189,2 KB** |

Praticamente empate entre v2 e v3 no total — a v3 leva um pouco mais de JS mas um pouco menos
(compensa no HTML mais pesado). As duas versões do Chakra continuam **22 % mais pesadas** que o
shadcn nesta rota.

> O Tailwind produz um **arquivo externo de 71 KB** (12,3 KB gzip), pago uma vez e cacheado para
> todas as rotas. As duas versões do Chakra empurram o CSS **dentro do HTML de cada resposta**
> — a v3 empurra quase o dobro da v2. Esse custo nunca é cacheável.

### DOM e estilos em runtime

| Métrica | Rota | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---|---:|---:|---:|
| Nós no DOM | `/` | 731 | **557** | **487** |
| Nós no DOM | `/estatico` | 119 | **106** | **75** |
| Tags `<style>` no documento | `/` | 61 | **56** | 1 |
| Tags `<style>` no documento | `/estatico` | 29 | **27** | 1 |

A v3 melhora o DOM sobre a v2 (usei `lazyMount unmountOnExit` nas Tabs desde o início, aplicando a
lição do atrito nº 3 da v2 — ver §5), mas continua muito atrás do shadcn nas tags `<style>`: o
Emotion segue criando uma tag por grupo de regras, versão v2 ou v3.

---

## 3. Performance de carregamento e SSR

Mediana de 6 execuções (navegador) e 12 amostras (`curl`). As três rotas `/` fazem exatamente a
mesma chamada à API externa, então o delta de TTFB é atribuível ao trabalho de renderização.

| Métrica | Rota | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---|---:|---:|---:|
| TTFB do servidor (`curl`, mediana de 12) | `/` | 298 ms | **148 ms** | 179 ms |
| TTFB do servidor | `/estatico` (pré-renderizada) | 3,8 ms | 6,4 ms | **3,2 ms** |
| DOMContentLoaded | `/` | 425 ms | 521 ms | **424 ms** |
| DOMContentLoaded | `/estatico` | 69,7 ms | 124,3 ms | **50,3 ms** |
| Load event | `/` | 474 ms | 650 ms | **425 ms** |
| Load event | `/estatico` | 80,3 ms | 231,2 ms | **53,9 ms** |
| Requisições (sem imagens em cache) | `/` | 34 | 14 | 32 |

O TTFB de servidor da v3 é o **melhor dos três** em `/` — o SSR em si ficou mais rápido que o da
v2, coerente com abandonar a árvore de `CacheProvider` + `framer-motion` da v2. Mas o tempo até
`load` no navegador é o **pior dos três**: o motor de estilo da v3 (Ark UI + Emotion, com o dobro
de CSS injetado) custa mais no cliente do que economiza no servidor. Em `/estatico` — já
pré-renderizada, sem chamada de API — a v3 é a mais lenta dos três em todas as métricas de
navegador, apesar do menor número de requisições.

### Lighthouse (desktop, modo navigation)

| Categoria | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| Acessibilidade | 97 | **100** | 93 |
| Boas práticas | 96 | 96 | **100** |
| SEO | 100 | 100 | 100 |

A v3 tem a melhor nota de acessibilidade dos três — Ark UI resolve automaticamente rótulos ARIA
que na v2 e no shadcn dependiam do desenvolvedor lembrar (`aria-progressbar-name` passa sem que eu
tenha adicionado nada). Mas perde os mesmos 4 pontos de boas práticas que a v2, pela mesma causa:
um erro de hydration no console (`errors-in-console`), só que com uma assinatura diferente — ver
atrito nº 2.

---

## 4. Peso de dependências

### Instalação completa (com `devDependencies`)

| | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| `node_modules` | 494,3 MB | **~616 MB** (a maior) | 559,1 MB |
| Arquivos | 19.996 | **27.089** | 23.139 |
| Entradas no lockfile | 159 | — | 481 |

### Instalação de produção (`npm ci --omit=dev`) — o que vai para o deploy

| | Como o instalador deixa | Corrigido | O que foi corrigido |
|---|---:|---:|---|
| Chakra UI v2 | 469,5 MB / 19.737 arq. | — | nada a corrigir |
| Chakra UI v3 | 559,2 MB / 24.608 arq. | **475,0 MB** / 24.465 arq. | `react-icons` removido |
| shadcn/ui | 527,8 MB / 22.833 arq. | **456,3 MB** / 15.677 arq. | CLI movido para `devDependencies` |

> **Armadilha do Chakra v3: `react-icons` inteiro por 6 ícones.** Os snippets gerados pelo CLI
> (`color-mode`, `menu`, `close-button`, `toggle-tip`) importam de `react-icons/lu` e
> `react-icons/hi` — seis ícones ao todo (`LuSun`, `LuMoon`, `LuX`, `LuCheck`,
> `LuChevronRight`, `HiOutlineInformationCircle`). Isso é suficiente para o `npm i` colocar o
> pacote **`react-icons` inteiro em `dependencies`: 84,2 MB em disco**, duplicando o
> `lucide-react` que o projeto já usa para seus próprios ícones. O impacto no **bundle do
> navegador é desprezível** (o bundler faz tree-shaking dos imports nomeados — os números de JS
> gzip da §2 já refletem isso), mas o impacto em **`node_modules`, tempo de instalação e tamanho
> de imagem de CI/Docker é real e evitável**: trocar os seis ícones pelos equivalentes do
> `lucide-react` já instalado remove 84,2 MB sem mudar uma linha de UI.
>
> **Armadilha do CLI shadcn:** ver o mesmo padrão na linha de baixo — `shadcn init` grava o
> próprio pacote `shadcn` em `dependencies`, arrastando `@ts-morph/common`,
> `@modelcontextprotocol/sdk`, `zod` e `commander`: **71,5 MB e 7.156 arquivos** desnecessários.
> Mover para `devDependencies` é a única mudança necessária.
>
> Curiosamente a v3 **acerta** onde a v2/shadcn erram noutro ponto: `@chakra-ui/cli` (que traz
> `zod` e `prettier` como dependências transitivas) já nasce em `devDependencies` por padrão —
> só o `react-icons` escapa para produção.

### Peso atribuível a cada stack de UI

Os ~360 MB de `next` + `@next/swc-*` + `sharp` são idênticos nos três e foram descontados.

| Chakra UI v2 | MB | Chakra UI v3 | MB | shadcn/ui | MB |
|---|---:|---|---:|---|---:|
| `@chakra-ui/*` | 2,39 | `@chakra-ui/*` | 2,67 | `radix-ui` + `@radix-ui/*` | 4,17 |
| `@emotion/*` | 1,55 | `@emotion/*` | 1,31 | Tailwind v4 + oxide + lightningcss *(dev)* | 26,43 |
| `framer-motion` + `motion-*` | 2,88 | `@ark-ui/react` + `@zag-js/*` | 9,80 | CLI shadcn *(deve ser dev)* | 23,55 |
| auxiliares (`@zag-js`, `focus-lock`, `popperjs`…) | 2,42 | `react-icons` *(deve trocar por lucide)* | 84,19 | `cn`, `sonner`, `next-themes`, `cva` | 0,54 |
| | | `next-themes`, `csstype`, `@pandacss/*` | 1,25 | | |
| **Total** | **9,24 MB** | **Total (com react-icons)** | **99,22 MB** | **Total (só runtime)** | **4,71 MB** |
| | | **Total (sem react-icons)** | **15,03 MB** | | |

Mesmo descontando `react-icons`, a v3 usa **62 % mais peso em disco** do que a v2 na sua própria
camada de UI (15,03 × 9,24 MB) — o motor Ark UI/Zag.js é mais pesado que o que ele substituiu. Em
runtime puro, o shadcn continua sendo **um terço** do tamanho da v3 e **metade** da v2.

---

## 5. Build e experiência de desenvolvimento

| Métrica | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| `next build` a frio | 22,1 s | **44,7 s** | 16,5 s |
| ↳ só a compilação | 10,8 s | 15,4 s | 7,3 s |
| ↳ checagem de tipos | 6,4 s | **11,6-19,1 s** (variou entre execuções) | 4,3 s |
| `next build` a quente (cache do Turbopack) | 8,2 s | **23,7 s** | 6,9 s |
| `.next/static` | 1,3 MB | 1,4 MB | 1,2 MB |
| `next dev` até "Ready" | 0,87 s | **2,8-3,8 s** | 0,88 s |
| Primeira compilação de `/` em dev | 6,44 s | **~28-30 s** | 4,93 s |
| Primeira compilação de `/estatico` em dev | 0,73 s | 2,5 s | 0,49 s |
| Instalação inicial das deps de UI | 25 s (1 comando) | 34 s (deps) + 47 s (10 snippets do CLI) | 46 s (`init`) + 34 s (`add`) |

**A checagem de tipos da v3 é 2-3× mais lenta que a da v2 e 3-4× mais lenta que a do shadcn.** Os
tipos do Ark UI são fortemente genéricos (cada componente compound tem um `RootProps`,
`ItemProps`, etc. parametrizados), e isso se paga em `tsc`. A primeira compilação de uma rota em
dev sob Turbopack é o número mais chocante do levantamento: **de ~6 s (v2) para quase 30 s (v3)**
— reproduzido duas vezes, com variação de menos de 2 s entre execuções. Depois da primeira
compilação, o cache do Turbopack deixa a v3 tão rápida quanto as outras (0,13 s numa segunda
requisição) — o custo é todo *upfront*, mas é grande o bastante para doer em qualquer loop de
`git pull` → `npm install` → `npm run dev` do dia a dia.

### Código que você escreve e mantém

| | Chakra v2 | Chakra v3 | shadcn/ui |
|---|---:|---:|---:|
| Arquivos `.ts`/`.tsx` no projeto | 7 | 18 (10 snippets do CLI + app) | 26 |
| LOC de aplicação (`explorer.tsx`) | 567 | 556 | 449 |
| Componentes de UI versionados no repo | 0 | **10 snippets, ~450 LOC** | 19 arquivos / 1.561 LOC |
| CSS escrito à mão | 0 (25 linhas de `theme.ts`) | 0 (26 linhas de `system.ts`) | 129 linhas em `globals.css` |

A v3 fica no meio do caminho entre v2 e shadcn nesse eixo: o CLI (`npx @chakra-ui/cli snippet
add`) gera arquivos-fonte editáveis para partes como `dialog.tsx`, `select.tsx`, `color-mode.tsx`
— o mesmo modelo do shadcn, só que menor (dez snippets pequenos contra dezenove componentes) e
opcional (a v3 funciona sem nenhum snippet, usando os componentes de `@chakra-ui/react`
diretamente; a v2 não tinha essa opção de "gerar código" de jeito nenhum).

---

## 6. Atritos reais encontrados (com correções)

### Chakra UI v2

**1. `extendTheme()` é client-only e quebra o build**

```
Error: Attempted to call extendTheme() from the server but extendTheme is on the client.
```

*Correção:* marcar `theme.ts` com `"use client"` e nunca importá-lo de um Server Component.

**2. *Hydration mismatch* estrutural (React #418)**

```
- <body className="chakra-ui-light">
- <style data-emotion="css-global 1515mbm" data-s="">
```

A tag de estilo global do Emotion, inserida via `useServerInsertedHTML`, diverge entre servidor e
cliente com e sem `CacheProvider`, com framer-motion 11 ou 13. **Sem correção conhecida.**

**3. `<Tabs>` renderiza todos os painéis por padrão** — 1.032 nós no DOM, 54 requisições (20
avatares invisíveis carregados fora do otimizador de imagens). *Correção:* `<Tabs isLazy>`.

**4. `framer-motion` resolve para uma major incompatível** — o peer é `>=4.0.0`, então `npm i`
traz a 13.x, três majors à frente da base testada da v2. *Correção:* fixar `framer-motion@^11`.

**5. Props de estilo faltando na tipagem** — `fontVariantNumeric` não existe no tipo de
`<Text>`/`<Heading>`. *Correção:* `sx={{ fontVariantNumeric: "tabular-nums" }}`.

### Chakra UI v3 — dois atritos herdados, dois novos

**1. `createSystem()` parece dado puro, mas não é seguro num Server Component**

Diferente do `extendTheme()` da v2, `createSystem(defaultConfig, config)` não é uma função
marcada `"use client"` — é só JS. A tentação óbvia é importá-la de um Server Component. Isso
quebra, só que com um erro **pior** que o da v2: nenhuma mensagem sobre client/server, e sim um
`TypeError` vindo de dentro do Ark UI:

```
TypeError: bf.accordionAnatomy.extendWith is not a function
    at module evaluation (app/teste-server/page.tsx:6:1)
```

`createSystem()` processa a anatomia de cada componente Ark UI em tempo de import, e essa
inicialização não é segura fora do client bundle. *Correção:* igual à v2 — marcar o arquivo do
sistema com `"use client"` e nunca importá-lo de um Server Component. A diferença é que aqui o
erro não avisa qual é o problema real.

**2. *Hydration mismatch* — e a correção oficial do próprio Chakra está quebrada no Next 16**

Com o setup exatamente como a documentação recomenda (`Provider` gerado pelo CLI, `ChakraProvider`
+ `ColorModeProvider`), toda rota SSR emite:

```
Hydration failed because the server rendered HTML didn't match the client.
+ <script suppressHydrationWarning nonce="" dangerouslySetInnerHTML={{__html:"((e, i, s,..."}}>
- <style data-emotion="css-global ad1llf" data-s="">
```

O script anti-flash do `next-themes` e a tag `<style data-emotion="css-global">` (renderizada
**duas vezes** como `<EmotionGlobal>` na árvore) divergem de posição entre servidor e cliente. A
documentação oficial do Chakra **já cataloga esse exato erro** como causado por Turbopack:

> *"Turbopack Hydration Error [...] it is recommended to use the `--webpack` flag in the
> development and build scripts"* — chakra-ui.com/docs/get-started/frameworks/next-app

Testei a correção recomendada:

```diff
- "dev": "next dev"
- "build": "next build"
+ "dev": "next dev --webpack"
+ "build": "next build --webpack"
```

**Resultado: os dois comandos falham no Next.js 16.3.4.**

```
$ next dev --webpack
Error: Cannot find module 'next/dist/compiled/json5'
# processo encerra, porta não responde mais (curl: connection refused)

$ next build --webpack
Error: Cannot find module 'next/dist/compiled/browserify-zlib'
> Build error occurred
```

Dois módulos internos diferentes faltando em dois comandos diferentes — não é uma falha pontual,
é o caminho de build via Webpack do Next 16.3.4 estando incompleto para esse fallback. **A
correção documentada pelo próprio Chakra UI para o problema mais visível deste benchmark não
funciona na versão do Next.js usada neste benchmark.** Rodando só com Turbopack (a opção que
resta), o *hydration mismatch* fica: console sujo em produção, re-render de subárvore no
cliente, e a nota de boas práticas do Lighthouse cai 4 pontos — os mesmos sintomas da v2, por uma
causa correlata porém distinta.

**3. `react-icons` inteiro por 6 ícones** — ver §4.

**4. Checagem de tipos e primeira compilação em dev muito mais lentas** — ver §5. Não é um erro,
é um custo estrutural dos tipos genéricos do Ark UI.

### shadcn/ui

**1. O CLI se instala como dependência de produção** — ver §4. Mover para `devDependencies`.

**2. `globals.css` gerado com auto-referência** — `--font-sans: var(--font-sans)` dentro de
`@theme inline`, que o Tailwind v4 resolve em tempo de parse e portanto não resolve nada. Use o
nome literal da família.

**3. Nenhum componente de combobox/select com busca** — o `Select` do Radix é uma lista simples.

---

## 7. Comunidade e manutenção

### GitHub (10/09/2026)

| Repositório | Estrelas | Forks | Issues abertas | Commits em 90 dias | Último push |
|---|---:|---:|---:|---:|---|
| `shadcn-ui/ui` | 123.529 | 10.145 | 1.967 | **237** | 2026-09-10 |
| `tailwindlabs/tailwindcss` | 97.495 | 5.602 | 64 | 77 | 2026-09-08 |
| `chakra-ui/chakra-ui` | 40.641 | 3.644 | 27 | 80 | 2026-09-09 |
| `radix-ui/primitives` | 19.257 | 1.241 | 348 | 120 | 2026-08-08 |
| `chakra-ui/ark` (motor da v3) | 5.388 | 215 | 8 | — | 2026-09-11 |

Os commits do repositório `chakra-ui/chakra-ui` vão majoritariamente para a v3; `chakra-ui/ark`
é um repositório separado, pequeno mas com poucas issues abertas — sinal de manutenção ativa e
escopo bem definido (é usado também pelo Park UI, do mesmo time).

### Downloads npm (última semana)

| Pacote | Downloads |
|---|---:|
| `tailwindcss` | 69.920.618 |
| `lucide-react` | 55.843.685 |
| `class-variance-authority` | 34.140.766 |
| `next` (referência) | 32.413.652 |
| `framer-motion` | 25.499.892 |
| `@emotion/react` | 10.348.446 |
| `radix-ui` (pacote unificado, recente) | 7.390.617 |
| `@ark-ui/react` | 531.208 |
| `@chakra-ui/react` (v2 + v3 somados — npm não separa por major) | 909.324 |

`@chakra-ui/react` move **2,8 % do volume do Next.js**, contando as duas majors juntas (a API do
npm agrega por nome de pacote, não por dist-tag, então não dá para isolar quanto disso é v2 e
quanto é v3). `@ark-ui/react`, sozinho, já move mais da metade desse volume — evidência de que
parte relevante do ecossistema Chakra v3 é, na prática, ecossistema Ark UI.

### Cadência de releases

| Pacote | Releases nos últimos 12 meses | Última versão |
|---|---:|---|
| `lucide-react` | 80 | 1.44.0 / 1.45.0 (10/09/2026) |
| `shadcn` (CLI) | 62 | 4.21.0 (04/09/2026) |
| `@ark-ui/react` | 30 | 5.39.1 (28/08/2026) |
| `tailwindcss` | 16 | 4.3.3 (16/07/2026) |
| `@chakra-ui/react` v3 | 14 | 3.37.0 (28/08/2026) |
| `radix-ui` | 9 | 1.6.7 (24/07/2026) |
| `sonner` | 1 | 2.0.8 (09/08/2026) |
| **`@chakra-ui/react` v2** | **1** | **2.10.10 (04/06/2026)** |

A v3 recebeu **14 releases em 12 meses** — 14× a cadência da v2. Migrar de v2 para v3 é trocar um
pacote parado por um em desenvolvimento ativo; é o argumento mais forte a favor da migração, e o
único eixo em que a v3 vence a v2 sem ressalva.

---

## 8. Curva de aprendizado

### Chakra UI v2 — mais rápido nas primeiras horas, teto baixo

API de props direta (`<Button colorScheme="blue" size="sm" leftIcon={...}>`), zero CSS, zero
arquivo gerado. Customizar de verdade exige aprender `extendTheme`, `defineStyleConfig` e a
anatomia de cada componente — um segundo sistema, com documentação separada.

### Chakra UI v3 — API redesenhada, breaking change total

Todo componente composto virou notação de ponto: `<Modal>` → `Dialog.Root` / `Dialog.Content` /
`Dialog.Header`; `<FormControl>` → `Field.Root`; `<Tabs>` → `Tabs.Root` / `Tabs.Trigger` /
`Tabs.Content`, com `value` obrigatório em vez de índice. **Não existe caminho de migração
automática** — o guia oficial de migração lista dezenas de renomeações manuais, componente por
componente. Quem conhece a v2 começa do zero na v3; quem nunca usou Chakra aprende direto a v3 e
acha a curva parecida com a de compor primitivas do Radix — porque, por baixo, é exatamente isso
que está acontecendo (Ark UI).

O ganho compensa em um ponto concreto: o CLI (`npx @chakra-ui/cli docs button` — mesmo padrão do
`shadcn docs`) e os snippets geram código-fonte legível quando você precisa customizar uma parte
que a v2 não expunha. A v3 fecha parte da distância que separava Chakra de shadcn em
"componentes que você pode abrir e editar".

### shadcn/ui — mais lento no dia 1, mais raso no mês 1

Exige saber Tailwind antes; depois disso não existe mais camada de abstração — o componente é seu
código React com classes Tailwind. Para um time que já usa Tailwind, a curva é praticamente zero.

---

## 9. Recomendação

**Use shadcn/ui + Tailwind v4** para qualquer projeto novo em Next.js 16. Continua sendo a opção
com menor bundle, build mais rápido, Server Components de verdade nos componentes puramente
visuais, e a comunidade com maior volume e cadência de releases. Mova `shadcn` para
`devDependencies` logo após o `init`.

**Se o requisito é ficar no ecossistema Chakra, vá direto para a v3** — mas com expectativa
correta: você não está trocando de versão para ganhar performance. Está trocando um pacote
parado (1 release/ano) por um ativo (14 releases/ano, motor Ark UI mantido à parte com sua própria
cadência), e uma API antiga por uma alinhada ao resto do mercado (`Root`/`Trigger`/`Content`).
Em troca, aceite: bundle 3-4 % mais pesado que a v2, build a frio 2× mais lento, primeira
compilação em dev 4-5× mais lenta, e o mesmo *hydration mismatch* da v2 — cuja correção oficial
(`--webpack`) está quebrada no Next 16.3.4 no momento desta medição. Depois do `init`, troque os
seis ícones de `react-icons` pelos equivalentes do `lucide-react` já instalado (economiza 84 MB
em `node_modules`).

**Não migre de v2 para v3 só por bundle ou build** — os números pioram, não melhoram. Migre por
manutenção de longo prazo (a v2 não recebe mais que uma correção por ano) e por alinhamento de
API com o resto do ecossistema React (Radix, Base UI, Ark UI convergiram na mesma notação de
ponto).

**Continue na v2** apenas se: já existe uma base grande e estável, o prazo não permite reescrever
toda chamada de componente composto, e o app é interno o suficiente para que nem o bundle nem o
*hydration mismatch* incomodem. Mesmo assim, trate isso como dívida técnica com prazo — a v2 está,
na prática, em modo de manutenção mínima.

---

## Anexo — como reproduzir

```bash
bash bench/medir.sh
```

Medições de navegador (nós no DOM, bytes decodificados, DCL/load) foram feitas via Chrome
DevTools em builds de produção, com mediana de 6 carregamentos por rota em iframes de
1280×900 no mesmo perfil de browser. O teste do atrito "Turbopack hydration + `--webpack`" da v3
foi feito rodando `npx next dev --webpack` e `npx next build --webpack` diretamente no
`app-chakra-v3`, sem alterar `package.json`.
