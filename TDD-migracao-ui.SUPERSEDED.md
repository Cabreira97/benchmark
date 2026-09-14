# TDD — Migração da biblioteca de UI: Chakra UI v2 → shadcn/ui

| Campo | Valor |
|---|---|
| **Status** | Proposto — aguardando decisão |
| **Tipo** | Technical Design Document / ADR |
| **Autor** | Thiago Cabreira |
| **Data** | 14 de setembro de 2026 |
| **Decisão proposta** | Adotar **shadcn/ui + Tailwind CSS v4**. Descontinuar Chakra UI v2. **Não** migrar para Chakra UI v3. |
| **Evidência** | Benchmark próprio com 3 aplicações idênticas em Next.js 16.3.4 — código e método reproduzíveis (anexo A) |
| **Reversibilidade** | Alta na fase 1-2 (coexistência), média a partir da fase 3 |

---

## 1. Sumário executivo

Estamos em **Chakra UI v2**, uma biblioteca que recebeu **uma única publicação nos últimos
12 meses** e apresenta um *hydration mismatch* estrutural, sem correção conhecida, no App
Router do Next.js. A decisão de sair da v2 é forçada pelo estado do pacote, não por preferência.

A pergunta real é **para onde ir**: Chakra UI v3 (caminho de menor resistência conceitual) ou
shadcn/ui (mudança de paradigma).

Para responder isso com dados e não com opinião, construí **três aplicações idênticas** — mesmas
rotas, mesma API pública, mesma hierarquia de componentes, mesmo `next.config.ts` — e medi tudo
na mesma máquina, na mesma sessão.

**O resultado surpreendeu:** Chakra v3 **não é uma evolução de performance** sobre a v2. Em
bundle, build e tempo de compilação em dev, a v3 é **igual ou pior** que a v2. Ela moderniza a
arquitetura e volta a receber releases, mas não resolve o problema técnico que nos faria migrar —
e adiciona atritos novos.

**shadcn/ui vence em todos os eixos técnicos medidos**, e o custo dela (você passa a manter o
código-fonte dos componentes) é conhecido, limitado e mensurável.

### Números que sustentam a decisão

| Métrica (rota principal) | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| Payload total (gzip) | 287,8 KB | 298,2 KB | **235,3 KB** |
| Nós no DOM | 731 | 557 | **487** |
| Tags `<style>` em runtime | 61 | 56 | **1** |
| CSS não-cacheável embutido no HTML | 49,9 KB | 89,1 KB | **0 KB** |
| `next build` a frio | 22,1 s | 44,7 s | **16,5 s** |
| 1ª compilação de rota em dev | 6,4 s | ~29 s | **4,9 s** |
| `node_modules` em produção | 469,5 MB | 475,0 MB | **456,3 MB** |
| *Hydration mismatch* | sim, sem correção | sim, correção oficial quebrada | **não** |
| Releases nos últimos 12 meses | **1** | 14 | 62 |

---

## 2. Contexto e problema

### 2.1 O que temos hoje

Chakra UI v2 (`@chakra-ui/react@2.10.10`), com Emotion como motor de CSS-in-JS e `framer-motion`
como dependência de animação.

### 2.2 Por que não podemos ficar

**P1 — O pacote está congelado.**
A linha 2.x recebeu **uma release em 12 meses** (`2.10.10`, 04/06/2026). Antes dela, um intervalo
de **doze meses e meio** (`2.10.9` é de 21/05/2025). Todo o esforço do time mantenedor vai para a
v3. Isso significa: nenhuma correção de compatibilidade com novas versões de React ou Next.js
chegará à v2.

**P2 — *Hydration mismatch* estrutural, sem correção.**
Toda rota renderizada no servidor emite no console do navegador:

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

**Consequência prática:** console poluído em produção, re-renderização forçada de subárvore no
cliente (custo de CPU no dispositivo do usuário) e perda de 4 pontos na nota de boas práticas do
Lighthouse (96 em vez de 100).

**P3 — Custo de performance do CSS-in-JS em runtime.**
O Emotion injeta o CSS **dentro do HTML de cada resposta** (49,9 KB na rota principal) e cria
**61 tags `<style>`** em tempo de execução. Esse custo não é cacheável entre navegações e escala
com o tamanho da aplicação, porque é pago por render.

**P4 — Zero suporte a React Server Components.**
Todo componente Chakra v2 é Client Component. Uma página puramente visual — sem estado, sem
eventos — ainda precisa de `"use client"` e carrega o runtime inteiro. Medimos isso na rota
`/estatico`: **220,3 KB de JS gzip** para renderizar o que é, conceitualmente, HTML estático.

### 2.3 Restrições

- Stack alvo: **Next.js 16.3.4, App Router, React 19.2.8, Turbopack** (padrão em dev *e* build
  desde o Next 16 — não existe mais "webpack em produção, Turbopack em dev").
- O time precisa continuar entregando durante a migração — não há janela para *big bang rewrite*.
- Qualquer biblioteca escolhida precisa ter licença permissiva e viável comercialmente.

---

## 3. Opções consideradas

### Opção A — Permanecer em Chakra UI v2

**Prós:** custo zero imediato; nenhum retrabalho; time já conhece a API.

**Contras:** aceita P1-P4 permanentemente; dívida técnica cresce a cada release de React/Next; o
*hydration mismatch* nunca será corrigido; ficamos presos a uma API que o próprio autor abandonou.

**Veredito:** ❌ Rejeitada. Não é uma decisão, é adiamento.

### Opção B — Migrar para Chakra UI v3

Caminho intuitivo: mesma marca, mesmo time mantenedor, cadência restaurada (14 releases/12 meses).

Construí a aplicação completa em v3 para avaliar de fato, e **não confirmou a expectativa**:

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

**Além disso, a v3 introduz três atritos novos:**

**B1 — A correção oficial do *hydration mismatch* não funciona no Next.js 16.**
A documentação do Chakra reconhece o bug e prescreve o fallback para Webpack:

> *"Turbopack Hydration Error […] it is recommended to use the `--webpack` flag in the development
> and build scripts"* — chakra-ui.com/docs/get-started/frameworks/next-app

Testei. **Os dois comandos falham**, cada execução com um módulo interno diferente ausente:

```
$ npx next dev --webpack
Error: Cannot find module 'next/dist/compiled/json5'
# processo encerra; porta deixa de responder

$ npx next build --webpack
Error: Cannot find module 'next/dist/compiled/browserify-zlib'
$ npx next build --webpack   # segunda execução
Error: Cannot find module 'next/dist/compiled/string_decoder'
```

Três módulos diferentes em três execuções: o caminho de build via Webpack do Next 16.3.4 está
incompleto para esse fallback. **A correção documentada pelo fornecedor não existe na nossa
versão de plataforma.**

**B2 — `createSystem()` quebra em Server Component com erro opaco.**
Na v2, importar o tema de um Server Component dava um erro explícito e acionável
(`"extendTheme is on the client"`). Na v3, o mesmo erro vira:

```
TypeError: bf.accordionAnatomy.extendWith is not a function
```

Nenhuma menção a client/server. É um erro pior para diagnosticar.

**B3 — Reescrita total de chamadas, sem codemod.**
A v3 muda toda a API de componentes compostos para notação de ponto: `<Modal>` → `Dialog.Root` /
`Dialog.Content` / `Dialog.Header`; `<FormControl>` → `Field.Root`; `<Tabs>` passa a exigir
`value` em vez de índice. **Não existe migração automática** — o guia oficial é uma lista de
renomeações manuais, componente por componente.

**Veredito:** ❌ Rejeitada. Se vamos pagar o custo de reescrever cada chamada de componente
(B3), o destino deveria resolver os problemas que nos fizeram sair — e a v3 não resolve o P2,
piora P3 em parte e não elimina P4.

### Opção C — Migrar para shadcn/ui + Tailwind CSS v4 ✅

**Veredito:** ✅ **Recomendada.** Detalhada nas seções 5 a 8.

---

## 4. Evidência: método e resultados

### 4.1 Método

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

### 4.2 Payload entregue ao navegador

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

### 4.3 DOM e runtime

| Métrica | Rota | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---|---:|---:|---:|
| Nós no DOM | `/` | 731 | 557 | **487** |
| Nós no DOM | `/estatico` | 119 | 106 | **75** |
| Tags `<style>` criadas em runtime | `/` | 61 | 56 | **1** |

### 4.4 Tempos

| Métrica | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| TTFB servidor — `/` | 298 ms | **148 ms** | 179 ms |
| TTFB servidor — `/estatico` | 3,8 ms | 6,4 ms | **3,2 ms** |
| DOMContentLoaded — `/` | 425 ms | 521 ms | **424 ms** |
| Load — `/` | 474 ms | 650 ms | **425 ms** |
| Load — `/estatico` | 80,3 ms | 231,2 ms | **53,9 ms** |

### 4.5 Build e ciclo de desenvolvimento

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

### 4.6 Peso de dependências (instalação de produção, `npm ci --omit=dev`)

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

### 4.7 Qualidade (Lighthouse desktop)

| Categoria | Chakra v2 | Chakra v3 | **shadcn/ui** |
|---|---:|---:|---:|
| Acessibilidade | 97 | **100** | 93 |
| Boas práticas | 96 | 96 | **100** |
| SEO | 100 | 100 | 100 |

**Leitura honesta:** este é o único eixo em que shadcn perde. A v3 (Ark UI) resolve rótulos ARIA
automaticamente onde o shadcn deixa por conta do desenvolvedor. As falhas medidas no shadcn foram
`aria-progressbar-name` (faltou `aria-label` em um `<Progress>` — erro do nosso código, não da
biblioteca) e `color-contrast` em texto secundário. **Mitigação: risco R3 (§10) e, em código, o adapter `Field` (§7.3b).**

---

## 5. Decisão

> **Adotar shadcn/ui + Tailwind CSS v4** como biblioteca de interface padrão.
> **Descontinuar Chakra UI v2.** **Não** migrar para Chakra UI v3.

### Justificativa em ordem de peso

1. **Resolve o P2.** Zero *hydration mismatch* — Lighthouse boas práticas 100/100. Nenhuma das
   opções Chakra resolve.
2. **Resolve o P3 e o P4.** CSS estático externo e cacheável (0 KB inline, 1 tag `<style>`), e
   componentes puramente visuais (Card, Badge, Table, Alert, Separator, Input, Skeleton) rodam
   como **Server Components de verdade**, sem `"use client"`.
3. **Menor payload e build mais rápido** em todas as rotas medidas.
4. **Maior cadência e comunidade** do ecossistema (§8).
5. **Se vamos reescrever cada chamada de componente de qualquer forma** (inevitável tanto no
   caminho v3 quanto no shadcn), o destino deve ser o que resolve mais problemas.

---

## 6. shadcn/ui — vantagens e desvantagens

### 6.1 O que shadcn é (e o que não é)

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
> (10,1 M downloads/semana contra 353 k do Base UI). **Recomendação: padronizar em `radix` na
> fase 1** pela maturidade e volume de uso, e reavaliar Base UI em 6 meses.

### 6.2 Vantagens

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

### 6.3 Desvantagens (avaliação honesta)

| # | Desvantagem | Severidade | Mitigação |
|---|---|---|---|
| D1 | **Você passa a manter ~1.561 LOC** de componentes no repositório | Média→Baixa | **Camada de adaptação (§7)**: `components/ui` vira somente-leitura e sai do code review; o que se mantém de fato são ~200 LOC de adapter |
| D2 | **Não existe `npm update` para componentes** — correções do upstream não chegam sozinhas | Média→Baixa | **Camada de adaptação (§7)** torna `--overwrite` seguro; fluxo trimestral no §7.7 |
| D3 | **Acessibilidade depende mais do desenvolvedor** | Média | Lint de a11y no CI + Lighthouse como gate de PR (R3), **e adapters que ligam ARIA por construção (§7.3b)** |
| D4 | **Exige saber Tailwind** | Baixa-Média | Plano de capacitação, §9 |
| D5 | **Sem combobox com busca pronto** | Baixa | Compor `Command` + `Popover` (receita documentada) ou instalar de registry externo |
| D6 | **CLI se instala em `dependencies`** | Baixa | Uma linha de correção, entra na checklist (§4.6) |
| D7 | **Mais arquivos no projeto** (26 vs 7 no v2) | Baixa | São arquivos pequenos e isolados em `components/ui/` |
| D8 | **CSS externo de 71 KB** existe mesmo em página mínima | Baixa | 12,3 KB gzip, cacheado uma vez para o app inteiro — amortiza a partir da 2ª rota |

**A troca central, em uma frase:** o Chakra customiza por **configuração** (rápido no começo, com
teto quando a API não cobre o caso); o shadcn customiza por **posse do código** (sem teto, com
custo de manutenção). Para um produto que vive anos, a ausência de teto vale mais.

---

## 7. Arquitetura de componentes: a camada de adaptação

Esta seção responde à desvantagem **D1/D2** e ao risco **R4**: *"você passa a manter 1.561 LOC
e não existe `npm update` para componentes"*. A resposta é arquitetural, não processual.

### 7.1 O princípio

> **`components/ui/` é código gerado. Ninguém edita. Nunca.**
> Toda customização vive em `components/ds/`, uma camada de adaptação que compõe por cima.

Se ninguém editar o vendored, ele permanece idêntico ao upstream — e
`npx shadcn@latest add <componente> --overwrite` volta a ser uma operação **segura e rotineira**,
em vez de um merge manual arriscado. D2 e R4 deixam de existir.

### 7.2 Prova de que o problema é real

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

Trocar um import resolveu tudo. O compilador vira a rede de segurança da migração.

### 7.3 Árvore de pastas

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

### 7.4 Quatro níveis de customização, em ordem de preferência

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

### 7.5 O barrel: ponto único de import

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

### 7.6 Tornando a regra obrigatória (não um acordo verbal)

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

### 7.7 Fluxo de atualização (o que D2/R4 vira na prática)

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

### 7.8 Protótipo verificável

A rota **`/adapters`** do `app-shadcn` demonstra os três padrões funcionando em build de produção:
variantes da casa, `Field` com a11y ligada, e `ConfirmDialog` composto. Todo o código desta seção
está no repositório e compila — `npx tsc --noEmit` e `npm run build` limpos.


---

## 8. Ecossistema e complementos

O CLI do shadcn suporta **registries nomeados**, então bibliotecas de terceiros se instalam pelo
mesmo comando e caem no mesmo sistema de tokens:

```jsonc
// components.json
{
  "registries": {
    "magicui": { "url": "https://magicui.design/r/{name}.json" },
    "acme":    { "url": "https://interno.empresa.com.br/r/{name}.json",
                 "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" } }
  }
}
```

```bash
npx shadcn@latest add @magicui/magic-card
npx shadcn@latest add https://algum-registry.com/r/timeline.json
```

### 7.1 Complementos avaliados

| Projeto | O que é | Estrelas | Licença | Atividade | Recomendação |
|---|---|---:|---|---|---|
| **Tailwind CSS v4** | motor de estilo — base obrigatória | 97,5 k ★ | MIT | ativo (92,7 M downloads/sem.) | ✅ **Adotar** — é pré-requisito |
| **Radix UI** | primitivas headless (padrão do nosso benchmark) | 19,3 k ★ | MIT | ativo (10,1 M downloads/sem.) | ✅ **Adotar** como `--base` na fase 1 |
| **Base UI** | primitivas dos criadores do Radix/MUI; hoje é o preset padrão do CLI | 10,9 k ★ | MIT | muito ativo (push diário) | ⏳ **Reavaliar em 6 meses** — adoção ainda baixa (353 k/sem.) |
| **lucide-react** | ícones (já usado nos 3 apps do benchmark) | — | ISC | 55,8 M downloads/sem. | ✅ **Adotar** — padrão do shadcn |
| **Magic UI** | componentes animados para landing/marketing | 22,3 k ★ | MIT | ativo (push 13/09/2026) | ⚠️ **Caso a caso** — ótimo para marketing, evitar em app interno (traz animação pesada) |
| **coss UI** (ex-**Origin UI**) | ~362 componentes avançados: timeline, inputs ricos, autocomplete | 10,6 k ★ | ver nota ⚠️ | ativo (push 08/09/2026) | ⚠️ **Adotar com cautela** — ver 7.2 |
| **Tremor** | componentes de dashboard/gráfico | 3,6 k ★ | Apache-2.0 | ⛔ **parado desde 10/10/2025** | ❌ **Não adotar** — ~11 meses sem commits |
| **v0 registry** | geração de UI por IA, instalável via `@v0/...` | — | — | ativo | ✅ **Liberado para prototipagem**, revisão humana antes de merge |

### 7.2 ⚠️ Nota importante sobre Origin UI

O **Origin UI foi adquirido pela Cal.com em 2026** e renomeado para **coss UI**
(`coss.com/ui`, repositório `cosscom/coss`). Implicações para nós:

1. **O Origin UI "clássico" virou legado** — permanece disponível como snapshot pré-aquisição,
   com **suporte e manutenção limitados** declarados pelos próprios mantenedores.
2. **O coss UI foi reconstruído sobre Base UI**, não sobre Radix. Misturar coss UI com componentes
   shadcn em `--base radix` pode trazer duas camadas de primitivas para o bundle.
3. **Licença exige verificação por pacote:** o monorepo `cosscom/coss` está sob **AGPL-3.0**,
   enquanto o pacote `apps/ui` (a biblioteca de componentes em si) declara **MIT**. AGPL é
   incompatível com boa parte das políticas corporativas.

**Recomendação:** não adotar coss UI na fase 1. Se surgir necessidade de um componente específico
dele, tratar como decisão pontual, **com validação jurídica da licença do artefato copiado** e
verificação de que não arrasta Base UI para um projeto padronizado em Radix.

### 7.3 Princípio de governança para registries

> Componente de registry externo **entra como código nosso** (é copy-paste, igual ao shadcn).
> Antes do merge: revisar o diff, conferir se usa apenas tokens do nosso tema, e confirmar a
> licença do artefato. Registry externo **não é dependência** — é contribuição de terceiro no
> nosso repositório.

---

## 9. Curva de aprendizado e capacitação

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

### 8.4 Plano de capacitação (2 semanas, paralelo à fase 1)

| Ação | Duração | Participantes |
|---|---|---|
| Workshop "Tailwind v4 + tokens": utilitários, `@theme inline`, dark mode | 2 h | time todo |
| Workshop "Anatomia de um componente shadcn": ler `button.tsx`, adicionar variante, `cva`, `asChild` | 2 h | time todo |
| Sessão "Tematização em 4 níveis" com a rota `/tema` do protótipo (tokens → tokens novos → variantes → tema por escopo) | 1 h | time todo |
| Pareamento na migração dos 3 primeiros componentes | 1 dia | 2 devs por vez |
| Escrever o guia interno `docs/ui-guidelines.md` | — | 1 dev sênior |

---

## 10. Riscos e mitigações

| ID | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| **R1** | Inconsistência visual durante coexistência das duas bibliotecas | Alta | Médio | Mapear tokens do tema Chakra atual para CSS custom properties **antes** de migrar qualquer tela; migrar por rota inteira, nunca por componente solto |
| **R2** | Estimativa de esforço estourar | Média | Alto | Fase 0 mede na prática (migrar 1 rota real e cronometrar) antes de comprometer prazo das demais |
| **R3** | Regressão de acessibilidade (shadcn teve 93 vs 100 da v3) | Média | Alto | `eslint-plugin-jsx-a11y` no CI; Lighthouse a11y ≥ 95 como *gate* de PR; checklist de `aria-label` em Progress/IconButton/inputs sem label visível |
| **R4** | Divergência do upstream (D2) | Baixa | Baixo | **Camada de adaptação (§7)** — `components/ui` nunca é editado, então `--overwrite` é rotina. Fluxo no §7.7; lint impede a violação (§7.6) |
| **R5** | Peso de `node_modules` maior que o esperado (D6/§4.6) | Baixa | Baixo | Checklist de pós-`init`: mover `shadcn` para `devDependencies`; verificar no CI |
| **R6** | Registry externo com licença incompatível (§8.2) | Baixa | Alto | Governança do §8.3 — validação de licença obrigatória antes do merge |
| **R7** | Base UI virar padrão de facto e nos deixar em Radix "legado" | Baixa | Médio | Contrato entre camadas é o mesmo; migração é suportada pelo CLI (`--base`). Reavaliar em 6 meses |
| **R8** | Bundle do Tailwind crescer com o app | Baixa | Baixo | O CSS cresce com classes *distintas*, não com uso; medimos +1,8 KB gzip ao adicionar uma rota inteira de demonstração de temas |

---

## 11. Plano de migração

**Estratégia: coexistência com corte por rota.** As duas bibliotecas convivem — Chakra continua
servindo o que ainda não foi migrado, shadcn assume rota por rota. Sem *big bang*.

### Fase 0 — Prova e calibragem *(1 semana)*

- [ ] `npx shadcn@latest init -d --base radix` em branch dedicado
- [ ] Mover `shadcn` para `devDependencies` (§4.6)
- [ ] Corrigir `--font-sans: var(--font-sans)` gerado em `@theme inline` (auto-referência que não resolve — usar nome literal da família)
- [ ] Mapear os tokens do tema Chakra atual → CSS custom properties em `globals.css`
- [ ] Migrar **uma rota real de complexidade média** e cronometrar
- [ ] Medir antes/depois com `bench/medir.sh`
- **Saída:** estimativa calibrada para as demais rotas + decisão go/no-go final

### Fase 1 — Fundação *(2 semanas, paralela à capacitação)*

- [ ] `components/ui/` com o conjunto base instalado — **e congelado** (somente leitura)
- [ ] **`components/ds/` criada** com o barrel e os primeiros adapters (`Button`, `Field`) — §7
- [ ] **Regra de lint `no-restricted-imports`** bloqueando `@/components/ui/*` fora de `ds/` — §7.6
- [ ] `globals.css` com os tokens da marca (claro + escuro)
- [ ] `docs/ui-guidelines.md`: os 4 níveis de customização (§7.4), quando criar adapter, checklist de a11y
- [ ] Gates no CI: `eslint-plugin-jsx-a11y`, Lighthouse a11y ≥ 95, orçamento de bundle por rota
- [ ] Workshops (§9.4)

### Fase 2 — Rotas novas *(contínuo, a partir da semana 3)*

- [ ] **Toda tela nova nasce em shadcn.** Nenhum componente Chakra novo é adicionado.
- [ ] Regra de lint bloqueando `import ... from "@chakra-ui/react"` em arquivos novos

### Fase 3 — Migração das rotas existentes *(iterativo, por prioridade)*

Ordem sugerida: **maior tráfego primeiro** (maior retorno em bytes), depois maior frequência de
manutenção, por último telas raramente tocadas.

- [ ] Uma rota por PR, com print antes/depois e números de bundle no corpo do PR
- [ ] Componente novo que precise de customização vira adapter em `ds/` — nunca edição em `ui/`
- [ ] Lighthouse comparativo obrigatório na descrição do PR

### Fase 4 — Remoção do Chakra *(1 semana)*

- [ ] `npm remove @chakra-ui/react @chakra-ui/next-js @emotion/react @emotion/styled framer-motion`
- [ ] Remover `Providers` do Chakra do `layout.tsx`
- [ ] Medição final e registro do ganho

---

## 12. Critérios de sucesso

Mensuráveis, com linha de base já coletada:

| # | Métrica | Linha de base (Chakra v2) | Meta |
|---|---|---:|---:|
| S1 | Payload gzip da rota principal | 287,8 KB | **≤ 240 KB** |
| S2 | Erros de hydration no console em produção | 1 por rota SSR | **0** |
| S3 | Lighthouse boas práticas | 96 | **100** |
| S4 | Lighthouse acessibilidade | 97 | **≥ 95** (não regredir) |
| S5 | `next build` a frio | 22,1 s | **≤ 18 s** |
| S6 | 1ª compilação de rota em dev | 6,44 s | **≤ 5,5 s** |
| S7 | `node_modules` em produção | 469,5 MB | **≤ 460 MB** |
| S8 | Rotas migradas | 0 % | **100 % ao fim da fase 4** |

---

## 13. Decisão requerida

| Pergunta | Recomendação |
|---|---|
| Sair do Chakra UI v2? | **Sim** — pacote congelado, bug sem correção |
| Destino: v3 ou shadcn? | **shadcn/ui + Tailwind v4** |
| Primitiva headless | **Radix** (`--base radix`) na fase 1; reavaliar Base UI em 6 meses |
| Origin UI / coss UI | **Não adotar agora** — mudança de dono, licença a validar, base em Base UI (§8.2) |
| Aprovar fase 0 (1 semana) | **Sim** — calibra estimativa antes de qualquer compromisso de prazo |

---

## Anexo A — Reprodutibilidade

Repositório do benchmark contém as três aplicações e o script de medição:

```
├── app-chakra/       Next 16 + React 19 + Chakra UI v2 (Emotion)
├── app-chakra-v3/    Next 16 + React 19 + Chakra UI v3 (Ark UI / Zag.js)
├── app-shadcn/       Next 16 + React 19 + shadcn/ui (Radix) + Tailwind v4
│   ├── components/ui/    vendored, pristine do registry
│   ├── components/ds/    camada de adaptação (§7)
│   ├── app/tema/         4 níveis de customização de tema
│   └── app/adapters/     os 3 padrões de adapter rodando
├── bench/medir.sh    mede node_modules, build, dev, payload e TTFB dos três
└── RELATORIO.md      relatório técnico detalhado
```

```bash
bash bench/medir.sh
```

Duas rotas do `app-shadcn` servem de protótipo verificável:

- **`/tema`** — os quatro níveis de customização descritos no §7.4, com dois temas na mesma página
- **`/adapters`** — os três padrões de adapter do §7.3 em build de produção

## Anexo B — Ambiente da medição

Linux x64 · Node.js 22.12.0 · npm 10.9.0 · Next.js 16.3.4 · React 19.2.8 · Turbopack
Chakra UI 2.10.10 + Emotion 11 + framer-motion 11 · Chakra UI 3.37.0 + Ark UI 5.39.0 ·
Tailwind CSS 4.3.3 + radix-ui 1.6.7 + shadcn CLI 4.21.0 · lucide-react nos três.
Medições de 10 a 14 de setembro de 2026.
