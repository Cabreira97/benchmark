"use client";

// Chakra v3 troca extendTheme() por createSystem()/defineConfig().
// Isso parece dado puro, mas NÃO É seguro importar num Server Component:
// createSystem() processa a anatomia dos componentes do Ark UI em tempo
// de import, e isso quebra com um erro opaco vindo de dentro do Ark UI
// (ex.: "accordionAnatomy.extendWith is not a function"), bem menos claro
// que o aviso explícito da v2 ("extendTheme is on the client").
// Testado e confirmado: manter "use client" aqui é obrigatório.
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-geist-sans)" },
        body: { value: "var(--font-geist-sans)" },
        mono: { value: "var(--font-geist-mono)" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
