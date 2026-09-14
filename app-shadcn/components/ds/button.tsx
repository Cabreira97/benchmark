"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

import { Button as BaseButton } from "@/components/ui/button";

type BaseProps = React.ComponentProps<typeof BaseButton>;
type BaseVariant = NonNullable<BaseProps["variant"]>;
type BaseSize = NonNullable<BaseProps["size"]>;

/**
 * Variantes e tamanhos da casa. Aplicados POR CIMA da base — o arquivo
 * components/ui/button.tsx permanece exatamente como o CLI gerou.
 *
 * A base continua entregando o esqueleto (foco, disabled, aria-invalid,
 * tratamento de ícone). Aqui sobrescrevemos só o que muda.
 * O cn() resolve o conflito de classe: a última vence.
 */
const dsVariants = cva("", {
  variants: {
    variant: {
      brand:
        "bg-brand text-brand-foreground shadow-sm hover:bg-brand/90 focus-visible:ring-brand/40",
      "brand-soft":
        "bg-brand-muted text-brand hover:bg-brand/15 focus-visible:ring-brand/30",
      success:
        "bg-success/12 text-success hover:bg-success/20 focus-visible:ring-success/30",
    },
    size: {
      xl: "h-11 gap-2 rounded-[calc(var(--radius)*1.4)] px-5 text-base [&_svg:not([class*='size-'])]:size-5",
    },
  },
});

type DsVariant = NonNullable<VariantProps<typeof dsVariants>["variant"]>;
type DsSize = NonNullable<VariantProps<typeof dsVariants>["size"]>;

const DS_VARIANTS = ["brand", "brand-soft", "success"] as const;
const DS_SIZES = ["xl"] as const;

const isDsVariant = (v: unknown): v is DsVariant =>
  (DS_VARIANTS as readonly string[]).includes(v as string);

const isDsSize = (s: unknown): s is DsSize =>
  (DS_SIZES as readonly string[]).includes(s as string);

export interface ButtonProps extends Omit<BaseProps, "variant" | "size"> {
  variant?: BaseVariant | DsVariant;
  size?: BaseSize | DsSize;
}

/**
 * Ponto único de consumo de Button no produto.
 * Também fixa o padrão da casa: size="sm".
 */
export function Button({
  variant = "default",
  size = "sm",
  className,
  ...props
}: ButtonProps) {
  const customVariant = isDsVariant(variant);
  const customSize = isDsSize(size);

  return (
    <BaseButton
      // variantes/tamanhos da casa herdam o esqueleto do default
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
