"use client";

import { useState } from "react";

// Import único: tudo vem da camada da casa, nada de @/components/ui
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Field,
  Separator,
} from "@/components/ds";

export function Demo() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState("");

  const emailError =
    email.length > 0 && !email.includes("@") ? "Informe um e-mail válido." : undefined;

  async function confirmar() {
    setPending(true);
    await new Promise((r) => setTimeout(r, 900));
    setPending(false);
    setOpen(false);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
        components/ds
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Camada de adapters</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Nenhum arquivo de <code>components/ui</code> foi editado. Tudo abaixo é composição feita em{" "}
        <code>components/ds</code>, importada por um único barrel.
      </p>

      <Separator className="my-8" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variantes da casa</CardTitle>
          <CardDescription>
            <code>brand</code>, <code>brand-soft</code> e <code>success</code> não existem no
            shadcn — são adicionadas por cima, sem tocar no <code>cva</code> original.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="brand">Brand</Button>
          <Button variant="brand-soft">Brand soft</Button>
          <Button variant="success">Success</Button>
          <Button variant="outline">Outline (da base)</Button>
          <Button variant="destructive">Destructive (da base)</Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Field — acessibilidade por construção</CardTitle>
          <CardDescription>
            <code>id</code>, <code>htmlFor</code>, <code>aria-describedby</code> e{" "}
            <code>aria-invalid</code> são ligados pelo adapter. Impossível esquecer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="E-mail de trabalho"
            hint="Usamos apenas para notificações do sistema."
            placeholder="voce@empresa.com.br"
            value={email}
            error={emailError}
            onChange={(e) => setEmail(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">ConfirmDialog — composição</CardTitle>
          <CardDescription>
            Dialog + Button combinados num padrão único de confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Excluir workspace
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir workspace?"
        description="Esta ação remove todos os projetos e não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        pending={pending}
        onConfirm={confirmar}
      />
    </main>
  );
}
