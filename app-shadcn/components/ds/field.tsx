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

/**
 * Campo de formulário do produto.
 *
 * Existe para tornar impossível esquecer a ligação de acessibilidade:
 * id, htmlFor, aria-describedby e aria-invalid são conectados aqui, uma
 * vez, em vez de dependerem da memória de quem escreve cada tela.
 *
 * É a mitigação do risco R3 em código — não em processo.
 */
export function Field({
  label,
  hint,
  error,
  id,
  className,
  containerClassName,
  ...props
}: FieldProps) {
  const generated = React.useId();
  const fieldId = id ?? generated;
  const hintId = `${fieldId}-hint`;
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
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
