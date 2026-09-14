# ADR / TDD — Biblioteca de UI do projeto novo

| Campo | Valor |
|---|---|
| **Status** | Proposto — aguardando decisão |
| **Tipo** | Architecture Decision Record / Technical Design Document |
| **Escopo** | **Projeto novo, do zero.** Não há migração nem coexistência |
| **Autor** | Thiago Cabreira |
| **Data** | 14 de setembro de 2026 |
| **Decisão proposta** | Iniciar em **shadcn/ui + Tailwind CSS v4 + Radix**. Não adotar Chakra UI (nem v2, nem v3) |
| **Evidência** | Benchmark próprio com 3 aplicações idênticas em Next.js 16.3.4 — reproduzível (anexo A) |
| **Reversibilidade** | Alta se decidida agora; cresce rápido depois das primeiras telas |

---

## 1. Sumário executivo

Vamos começar um produto do zero em **Next.js 16 / React 19** e precisamos escolher a biblioteca
de interface **antes da primeira tela**. Como o time já conhece **Chakra UI**, o caminho de menor
resistência seria repetir a escolha — v2 por familiaridade, ou v3 por ser a linha atual.

Para decidir com dados em vez de hábito, construí **três aplicações idênticas** — mesmas rotas,
mesma API pública, mesma hierarquia de componentes — e medi tudo na mesma máquina.

**A conclusão é dupla e uma delas surpreende:**

1. **Chakra v2 está fora de questão para projeto novo.** Recebeu **uma publicação em 12 meses** e
   tem um *hydration mismatch* sem correção conhecida no App Router.
2. **Chakra v3 também não se justifica** — e este é o ponto contraintuitivo. Ela moderniza a
   arquitetura e voltou a receber releases, mas em **todo eixo de performance mensurável é igual
   ou pior que a v2**, mantém o mesmo bug de hydration, e a correção oficial que o próprio Chakra
   documenta **está quebrada na versão do Next que vamos usar**.

**shadcn/ui vence em todos os eixos técnicos medidos.** O custo dela — você passa a manter o
código-fonte dos componentes — é conhecido, limitado, e **em projeto novo é barato de neutralizar**
com a decisão arquitetural do §8, tomada no dia 1 em vez de retrofitada depois.

### Números que sustentam a decisão

| Métrica (rota principal) | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| Payload total (gzip) | 287,8 KB | 298,2 KB | **235,3 KB** |
| Nós no DOM | 731 | 557 | **487** |
| Tags `<style>` em runtime | 61 | 56 | **1** |
| CSS não-cacheável no HTML | 49,9 KB | 89,1 KB | **0 KB** |
| `next build` a frio | 22,1 s | 44,7 s | **16,5 s** |
| 1ª compilação de rota em dev | 6,4 s | ~29 s | **4,9 s** |
| `node_modules` em produção | 469,5 MB | 475,0 MB | **456,3 MB** |
| *Hydration mismatch* | sim, sem correção | sim, correção quebrada | **não** |
| Releases nos últimos 12 meses | 1 | 14 | **62** |

> **Por que decidir agora.** Trocar biblioteca de UI depois de 30 telas custa semanas. Antes da
> primeira, custa uma tarde. É a janela mais barata que este projeto vai ter.

---

## 2. Contexto e restrições

### 2.1 O projeto

Produto novo, sem base de código herdada, em **Next.js 16.3.4 / React 19.2.8 / App Router /
Turbopack**. Turbopack é padrão em **dev e em build** desde o Next 16 — não existe mais a saída de
"Webpack em produção, Turbopack só em dev". Esse detalhe elimina uma opção adiante (§4).

### 2.2 O que a escolha precisa entregar

| # | Requisito | Por quê |
|---|---|---|
| RF1 | Suporte real a **React Server Components** | é o modelo de renderização padrão do App Router; pagar JS por componente visual é desperdício estrutural |
| RF2 | **Zero erro de hydration** em produção | console limpo é pré-requisito de observabilidade; erro recorrente mascara erro real |
| RF3 | **Acessibilidade** com teclado e ARIA corretos | requisito de produto, não item de qualidade opcional |
| RF4 | Biblioteca **em manutenção ativa** | o projeto vai viver anos e atravessar majors de React e Next |
| RF5 | **Customização sem teto** | design próprio, não tema genérico |
| RF6 | Ciclo de desenvolvimento rápido | build e HMR entram no custo diário de todo o time |

### 2.3 Fora de escopo

Este documento decide a biblioteca de UI do **projeto novo**. Não trata do que fazer com bases
existentes em Chakra — se houver, viram assunto de um ADR próprio.

---

## 3. Por que não levar o Chakra UI v2

A familiaridade do time é o único argumento a favor, e ele não sobrevive aos quatro problemas
abaixo.

### P1 — O pacote está congelado

A linha 2.x recebeu **uma release em 12 meses** (`2.10.10`, 04/06/2026), precedida de um intervalo
de **doze meses e meio**. Todo o esforço do time mantenedor vai para a v3. Adotar a v2 em projeto
novo é **nascer com dívida técnica**: nenhuma correção de compatibilidade com futuras versões de
React ou Next vai chegar. Viola **RF4**.

### P2 — *Hydration mismatch* estrutural, sem correção

Toda rota renderizada no servidor emite no console:

```
Uncaught Error: Minified React error #418
Hydration failed because the server rendered HTML didn't match the client.
- <body className="chakra-ui-light">
- <style data-emotion="css-global 1515mbm" data-s="">
```

Testei sistematicamente as hipóteses de correção:

| Tentativa | Resultado |
|---|---|
| `suppressHydrationWarning` no `<body>` | resolve a divergência do `className`, **não** a do `<style>` |
| Remover `CacheProvider` do `@chakra-ui/next-js` | erro persiste |
| Fixar `framer-motion@^11` (em vez da 13.x que o peer resolve) | erro persiste |
| Remover `styles.global` do tema | erro persiste |

Console poluído em produção, re-render forçado de subárvore no dispositivo do usuário, e −4 pontos
em boas práticas no Lighthouse. Viola **RF2**.

### P3 — Custo de CSS-in-JS em runtime

O Emotion injeta CSS **dentro do HTML de cada resposta** (49,9 KB na rota principal) e cria
**61 tags `<style>`** em tempo de execução. Custo não cacheável, pago por render, que **escala com
o tamanho da aplicação** — exatamente o que não se quer assumir no início de um produto.

### P4 — Zero suporte a React Server Components

Todo componente Chakra v2 é Client Component. Uma página puramente visual — sem estado, sem
eventos — ainda exige `"use client"` e carrega o runtime inteiro: medimos **220,3 KB de JS gzip**
para renderizar o que é, conceitualmente, HTML estático. Viola **RF1**.

---

## 4. Por que não começar direto na Chakra UI v3

Se a v2 está fora, a v3 é o candidato natural: mesma marca, mesmo time, cadência restaurada
(14 releases em 12 meses), API modernizada sobre **Ark UI / Zag.js** — a mesma família de máquinas
de estado headless que inspirou o desenho do Radix.

Construí a aplicação completa em v3 para avaliar de fato. **Não confirmou a expectativa.**

| Eixo | v2 → v3 |
|---|---|
| Bundle na rota principal | **piora** (287,8 → 298,2 KB gzip) |
| CSS inline não-cacheável | **piora muito** (49,9 → 89,1 KB) |
| `next build` a frio | **piora 2×** (22,1 → 44,7 s) |
| Checagem de tipos | **piora 2-3×** (6,4 → 11,6-19,1 s) |
| 1ª compilação de rota em dev | **piora 4-5×** (6,4 → ~29 s) |
| TTFB do servidor | melhora (298 → 148 ms) |
| Nós no DOM | melhora (731 → 557) |
| Acessibilidade (Lighthouse) | melhora (97 → 100) |
| *Hydration mismatch* | **permanece** |

Três atritos adicionais, todos verificados:

### B1 — A correção oficial do bug não funciona no Next 16

A documentação do Chakra **reconhece** o *hydration mismatch* da v3 e prescreve o fallback para
Webpack:

> *"Turbopack Hydration Error […] it is recommended to use the `--webpack` flag in the development
> and build scripts"* — chakra-ui.com/docs/get-started/frameworks/next-app

Testei. **Os dois comandos falham no Next.js 16.3.4**, cada execução com um módulo interno
diferente ausente:

```bash
$ npx next dev --webpack
Error: Cannot find module 'next/dist/compiled/json5'
# processo encerra; porta deixa de responder

$ npx next build --webpack
Error: Cannot find module 'next/dist/compiled/browserify-zlib'

$ npx next build --webpack   # segunda execução
Error: Cannot find module 'next/dist/compiled/string_decoder'
```

Três módulos diferentes em três execuções: o caminho de build via Webpack do Next 16.3.4 está
incompleto para esse fallback. **A correção documentada pelo fornecedor não existe na versão de
plataforma que vamos usar.** Como Turbopack é padrão em dev *e* build, não há para onde escapar.

### B2 — `createSystem()` quebra em Server Component com erro opaco

Na v2, importar o tema de um Server Component dava um erro explícito e acionável
(`"extendTheme is on the client"`). Na v3, o mesmo erro vira:

```
TypeError: bf.accordionAnatomy.extendWith is not a function
```

Nenhuma menção a client/server. Custo de diagnóstico maior, não menor.

### B3 — API nova, sem base de conhecimento acumulada no time

Toda API composta virou notação de ponto: `<Modal>` → `Dialog.Root` / `Dialog.Content` /
`Dialog.Header`; `<FormControl>` → `Field.Root`; `<Tabs>` exige `value` em vez de índice.

Em projeto novo isso não é custo de reescrita — mas **anula o único argumento a favor do Chakra**,
que era a familiaridade do time. Quem conhece a v2 começa do zero na v3, do mesmo jeito que
começaria no shadcn. E a curva do shadcn leva a Tailwind, que o mercado inteiro usa.

> **Conclusão:** se a familiaridade não transfere e a performance não melhora, a v3 não tem
> argumento restante sobre o shadcn — só o `hydration mismatch` que ela carrega junto.

---

## 5. Evidência medida

### 5.1 Método

Três aplicações Next.js 16.3.4 idênticas, consumindo a Rick and Morty API pública:

| Rota | Conteúdo |
|---|---|
| `/` | Server Component busca dados no servidor → Client Component com busca (debounce), 2 filtros, paginação, favoritos, modal de detalhes, toast |
| `/estatico` | Página sem estado e sem eventos — isola o **piso de JavaScript** de cada biblioteca |

Componentes exercitados nas três: Button, Input, Select, Card, Badge, Avatar, Skeleton,
Dialog/Modal, Toast, Tabs, Accordion, Switch, Tooltip, Alert, Separator, Label, Progress, Table,
Menu/DropdownMenu.

**Instrumentação:** build de produção (`next build` + `next start`); bytes medidos via Performance
API do Chrome, mediana de 6 carregamentos por rota em iframes 1280×900; TTFB via `curl`, mediana
de 12 amostras; gzip calculado com `gzip -9` sobre `.next/static`; Lighthouse desktop em modo
navigation.

### 5.2 Payload entregue ao navegador

| Métrica | Rota | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---|---:|---:|---:|
| HTML (gzip) | `/` | 17,6 KB | 20,5 KB | **10,8 KB** |
| CSS embutido no HTML | `/` | 49,9 KB | 89,1 KB | **0 KB** |
| JS (gzip) | `/` | 269,2 KB | 276,7 KB | **212,2 KB** |
| CSS externo (gzip, cacheável) | `/` | 1,0 KB | 1,0 KB | 12,3 KB |
| **Total (gzip)** | `/` | **287,8 KB** | **298,2 KB** | **235,3 KB** |
| JS (gzip) | `/estatico` | 220,3 KB | 217,8 KB | **171,8 KB** |
| **Total (gzip)** | `/estatico` | **230,5 KB** | **230,8 KB** | **189,2 KB** |

**Onde o CSS mora é a diferença arquitetural central.** O Tailwind gera **um arquivo externo**
(71 KB / 12,3 KB gzip) pago uma vez e cacheado para todas as rotas. As duas versões do Chakra
empurram CSS **para dentro do HTML de cada resposta** — custo repetido, nunca cacheado.

### 5.3 DOM e runtime

| Métrica | Rota | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---|---:|---:|---:|
| Nós no DOM | `/` | 731 | 557 | **487** |
| Nós no DOM | `/estatico` | 119 | 106 | **75** |
| Tags `<style>` criadas em runtime | `/` | 61 | 56 | **1** |

### 5.4 Tempos

| Métrica | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| TTFB servidor — `/` | 298 ms | **148 ms** | 179 ms |
| TTFB servidor — `/estatico` | 3,8 ms | 6,4 ms | **3,2 ms** |
| DOMContentLoaded — `/` | 425 ms | 521 ms | **424 ms** |
| Load — `/` | 474 ms | 650 ms | **425 ms** |
| Load — `/estatico` | 80,3 ms | 231,2 ms | **53,9 ms** |

### 5.5 Build e ciclo de desenvolvimento

| Métrica | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| `next build` a frio | 22,1 s | 44,7 s | **16,5 s** |
| ↳ checagem de tipos | 6,4 s | 11,6-19,1 s | **4,3 s** |
| `next build` a quente | 8,2 s | 23,7 s | **6,9 s** |
| `next dev` até "Ready" | **0,87 s** | 2,8-3,8 s | 0,88 s |
| 1ª compilação de `/` em dev | 6,44 s | **~29 s** | **4,93 s** |

> A lentidão da v3 tem causa identificada: os tipos do Ark UI são fortemente genéricos (cada
> componente composto expõe `RootProps`, `ItemProps` etc. parametrizados), e isso se paga em `tsc`
> e no grafo de módulos do Turbopack. Reproduzido duas vezes, variação < 2 s entre execuções.

### 5.6 Peso de dependências (instalação de produção, `npm ci --omit=dev`)

| | Como o instalador deixa | Corrigido | Correção necessária |
|---|---:|---:|---|
| Chakra UI v2 | 469,5 MB / 19.737 arq. | — | — |
| Chakra UI v3 | 559,2 MB / 24.608 arq. | 475,0 MB | remover `react-icons` (84 MB por 6 ícones) |
| **shadcn/ui** | 527,8 MB / 22.833 arq. | **456,3 MB / 15.677 arq.** | mover `shadcn` para `devDependencies` |

⚠️ **Ambos os CLIs deixam lixo em `dependencies`.** Documentar na checklist de onboarding:

- **shadcn:** `shadcn init` grava o próprio pacote `shadcn` em `dependencies`, arrastando
  `@ts-morph/common`, `@modelcontextprotocol/sdk`, `zod` e `commander` → **71,5 MB e 7.156
  arquivos** desnecessários em produção. Mover para `devDependencies` resolve.
- **Chakra v3:** os snippets do CLI importam de `react-icons/lu` — seis ícones ao todo — e isso
  puxa o pacote `react-icons` inteiro (**84,2 MB**) para `dependencies`, duplicando o
  `lucide-react` que o projeto já usa.

### 5.7 Qualidade (Lighthouse desktop)

| Categoria | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| Acessibilidade | 97 | **100** | 93 |
| Boas práticas | 96 | 96 | **100** |
| SEO | 100 | 100 | 100 |

**Leitura honesta:** este é o único eixo em que shadcn perde. A v3 (Ark UI) resolve rótulos ARIA
automaticamente onde o shadcn deixa por conta do desenvolvedor. As falhas medidas no shadcn foram
`aria-progressbar-name` (faltou `aria-label` em um `<Progress>` — erro do nosso código, não da
biblioteca) e `color-contrast` em texto secundário. **Mitigação: risco R2 (§11) e, em código, o adapter `Field` (§8.3b).**

---


---

## 6. Decisão

> Iniciar o projeto em **shadcn/ui + Tailwind CSS v4**, com **Radix** como primitiva headless.
> **Não** adotar Chakra UI, em nenhuma das duas versões.

### Justificativa contra os requisitos do §2.2

| Req. | Como o shadcn atende |
|---|---|
| **RF1** — Server Components | componentes visuais (Card, Badge, Table, Alert, Separator, Input, Skeleton) rodam **sem `"use client"`** |
| **RF2** — zero hydration error | Lighthouse boas práticas **100/100**; nenhuma das opções Chakra chega lá |
| **RF3** — acessibilidade | Radix entrega foco, teclado e ARIA; o gap medido (93) é endereçado por lint e pelo adapter `Field` do §8.3b |
| **RF4** — manutenção ativa | 62 releases do CLI em 12 meses; Radix 10,1 M downloads/semana; Tailwind 92,7 M |
| **RF5** — customização sem teto | o componente é arquivo do nosso repositório, não configuração de terceiro |
| **RF6** — ciclo rápido | build a frio 16,5 s (−25 % vs v2, −63 % vs v3); 1ª compilação em dev 4,9 s |

### A vantagem específica de decidir isso em projeto novo

Em migração, a camada de adaptação do §8 é retrofit: existe código legado importando direto dos
componentes. **Aqui ela nasce com a primeira linha** — a regra de lint entra antes da primeira
tela, e nunca há o que corrigir depois. O maior custo apontado contra o shadcn (D1/D2) é
neutralizado por uma decisão de estrutura de pastas tomada no dia 1.

---
## 7. shadcn/ui — vantagens e desvantagens

### 7.1 O que shadcn é (e o que não é)

shadcn **não é uma dependência npm de componentes**. O CLI copia o **código-fonte** dos
componentes para dentro do seu repositório. Três camadas:

| Camada | O que entrega | Onde mora |
|---|---|---|
| **Primitiva headless** (Base UI / Radix / React Aria) | estado, foco, teclado, ARIA, portal, posicionamento — **zero estilo** | `node_modules` |
| **shadcn/ui** | classes Tailwind + variantes (`cva`) sobre a primitiva | **seu repositório** |
| **Tailwind CSS v4** | tokens, utilitários, geração do CSS | build |

O contrato entre as camadas é limpo: a primitiva expõe estado via `data-*`
(`data-checked`, `data-disabled`), e o shadcn pendura classe condicional nesses atributos. Um lado
nunca precisa saber do outro — por isso a primitiva é **trocável** (`--base base | radix | aria`).

> ⚠️ **Atenção à escolha da primitiva.** O CLI hoje tem como padrão o preset `base-nova`
> (**Base UI**, dos criadores do Radix/Floating UI/MUI — MIT, 10,9 k ★, muito ativo). O nosso
> benchmark foi feito com `--base radix`, que continua sendo a opção com maior base instalada
> (10,1 M downloads/semana contra 353 k do Base UI). **Recomendação: padronizar em `radix` no
> bootstrap** pela maturidade e volume de uso, e reavaliar Base UI em 6 meses.

### 7.2 Vantagens

| # | Vantagem | Evidência / impacto |
|---|---|---|
| V1 | **Menor payload** | −18 % a −22 % de bytes por rota contra ambas as versões do Chakra |
| V2 | **Sem CSS-in-JS em runtime** | 1 tag `<style>` contra 61 do v2; CSS externo cacheável entre rotas |
| V3 | **Server Components reais** | componentes visuais sem `"use client"` — menos JS enviado por definição |
| V4 | **Sem *hydration mismatch*** | Lighthouse boas práticas 100/100 |
| V5 | **Build e dev mais rápidos** | build a frio −25 % vs v2, −63 % vs v3 |
| V6 | **Customização sem teto** | o componente é seu arquivo; não existe "a API não expõe essa parte" |
| V7 | **Depuração legível** | DevTools mostra `bg-primary h-8 px-2.5` em vez de `css-1vveiwr` |
| V8 | **Tematização por escopo** | tokens são CSS custom properties → dois temas na mesma página com uma classe no container (impossível no Chakra sem provider aninhado) |
| V9 | **Ecossistema de registries** | centenas de componentes prontos instaláveis pelo mesmo CLI (§8) |
| V10 | **Ferramental para agentes de IA** | `npx shadcn@latest docs button` entrega API e exemplos no terminal; v0 e Claude Code geram shadcn nativamente |

### 7.3 Desvantagens (avaliação honesta)

| # | Desvantagem | Severidade | Mitigação |
|---|---|---|---|
| D1 | **Você passa a manter ~1.561 LOC** de componentes no repositório | Média→Baixa | **Camada de adaptação (§8)**: `components/ui` vira somente-leitura e sai do code review; o que se mantém de fato são ~200 LOC de adapter |
| D2 | **Não existe `npm update` para componentes** — correções do upstream não chegam sozinhas | Média→Baixa | **Camada de adaptação (§8)** torna `--overwrite` seguro; fluxo trimestral no §8.7 |
| D3 | **Acessibilidade depende mais do desenvolvedor** | Média | Lint de a11y no CI + Lighthouse como gate de PR (R2), **e adapters que ligam ARIA por construção (§8.3b)** |
| D4 | **Exige saber Tailwind** | Baixa-Média | Plano de capacitação, §10 |
| D5 | **Sem combobox com busca pronto** | Baixa | Compor `Command` + `Popover` (receita documentada) ou instalar de registry externo |
| D6 | **CLI se instala em `dependencies`** | Baixa | Uma linha de correção, entra na checklist (§5.6) |
| D7 | **Mais arquivos no projeto** (26 vs 7 no v2) | Baixa | São arquivos pequenos e isolados em `components/ui/` |
| D8 | **CSS externo de 71 KB** existe mesmo em página mínima | Baixa | 12,3 KB gzip, cacheado uma vez para o app inteiro — amortiza a partir da 2ª rota |

**A troca central, em uma frase:** o Chakra customiza por **configuração** (rápido no começo, com
teto quando a API não cobre o caso); o shadcn customiza por **posse do código** (sem teto, com
custo de manutenção). Para um produto que vive anos, a ausência de teto vale mais.

---

## 8. Arquitetura de componentes: a camada de adaptação

Esta seção responde à desvantagem **D1/D2** e ao risco **R4**: *"você passa a manter 1.561 LOC
e não existe `npm update` para componentes"*. A resposta é arquitetural, não processual.

### 8.1 O princípio

> **`components/ui/` é código gerado. Ninguém edita. Nunca.**
> Toda customização vive em `components/ds/`, uma camada de adaptação que compõe por cima.

Se ninguém editar o vendored, ele permanece idêntico ao upstream — e
`npx shadcn@latest add <componente> --overwrite` volta a ser uma operação **segura e rotineira**,
em vez de um merge manual arriscado. D2 e R4 deixam de existir.

### 8.2 Prova de que o problema é real

Durante a construção do protótipo eu mesmo violei esse princípio: adicionei as variantes
`brand`, `brand-soft`, `success` e o tamanho `xl` **direto** em `components/ui/button.tsx`.
Depois, ao rodar o comando de atualização:

```bash
$ npx shadcn@latest add button -y -o
ℹ Updated 1 file:
  - components/ui/button.tsx

$ grep -cE "brand|success" components/ui/button.tsx
0        # todas as customizações foram apagadas
```

**Uma atualização de rotina destruiu o trabalho silenciosamente.** Com a camada de adaptação, o
mesmo comando é inofensivo — foi o que fiz em seguida, e os consumidores continuaram funcionando.

Detalhe valioso: ao mover as variantes para o adapter, o **TypeScript apontou cada consumidor
afetado** antes de qualquer execução:

```
app/tema/playground.tsx(83,17): error TS2322:
  Type '"brand"' is not assignable to type '"default" | "outline" | ...'
```

Trocar um import resolveu tudo. O compilador vira a rede de segurança da camada.

### 8.3 Árvore de pastas

```
app-shadcn/
├── components/
│   ├── ui/                      # ⛔ GERADO PELO CLI — somente leitura
│   │   ├── button.tsx           #    idêntico ao registry, sempre
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── …                    #    19 arquivos, 1.561 LOC que NÃO revisamos
│   │
│   ├── ds/                      # ✅ NOSSA CAMADA — é aqui que se customiza
│   │   ├── button.tsx           #    variantes e tamanhos da casa
│   │   ├── field.tsx            #    Label+Input+erro com a11y ligada
│   │   ├── confirm-dialog.tsx   #    composição Dialog+Button
│   │   └── index.ts             #    barrel: ponto único de import
│   │
│   └── features/                # componentes de domínio
│       └── …                    #    importam SÓ de @/components/ds
│
├── app/
│   └── …                        # telas — importam SÓ de @/components/ds
│
├── lib/utils.ts                 # cn() = clsx + tailwind-merge
├── eslint.config.mjs            # a regra que torna o princípio obrigatório
└── components.json              # config do CLI (registra a versão usada)
```

### 8.4 Quatro níveis de customização, em ordem de preferência

**Antes de criar um adapter, pergunte em que nível o problema vive.** Escrever adapter para algo
que é token é erro comum e caro.

| Nível | Quando usar | Onde mexe | Custo |
|---|---|---|---|
| **1 · Token CSS** | mudança **global** de aparência: cor da marca, raio, fonte, espaçamento | `app/globals.css` | ~zero |
| **2 · `className` no uso** | ajuste **pontual** e local, de uma tela só | onde o componente é usado | ~zero |
| **3 · Adapter em `ds/`** | variante nova, default da casa, composição, regra de a11y | `components/ds/` | baixo |
| **4 · Editar `ui/`** | ⚠️ **exceção** — só quando os 3 acima não resolvem | `components/ui/` | alto |

O nível 4 exige registro em ADR com justificativa, porque quebra a garantia de atualização. Na
prática, quase nunca é necessário.

#### Nível 1 — token: muda tudo de uma vez, sem adapter

```css
/* app/globals.css */
:root {
  --primary: oklch(0.52 0.105 190);   /* cor da marca */
  --radius:  0.35rem;                 /* raio, propagado por calc() */
}
```

Uma linha reveste `Button`, `Input`, `Card`, `Select`, `Switch`, foco e `Progress` de uma vez.
Nenhum componente foi tocado.

#### Nível 3a — variante nova, sem editar o original

O truque: a base entrega o **esqueleto** (altura, foco, `disabled`, `aria-invalid`, ícone), e o
adapter sobrescreve **só a pintura**. O `cn()` resolve o conflito — a última classe vence
(verificado: `cn("bg-primary", "bg-brand")` → `"bg-brand"`).

```tsx
// components/ds/button.tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Button as BaseButton } from "@/components/ui/button";

type BaseProps   = React.ComponentProps<typeof BaseButton>;
type BaseVariant = NonNullable<BaseProps["variant"]>;
type BaseSize    = NonNullable<BaseProps["size"]>;

/** Variantes da casa — aplicadas POR CIMA da base. */
const dsVariants = cva("", {
  variants: {
    variant: {
      brand:        "bg-brand text-brand-foreground shadow-sm hover:bg-brand/90 focus-visible:ring-brand/40",
      "brand-soft": "bg-brand-muted text-brand hover:bg-brand/15 focus-visible:ring-brand/30",
      success:      "bg-success/12 text-success hover:bg-success/20 focus-visible:ring-success/30",
    },
    size: {
      xl: "h-11 gap-2 rounded-[calc(var(--radius)*1.4)] px-5 text-base [&_svg:not([class*='size-'])]:size-5",
    },
  },
});

type DsVariant = NonNullable<VariantProps<typeof dsVariants>["variant"]>;
type DsSize    = NonNullable<VariantProps<typeof dsVariants>["size"]>;

const DS_VARIANTS = ["brand", "brand-soft", "success"] as const;
const DS_SIZES    = ["xl"] as const;

const isDsVariant = (v: unknown): v is DsVariant =>
  (DS_VARIANTS as readonly string[]).includes(v as string);
const isDsSize = (s: unknown): s is DsSize =>
  (DS_SIZES as readonly string[]).includes(s as string);

export interface ButtonProps extends Omit<BaseProps, "variant" | "size"> {
  variant?: BaseVariant | DsVariant;   // união: variantes da base + da casa
  size?: BaseSize | DsSize;
}

export function Button({
  variant = "default",
  size = "sm",           // ← default da casa, decidido uma vez
  className,
  ...props
}: ButtonProps) {
  const customVariant = isDsVariant(variant);
  const customSize    = isDsSize(size);

  return (
    <BaseButton
      variant={customVariant ? "default" : variant}
      size={customSize ? "default" : size}
      className={cn(
        (customVariant || customSize) &&
          dsVariants({
            variant: customVariant ? variant : undefined,
            size: customSize ? size : undefined,
          }),
        className
      )}
      {...props}
    />
  );
}
```

Uso — indistinguível de usar o shadcn direto, com autocomplete das duas famílias de variante:

```tsx
import { Button } from "@/components/ds";

<Button variant="brand" size="xl">Assinar</Button>   {/* nossa */}
<Button variant="outline">Cancelar</Button>          {/* da base */}
```

#### Nível 3b — a11y por construção (mitigação do risco R3 em código)

A maior desvantagem medida do shadcn foi acessibilidade (Lighthouse 93 contra 100 da v3), porque
a ligação ARIA fica por conta do desenvolvedor. **O adapter transforma isso em impossível de
esquecer:**

```tsx
// components/ds/field.tsx
"use client";

import * as React from "react";
import { cn } from "cn";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FieldProps extends Omit<React.ComponentProps<typeof Input>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  containerClassName?: string;
}

export function Field({
  label, hint, error, id, className, containerClassName, ...props
}: FieldProps) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  const hintId  = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", containerClassName)}>
      <Label htmlFor={fieldId}>{label}</Label>

      <Input
        id={fieldId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={className}
        {...props}
      />

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
```

```tsx
<Field
  label="E-mail de trabalho"
  hint="Usamos apenas para notificações do sistema."
  error={emailError}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

`id`, `htmlFor`, `aria-describedby`, `aria-invalid` e `role="alert"` saem certos **sempre** —
escritos uma vez, não relembrados a cada tela. Isso é R3 resolvido em código, não em checklist.

#### Nível 3c — composição de produto

```tsx
// components/ds/confirm-dialog.tsx
"use client";

import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ds/button";

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  destructive = false, pending = false, onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "destructive" : "brand"}
            onClick={() => void onConfirm()}
            disabled={pending}
          >
            {pending ? "Aguarde…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Ganho: **toda confirmação destrutiva do sistema** tem a mesma ordem de botões, o mesmo estado de
carregamento e o mesmo texto padrão. Mudou a política? Um arquivo.

### 8.5 O barrel: ponto único de import

```ts
// components/ds/index.ts

// —— adaptados (têm comportamento ou variante da casa)
export { Button, type ButtonProps } from "./button";
export { Field, type FieldProps } from "./field";
export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";

// —— repassados sem alteração
// O dia em que precisarem mudar, viram arquivo próprio e nenhum
// consumidor precisa trocar de import.
export { Badge } from "@/components/ui/badge";
export { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export { Separator } from "@/components/ui/separator";
export { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
```

O re-export de componentes ainda não customizados é deliberado: cria o **ponto de intercepção
futuro** sem custo hoje. Quando o `Badge` precisar de uma variante da casa, ele vira
`ds/badge.tsx` e **nenhuma tela muda de import**.

### 8.6 Tornando a regra obrigatória (não um acordo verbal)

```js
// eslint.config.mjs
export default [
  {
    files: ["app/**/*.{ts,tsx}", "components/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["@/components/ui/*", "**/components/ui/*"],
          message:
            "Importe de @/components/ds. A pasta components/ui é código gerado pelo CLI " +
            "e é sobrescrita por `shadcn add --overwrite`. Precisa de algo novo? " +
            "Crie ou estenda um adapter em components/ds/.",
        }],
      }],
    },
  },
  {
    // a camada de adapters é a única autorizada a tocar no vendored
    files: ["components/ds/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // código gerado: não é nosso, não revisamos estilo dele
    ignores: ["components/ui/**"],
  },
];
```

O `ignores` tem efeito colateral útil: **os 1.561 LOC gerados somem do code review**. A revisão de
PR passa a olhar só o que o time escreveu — o que reduz D1 de "1.561 linhas para manter" para
"~200 linhas de adapter para manter".

### 8.7 Fluxo de atualização (o que D2/R4 vira na prática)

```bash
# 1. Ver o que mudou no upstream, sem aplicar nada
npx shadcn@latest diff button

# 2. Atualizar — seguro, porque ninguém editou o arquivo
npx shadcn@latest add button --overwrite

# 3. O TypeScript aponta qualquer quebra de contrato nos adapters
npx tsc --noEmit
```

**Cadência sugerida:** trimestral, em branch próprio, com os três comandos acima e a suíte de
testes. Se `tsc` passar, o merge é seguro.

### 8.8 Protótipo verificável

A rota **`/adapters`** do `app-shadcn` demonstra os três padrões funcionando em build de produção:
variantes da casa, `Field` com a11y ligada, e `ConfirmDialog` composto. Todo o código desta seção
está no repositório e compila — `npx tsc --noEmit` e `npm run build` limpos.


---

## 9. Bibliotecas auxiliares e registries

Adotar shadcn não é adotar uma biblioteca só. É entrar num ecossistema de três camadas com
regras de risco diferentes — e confundi-las é como se toma decisão ruim aqui.

### 9.1 As três camadas

| Camada | O que é | Como entra | Risco |
|---|---|---|---|
| **A · Núcleo** | o que o `shadcn init` instala | automático | baixo — é a fundação, escolhida junto com o shadcn |
| **B · Companheiras oficiais** | libs que **componentes do próprio shadcn** exigem | ao rodar `shadcn add <componente>` | baixo-médio — são escolhas do upstream, não nossas |
| **C · Registries de terceiros** | coleções de componentes extras | decisão explícita nossa | **médio-alto** — licença, primitiva e manutenção variam |

### 9.2 Camada A — núcleo (vem com o `init`)

| Pacote | Papel | ★ | Licença | Downloads/sem. |
|---|---|---:|---|---:|
| `tailwindcss` | motor de estilo | 97,5 k | MIT | 92,7 M |
| `radix-ui` | primitivas headless | 19,3 k | MIT | 10,1 M |
| `tailwind-merge` | resolve conflito de classe (dentro do `cn`) | — | MIT | 60,1 M |
| `class-variance-authority` | declara variantes de componente | — | Apache-2.0 | 45,3 M |
| `lucide-react` | ícones | — | ISC | 55,8 M |
| `next-themes` | modo claro/escuro | 6,3 k | MIT | 19,1 M |

Nada a decidir aqui: é a consequência de escolher shadcn. Todas MIT-compatíveis e com adoção
massiva.

### 9.3 Camada B — companheiras oficiais

**Esta é a camada que costuma ser esquecida no planejamento.** Os componentes básicos do shadcn
(Button, Card, Input) não têm dependência externa — mas **os componentes que um produto real
precisa, têm**. Cada um entra no `package.json` quando você roda o `add` correspondente:

| Componente shadcn | Dependência que ele traz | ★ | Licença | Downloads/sem. | Último push |
|---|---|---:|---|---:|---|
| `form` | `react-hook-form` | 44,9 k | MIT | 40,0 M | 13/09/2026 |
| `form` (validação) | `zod` | 43,9 k | MIT | **209,2 M** | 13/09/2026 |
| `data-table` | `@tanstack/react-table` | 28,4 k | MIT | 15,0 M | 14/09/2026 |
| `chart` | `recharts` | 27,6 k | MIT | 40,5 M | 14/09/2026 |
| `command` (⌘K) | `cmdk` | 13,0 k | MIT | 30,2 M | 29/10/2025 |
| `sonner` (toast) | `sonner` | 13,0 k | MIT | 34,9 M | 10/08/2026 |
| `drawer` | `vaul` | 8,6 k | MIT | 25,5 M | 03/10/2025 |
| `carousel` | `embla-carousel-react` | 8,4 k | MIT | 23,0 M | 13/09/2026 |
| `calendar` / date picker | `react-day-picker` | 6,9 k | MIT | 30,4 M | 26/08/2026 |

Três leituras importantes desta tabela:

**1. Todas MIT.** Nenhuma restrição de licença na camada que o produto realmente vai usar.

**2. "Repositório parado" não é o mesmo que "abandonado".** `cmdk` (29/10/2025) e `vaul`
(03/10/2025) estão há ~11 meses sem commit — e movem **30 M e 25 M downloads por semana**. São
bibliotecas de escopo fechado que chegaram ao "pronto": um command palette e um drawer não mudam
de requisito. Compare com o **Tremor** (§9.4), parado há o mesmo tempo mas num escopo —
visualização de dados — que exige acompanhar mudanças de navegador e de React. **O critério não é
a data do último commit, é se o escopo do problema ainda se move.**

**3. Gráficos: `recharts`, não Tremor.** O componente `chart` oficial do shadcn é construído sobre
Recharts (27,6 k ★, push de hoje). Isso resolve dashboards sem precisar de biblioteca de terceiro.

> **Implicação para o planejamento:** ao estimar a primeira tela de cadastro, contar
> `react-hook-form` + `zod`; ao estimar a primeira listagem, contar `@tanstack/react-table`.
> Não são "extras" — são o caminho oficial.

### 9.4 Camada C — registries de terceiros

Aqui mora a decisão de verdade. O CLI suporta **registries nomeados**, então bibliotecas de
terceiros se instalam pelo mesmo comando e caem no mesmo sistema de tokens:

```jsonc
// components.json
"registries": {
  "magicui": { "url": "https://magicui.design/r/{name}.json" },
  "acme":    { "url": "https://interno.empresa.com.br/r/{name}.json",
               "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" } }
}
```

```bash
npx shadcn@latest add @magicui/magic-card
npx shadcn@latest add https://ui.aceternity.com/registry/spotlight.json
```

| Registry | O que oferece | ★ | Licença | Último push | Recomendação |
|---|---|---:|---|---|---|
| **Magic UI** | componentes animados para landing e marketing | 22,3 k | MIT | 13/09/2026 | ⚠️ **Caso a caso** — ótimo em páginas de marketing, evitar em app interno (traz peso de animação) |
| **coss UI** (ex-**Origin UI**) | ~362 componentes avançados: timeline, inputs ricos, autocomplete | 10,6 k | ⚠️ ver §9.5 | 08/09/2026 | ⚠️ **Não adotar agora** — ver alerta |
| **Motion Primitives** | componentes de movimento, copy-paste | 6,3 k | MIT | 12/09/2026 | ⚠️ **Caso a caso** — mesma lógica do Magic UI |
| **Cult UI** | componentes para "design engineers" | 6,1 k | MIT | 22/07/2026 | ⚠️ **Caso a caso** |
| **Aceternity UI** | efeitos animados; tem linha **Pro paga** | — | ❌ **proprietária** (Aceternity Labs LLC) | — | ❌ **Não adotar sem jurídico** — licença própria, não MIT |
| **Tremor** | dashboards e gráficos | 3,6 k | Apache-2.0 | ⛔ **10/10/2025** | ❌ **Não adotar** — parado num escopo que exige manutenção; use o `chart` do shadcn (Recharts) |
| **v0 registry** | geração de UI por IA, instalável via `@v0/...` | — | — | ativo | ✅ **Liberado para prototipagem**, com revisão humana antes do merge |

> **Nota sobre licença do Aceternity.** É a única da lista que **não é open source**. A licença é
> da Aceternity Labs LLC e a linha "Pro" é paga. Mesmo os componentes gratuitos ficam sob termos
> próprios, com partes eventualmente sob licenças de terceiros. **Qualquer uso passa pelo
> jurídico antes** — não é decisão de engenharia.

### 9.5 ⚠️ Alerta — Origin UI mudou de dono em 2026

O **Origin UI foi adquirido pela Cal.com** e renomeado para **coss UI** (`coss.com/ui`,
repositório `cosscom/coss`). Três implicações:

1. **O Origin UI "clássico" virou legado** — permanece disponível como snapshot pré-aquisição,
   com **suporte e manutenção limitados** declarados pelos próprios mantenedores. Quem adotar hoje
   está adotando um arquivo histórico, não um projeto vivo.
2. **O coss UI foi reconstruído sobre Base UI**, não sobre Radix. Misturá-lo com componentes
   shadcn em `--base radix` traz **duas camadas de primitivas** para o mesmo bundle — paga-se
   Radix e Base UI ao mesmo tempo, com dois modelos de foco e de portal convivendo.
3. **A licença exige verificação por pacote:** o monorepo `cosscom/coss` está sob **AGPL-3.0**,
   enquanto o pacote `apps/ui` (a biblioteca de componentes em si) declara **MIT**. AGPL é
   incompatível com boa parte das políticas corporativas, e a diferença entre os dois só aparece
   olhando o subdiretório.

**Recomendação:** não adotar no início. Se algum componente específico for realmente necessário,
tratar como decisão isolada — validação jurídica do artefato copiado e confirmação de que não
arrasta Base UI para um projeto padronizado em Radix.

### 9.6 Critérios para aprovar uma biblioteca auxiliar

Checklist obrigatório antes de qualquer item da camada C entrar no repositório:

- [ ] **Licença** verificada **no artefato específico**, não só no README do repositório
      (o caso coss mostra por quê: monorepo AGPL, pacote MIT)
- [ ] **Mesma primitiva** que a nossa (Radix) — ou confirmação de que não duplica a camada headless
- [ ] Usa **nossos tokens** (`bg-primary`, `--radius`), não cores e medidas fixas
- [ ] **Peso medido**: quanto adiciona ao bundle da rota que vai usá-lo
- [ ] **Manutenção avaliada pelo escopo**, não pela data: o problema que ele resolve ainda se move?
- [ ] **Diff revisado** no PR — é copy-paste, então vira código nosso e passa por code review normal

### 9.7 Resumo da decisão

| Decisão | Recomendação |
|---|---|
| Camadas A e B | ✅ **Adotar conforme necessário** — são o caminho oficial do shadcn |
| Gráficos e dashboards | ✅ Componente `chart` do shadcn (Recharts). **Não** Tremor |
| Formulários | ✅ `form` do shadcn (`react-hook-form` + `zod`) desde a primeira tela |
| Tabelas com ordenação/filtro | ✅ `data-table` do shadcn (`@tanstack/react-table`) |
| Magic UI / Motion Primitives / Cult UI | ⚠️ Caso a caso, só em superfícies de marketing, com o checklist do §9.6 |
| Origin UI / coss UI | ❌ Não adotar agora (§9.5) |
| Aceternity UI | ❌ Não adotar sem parecer jurídico — licença proprietária |
| Tremor | ❌ Não adotar — parado desde outubro de 2025 |

## 10. Curva de aprendizado e capacitação

### 8.1 Comparação honesta

| | Chakra v2 (hoje) | Chakra v3 | **shadcn/ui** |
|---|---|---|---|
| **Dia 1** | 🟢 mais fácil — API de props, zero CSS | 🟡 API nova, sem codemod | 🟡 exige Tailwind + 3 conceitos novos |
| **Mês 1** | 🟡 aparece o teto do `extendTheme` | 🟡 aparece o teto de novo | 🟢 sem camada de abstração |
| **Mês 6+** | 🔴 briga com anatomia de componente | 🟡 igual, com API melhor | 🟢 é só React + classes |
| **Onboarding de dev novo** | conhecer a API do Chakra | conhecer a API da v3 | conhecer Tailwind (mercado inteiro conhece) |

### 8.2 O que o time precisa aprender

Três conceitos, e só:

1. **Tailwind CSS v4** — utilitários e tokens. Quem já usa, curva ≈ zero.
2. **`cva` (class-variance-authority)** — como variantes de componente são declaradas.
3. **`asChild`** — polimorfismo das primitivas (`<Button asChild><Link/></Button>` vira `<a>`).

### 8.3 Evidência de esforço real

Portei a mesma aplicação (busca com debounce, 2 filtros, paginação, tabela, modal, toast,
favoritos) entre as três bibliotecas nesta avaliação:

| | LOC do componente principal | Arquivos gerados pelo CLI |
|---|---:|---:|
| Chakra v2 | 567 | 0 |
| Chakra v3 | 556 | 10 snippets (~450 LOC) |
| **shadcn/ui** | **449** | 19 arquivos (1.561 LOC) |

O componente de aplicação ficou **21 % menor** em shadcn. O CLI `add` de 19 componentes levou
**34 s**.

### 10.4 Plano de capacitação (2 semanas, paralelo à fundação)

| Ação | Duração | Participantes |
|---|---|---|
| Workshop "Tailwind v4 + tokens": utilitários, `@theme inline`, dark mode | 2 h | time todo |
| Workshop "Anatomia de um componente shadcn": ler `button.tsx`, adicionar variante, `cva`, `asChild` | 2 h | time todo |
| Sessão "Tematização em 4 níveis" com a rota `/tema` do protótipo (tokens → tokens novos → variantes → tema por escopo) | 1 h | time todo |
| Pareamento na construção dos 3 primeiros componentes | 1 dia | 2 devs por vez |
| Escrever o guia interno `docs/ui-guidelines.md` | — | 1 dev sênior |

---


## 11. Riscos e mitigações

| ID | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| **R1** | Time sem experiência em Tailwind atrasa as primeiras telas | Média | Médio | Capacitação do §10.4 **antes** da primeira sprint de UI; pareamento nos 3 primeiros componentes |
| **R2** | Regressão de acessibilidade (shadcn mediu 93 contra 100 da v3) | Média | Alto | `eslint-plugin-jsx-a11y` no CI; Lighthouse a11y ≥ 95 como gate de PR; **adapters que ligam ARIA por construção (§8.3b)** |
| **R3** | Cada dev instalar componentes por conta e o design system dispersar | Média | Médio | Conjunto aprovado definido na fase de fundação (§12.3); adição de componente novo passa por PR |
| **R4** | Alguém editar `components/ui/` e quebrar a garantia de atualização | Média | Médio | **Camada de adaptação (§8)** + lint que bloqueia o import; `components/ui` fora do code review |
| **R5** | Divergência do upstream ao longo do tempo | Baixa | Baixo | Fluxo trimestral do §8.7 — `--overwrite` é seguro porque ninguém edita o vendored |
| **R6** | Registry externo com licença incompatível | Baixa | Alto | Checklist de aprovação do §9.6 — validação de licença **no artefato**, não no repositório |
| **R7** | Base UI virar padrão de facto e nos deixar em Radix "legado" | Baixa | Médio | O contrato entre camadas é o mesmo; o CLI suporta a troca (`--base`). Reavaliar em 6 meses |
| **R8** | Bundle do Tailwind crescer com o app | Baixa | Baixo | O CSS cresce com classes *distintas*, não com uso: medimos +1,8 KB gzip ao adicionar uma rota inteira |
| **R9** | Peso de `node_modules` maior que o esperado | Baixa | Baixo | Checklist do §12.2; verificação O6 no CI |

---

---

## 12. Setup inicial

Não há plano de migração: o projeto nasce em shadcn. O que segue é a **sequência de bootstrap**,
toda ela verificada neste benchmark.

### 12.1 Bootstrap (meio dia)

```bash
# 1. Scaffold
npx create-next-app@latest <app> --ts --app --no-src-dir --import-alias "@/*" --use-npm

# 2. shadcn com Radix como primitiva (ver §7.1 sobre Base UI)
npx shadcn@latest init -d --base radix

# 3. ⚠️ Corrigir a armadilha do CLI: ele grava a si mesmo em dependencies
npm uninstall shadcn && npm i -D shadcn

# 4. Componentes base do produto
npx shadcn@latest add button input label card dialog select table tabs \
  badge avatar skeleton separator sonner dropdown-menu alert progress
```

### 12.2 Correções obrigatórias pós-`init`

| O quê | Por quê |
|---|---|
| Mover `shadcn` para `devDependencies` | o CLI se instala em `dependencies` e arrasta 71,5 MB / 7.156 arquivos para produção (§5.6) |
| Corrigir `--font-sans: var(--font-sans)` em `@theme inline` | auto-referência que o Tailwind v4 resolve em tempo de parse — não resolve nada. Usar o nome literal da família |
| Mover as variáveis de fonte do `<body>` para o `<html>` | senão `next/font` não alcança os tokens |

### 12.3 Fundação (1 semana, paralela à capacitação do §10.4)

- [ ] **`components/ui/` congelada** — somente leitura, a partir de agora (§8)
- [ ] **`components/ds/` criada** com o barrel e os primeiros adapters (`Button`, `Field`)
- [ ] **Regra de lint `no-restricted-imports`** bloqueando `@/components/ui/*` fora de `ds/` (§8.6)
- [ ] `globals.css` com os tokens da marca — claro **e** escuro, desde o início
- [ ] `docs/ui-guidelines.md`: os 4 níveis de customização (§8.4), quando criar adapter, checklist de a11y
- [ ] Gates no CI: `eslint-plugin-jsx-a11y`, Lighthouse a11y ≥ 95, orçamento de bundle por rota (§13)
- [ ] Definir e registrar o conjunto de componentes aprovados — evita que cada dev instale o seu

### 12.4 Regras permanentes

| Regra | Garantida por |
|---|---|
| Ninguém edita `components/ui/` | lint + `ignores` no ESLint (§8.6) |
| Feature importa só de `@/components/ds` | `no-restricted-imports` |
| Componente de registry externo passa por revisão de licença | checklist do §9.6 |
| Atualização do vendored é trimestral, em branch próprio | fluxo do §8.7 |

---

## 13. Orçamentos e critérios de aceite

Projeto novo não tem "linha de base a melhorar" — tem **orçamento a respeitar**. Os números do
benchmark viram o teto, verificado no CI a cada PR.

| ID | Métrica | Orçamento | Verificação |
|---|---|---:|---|
| O1 | Payload gzip por rota (HTML + JS + CSS) | **≤ 250 KB** | gate de bundle no CI |
| O2 | Erros de hydration no console em produção | **0** | Lighthouse `errors-in-console` |
| O3 | Lighthouse boas práticas | **100** | gate de PR |
| O4 | Lighthouse acessibilidade | **≥ 95** | gate de PR + `jsx-a11y` |
| O5 | `next build` a frio | **≤ 25 s** | métrica de CI, alerta ao estourar |
| O6 | `node_modules` em produção | **≤ 470 MB** | verificação pós-`npm ci --omit=dev` |
| O7 | Componentes visuais sem `"use client"` | **≥ 60 %** dos componentes de apresentação | revisão de PR |
| O8 | Arquivos editados em `components/ui/` | **0** | lint |

> O1 tem folga proposital sobre os 235,3 KB medidos: o app real terá mais telas e mais
> dependências. O ponto do orçamento é **detectar regressão**, não espremer o último KB.

---

## 14. Decisão requerida

| Pergunta | Recomendação |
|---|---|
| Biblioteca de UI do projeto novo | **shadcn/ui + Tailwind CSS v4** |
| Adotar Chakra UI (v2 ou v3)? | **Não** — v2 congelada, v3 sem ganho e com bug sem correção no Next 16 |
| Primitiva headless | **Radix** (`--base radix`); reavaliar Base UI em 6 meses |
| Camada de adaptação `components/ds/` desde o dia 1 | **Sim** — é o que neutraliza o principal custo do shadcn |
| Origin UI / coss UI | **Não adotar agora** — mudança de dono, licença a validar, base em Base UI (§9.5) |
| Aprovar o bootstrap do §12 | **Sim** — meio dia de setup + 1 semana de fundação |

---

## Anexo A — Reprodutibilidade

O repositório do benchmark contém as três aplicações e o script de medição:

```
├── app-chakra/       Next 16 + React 19 + Chakra UI v2 (Emotion)
├── app-chakra-v3/    Next 16 + React 19 + Chakra UI v3 (Ark UI / Zag.js)
├── app-shadcn/       Next 16 + React 19 + shadcn/ui (Radix) + Tailwind v4
│   ├── components/ui/    vendored, pristine do registry
│   ├── components/ds/    camada de adaptação (§8)
│   ├── app/tema/         4 níveis de customização de tema
│   └── app/adapters/     os 3 padrões de adapter rodando
├── bench/medir.sh    mede node_modules, build, dev, payload e TTFB dos três
└── RELATORIO.md      relatório técnico detalhado
```

```bash
bash bench/medir.sh
```

Duas rotas do `app-shadcn` servem de protótipo verificável:

- **`/tema`** — os quatro níveis de customização descritos no §8.4, com dois temas na mesma página
- **`/adapters`** — os três padrões de adapter do §8.3 em build de produção

## Anexo B — Ambiente da medição

Linux x64 · Node.js 22.12.0 · npm 10.9.0 · Next.js 16.3.4 · React 19.2.8 · Turbopack
Chakra UI 2.10.10 + Emotion 11 + framer-motion 11 · Chakra UI 3.37.0 + Ark UI 5.39.0 ·
Tailwind CSS 4.3.3 + radix-ui 1.6.7 + shadcn CLI 4.21.0 · lucide-react nos três.
Medições de 10 a 14 de setembro de 2026.
