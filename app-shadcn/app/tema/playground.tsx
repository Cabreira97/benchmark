"use client";

import { useState } from "react";
import { Check, Heart, Moon, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ds/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TemaId = "padrao" | "tema-teal" | "tema-violeta" | "tema-ambar";

const TEMAS: { id: TemaId; nome: string; swatch: string; radius: string; css: string }[] = [
  {
    id: "padrao",
    nome: "Padrão (neutral)",
    swatch: "oklch(0.205 0 0)",
    radius: "0.625rem",
    css: `/* nenhuma classe aplicada — vale o :root de globals.css */
:root {
  --primary: oklch(0.205 0 0);
  --radius: 0.625rem;
}`,
  },
  {
    id: "tema-teal",
    nome: "Teal",
    swatch: "oklch(0.52 0.105 190)",
    radius: "0.35rem",
    css: `.tema-teal {
  --brand:   oklch(0.52 0.105 190);
  --primary: oklch(0.52 0.105 190);
  --ring:    oklch(0.52 0.105 190);
  --accent:  oklch(0.95 0.025 190);
  --radius:  0.35rem;
}`,
  },
  {
    id: "tema-violeta",
    nome: "Violeta",
    swatch: "oklch(0.51 0.2 288)",
    radius: "1rem",
    css: `.tema-violeta {
  --brand:   oklch(0.51 0.2 288);
  --primary: oklch(0.51 0.2 288);
  --ring:    oklch(0.51 0.2 288);
  --accent:  oklch(0.95 0.03 288);
  --radius:  1rem;
}`,
  },
  {
    id: "tema-ambar",
    nome: "Âmbar",
    swatch: "oklch(0.62 0.15 62)",
    radius: "0.125rem",
    css: `.tema-ambar {
  --brand:   oklch(0.62 0.15 62);
  --primary: oklch(0.62 0.15 62);
  --ring:    oklch(0.62 0.15 62);
  --accent:  oklch(0.96 0.035 62);
  --radius:  0.125rem;
}`,
  },
];

/** Vitrine de componentes. Não sabe nada de tema — só lê os tokens que herdou. */
function Vitrine({ compacto = false }: { compacto?: boolean }) {
  const [ligado, setLigado] = useState(true);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button size={compacto ? "sm" : "default"}>Padrão</Button>
        <Button variant="brand" size={compacto ? "sm" : "default"}>
          Brand
        </Button>
        <Button variant="brand-soft" size={compacto ? "sm" : "default"}>
          Brand soft
        </Button>
        <Button variant="outline" size={compacto ? "sm" : "default"}>
          Outline
        </Button>
        <Button variant="success" size={compacto ? "sm" : "default"}>
          <Check /> Success
        </Button>
        <Button variant="destructive" size={compacto ? "sm" : "default"}>
          <Trash2 /> Excluir
        </Button>
      </div>

      {!compacto && (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="brand" size="xl">
            <Heart /> Tamanho xl
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="brand" size="icon" aria-label="Favoritar">
            <Heart />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge className="bg-brand text-brand-foreground">bg-brand</Badge>
        <Badge className="border-success/30 bg-success/12 text-success" variant="outline">
          bg-success/12
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={compacto ? "email-c" : "email"}>E-mail</Label>
          <Input id={compacto ? "email-c" : "email"} placeholder="voce@empresa.com.br" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={compacto ? "plano-c" : "plano"}>Plano</Label>
          <Select defaultValue="pro">
            <SelectTrigger id={compacto ? "plano-c" : "plano"} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="max">Max</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch id={compacto ? "sw-c" : "sw"} checked={ligado} onCheckedChange={setLigado} />
        <Label htmlFor={compacto ? "sw-c" : "sw"} className="font-normal text-muted-foreground">
          Notificações por e-mail
        </Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Uso do plano</span>
          <span className="font-medium tabular-nums">68 %</span>
        </div>
        <Progress value={68} aria-label="Uso do plano" />
      </div>

      {!compacto && (
        <>
          <Tabs defaultValue="geral">
            <TabsList>
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="equipe">Equipe</TabsTrigger>
              <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
            </TabsList>
            <TabsContent value="geral" className="pt-3 text-sm text-muted-foreground">
              O indicador ativo da aba usa <code className="text-foreground">--primary</code>.
            </TabsContent>
            <TabsContent value="equipe" className="pt-3 text-sm text-muted-foreground">
              Quatro membros ativos.
            </TabsContent>
            <TabsContent value="cobranca" className="pt-3 text-sm text-muted-foreground">
              Próxima fatura em 3 de outubro.
            </TabsContent>
          </Tabs>

          <Alert>
            <AlertTitle>Nenhum componente foi tocado</AlertTitle>
            <AlertDescription>
              Tudo nesta vitrine lê os mesmos tokens. A retematização acontece no container.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-brand text-brand-foreground">TC</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">Thiago Cabreira</CardTitle>
                  <CardDescription>Administrador do workspace</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              O raio deste card vem de <code className="text-foreground">--radius</code>; o avatar usa o
              token <code className="text-foreground">--brand</code>, que não existia no shadcn original.
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="brand" size="sm">
                Salvar
              </Button>
              <Button variant="outline" size="sm">
                Cancelar
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

function AlternarModo() {
  const { resolvedTheme, setTheme } = useTheme();
  const escuro = resolvedTheme === "dark";
  return (
    <Button variant="outline" size="sm" onClick={() => setTheme(escuro ? "light" : "dark")}>
      {escuro ? <Sun /> : <Moon />}
      {escuro ? "Modo claro" : "Modo escuro"}
    </Button>
  );
}

export function Playground() {
  const [tema, setTema] = useState<TemaId>("tema-teal");
  const [raio, setRaio] = useState<number | null>(null);

  const atual = TEMAS.find((t) => t.id === tema)!;
  const classeTema = tema === "padrao" ? "" : tema;
  const estilo = raio === null ? undefined : ({ "--radius": `${raio}rem` } as React.CSSProperties);

  return (
    <div className="space-y-10">
      {/* ---------- controles ---------- */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">
              Classe aplicada no container
            </Label>
            <div className="flex flex-wrap gap-2">
              {TEMAS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTema(t.id);
                    setRaio(null);
                  }}
                  aria-pressed={tema === t.id}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
                    tema === t.id ? "border-foreground/40 bg-muted font-medium" : "border-border hover:bg-muted/60"
                  }`}
                >
                  <span
                    className="size-3.5 rounded-full border border-black/10"
                    style={{ background: t.swatch }}
                  />
                  {t.nome}
                </button>
              ))}
            </div>
          </div>
          <AlternarModo />
        </div>

        <Separator className="my-5" />

        <div className="flex flex-wrap items-center gap-4">
          <Label htmlFor="raio" className="text-sm">
            <code>--radius</code>
          </Label>
          <input
            id="raio"
            type="range"
            min={0}
            max={1.6}
            step={0.05}
            value={raio ?? parseFloat(atual.radius)}
            onChange={(e) => setRaio(parseFloat(e.target.value))}
            className="h-1.5 w-56 cursor-pointer appearance-none rounded-full bg-muted accent-primary"
          />
          <span className="font-mono text-sm tabular-nums">
            {(raio ?? parseFloat(atual.radius)).toFixed(2)}rem
          </span>
          {raio !== null && (
            <Button variant="ghost" size="sm" onClick={() => setRaio(null)}>
              restaurar
            </Button>
          )}
        </div>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Um token só. Botão, input, card, badge, select e tabs derivam dele por{" "}
          <code>calc()</code> — nenhum componente recebeu prop nova.
        </p>
      </div>

      {/* ---------- vitrine + css ---------- */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className={classeTema} style={estilo}>
          <div className="rounded-[calc(var(--radius)*1.4)] border bg-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-brand" />
              <span className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
                {classeTema ? `<div class="${classeTema}">` : "<div>"}
              </span>
            </div>
            <Vitrine />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              app/globals.css
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-[12.5px] leading-relaxed">
              <code>{atual.css}</code>
            </pre>
          </div>
          <div>
            <div className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">
              components/ui/button.tsx
            </div>
            <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-[12.5px] leading-relaxed">
              <code>{`variants: {
  variant: {
    default: "bg-primary ...",
    // adicionadas à mão:
    brand:   "bg-brand text-brand-foreground
              hover:bg-brand/90",
    success: "bg-success/12 text-success
              hover:bg-success/20",
  },
  size: { xl: "h-11 px-5 text-base" },
}`}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* ---------- dois temas lado a lado ---------- */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Dois temas na mesma página</h2>
        <p className="mt-1 mb-5 max-w-prose text-sm text-muted-foreground">
          Os dois blocos abaixo renderizam o mesmo componente <code>&lt;Vitrine /&gt;</code>. A única
          diferença é a classe do container. Sem provider aninhado, sem contexto, sem re-render.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="tema-violeta">
            <div className="h-full rounded-[calc(var(--radius)*1.2)] border bg-card p-5">
              <div className="mb-4 font-mono text-xs text-muted-foreground">.tema-violeta</div>
              <Vitrine compacto />
            </div>
          </div>
          <div className="tema-ambar">
            <div className="h-full rounded-[calc(var(--radius)*1.2)] border bg-card p-5">
              <div className="mb-4 font-mono text-xs text-muted-foreground">.tema-ambar</div>
              <Vitrine compacto />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
