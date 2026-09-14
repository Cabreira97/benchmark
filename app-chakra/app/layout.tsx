import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ColorModeScript } from "@chakra-ui/react";
import { Providers } from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Multiverso UI — Chakra UI v2",
  description: "Benchmark Chakra UI v2 sobre Next.js 16",
};

// O valor precisa ser repetido aqui: importar `theme` neste Server Component
// quebraria o build, porque extendTheme() e client-only no Chakra v2.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body suppressHydrationWarning>
        <ColorModeScript initialColorMode="light" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
