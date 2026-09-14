"use client";

// Chakra v2: extendTheme() so pode rodar no client bundle.
// Importar este arquivo a partir de um Server Component quebra o build
// com "Attempted to call extendTheme() from the server".
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

export const theme = extendTheme({
  config,
  styles: {
    global: {
      "html, body": { minHeight: "100%" },
    },
  },
  fonts: {
    heading: "var(--font-geist-sans)",
    body: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },
});
