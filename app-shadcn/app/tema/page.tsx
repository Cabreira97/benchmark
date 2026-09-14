import Link from "next/link";

import { Playground } from "./playground";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Customização de tema — shadcn/ui",
  description: "Os quatro níveis de customização de tema no shadcn/ui + Tailwind CSS v4",
};

const NIVEIS = [
  {
    n: "01",
    titulo: "Trocar os valores dos tokens",
    arquivo: "app/globals.css",
    texto:
      "Editar --primary, --radius, --border e companhia dentro de :root e .dark. Atinge todos os componentes de uma vez. É onde 90 % da customização acontece.",
  },
  {
    n: "02",
    titulo: "Criar tokens novos",
    arquivo: "app/globals.css",
    texto:
      "Declarar o valor em :root e mapeá-lo em @theme inline. Sem a segunda etapa a classe utilitária não é gerada. Foi assim que bg-brand e text-success passaram a existir.",
  },
  {
    n: "03",
    titulo: "Adicionar variantes ao componente",
    arquivo: "components/ui/button.tsx",
    texto:
      "O cva é código do projeto: basta acrescentar uma chave no objeto variants. O TypeScript deriva o tipo da prop sozinho, via VariantProps.",
  },
  {
    n: "04",
    titulo: "Retematizar por escopo",
    arquivo: "app/globals.css",
    texto:
      "Tokens são custom properties e herdam pela árvore. Uma classe no container retematiza a subárvore inteira — inclusive dois temas diferentes na mesma página.",
  },
];

export default function TemaPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <header>
        <div className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
          shadcn/ui · Tailwind CSS v4
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Customização de tema</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Nenhum componente desta página recebeu prop de estilo. Tudo o que muda abaixo vem de{" "}
          <strong className="text-foreground">custom properties do CSS</strong> — trocadas por uma classe
          no container ou por um valor inline.
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          A rota <code>/</code> do benchmark continua intacta.{" "}
          <Link href="/" className="underline underline-offset-4">
            voltar para o app
          </Link>
        </p>
      </header>

      <Separator className="my-8" />

      <Playground />

      <Separator className="my-10" />

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Os quatro níveis</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
          {NIVEIS.map((nivel) => (
            <div key={nivel.n} className="bg-card p-5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-muted-foreground">{nivel.n}</span>
                <h3 className="font-medium">{nivel.titulo}</h3>
              </div>
              <div className="mt-1 ml-8 font-mono text-xs text-muted-foreground">{nivel.arquivo}</div>
              <p className="mt-2 ml-8 text-sm text-muted-foreground">{nivel.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Como ficaria no Chakra UI v2</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium">Tarefa</th>
                <th className="px-4 py-2.5 text-left font-medium">shadcn/ui</th>
                <th className="px-4 py-2.5 text-left font-medium">Chakra UI v2</th>
              </tr>
            </thead>
            <tbody className="[&_td]:border-b [&_td]:px-4 [&_td]:py-2.5 [&_tr:last-child_td]:border-0">
              <tr>
                <td>Trocar a cor da marca</td>
                <td>
                  <code>--primary</code> em <code>globals.css</code>
                </td>
                <td>
                  <code>extendTheme</code> + escala 50→900 nomeada
                </td>
              </tr>
              <tr>
                <td>Variante nova de botão</td>
                <td>chave no objeto do cva</td>
                <td>
                  <code>defineStyleConfig</code> registrado em <code>components</code>
                </td>
              </tr>
              <tr>
                <td>Dois temas na mesma página</td>
                <td>classe no container</td>
                <td>
                  segundo <code>ChakraProvider</code> aninhado
                </td>
              </tr>
              <tr>
                <td>Ler o estilo no DevTools</td>
                <td>
                  <code>bg-primary h-8 px-2.5</code>
                </td>
                <td>
                  <code>css-1vveiwr</code> (hash do Emotion)
                </td>
              </tr>
              <tr>
                <td>Mudar uma parte interna</td>
                <td>editar o JSX do componente</td>
                <td>depende da parte estar exposta na anatomia</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
