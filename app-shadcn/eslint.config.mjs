// Regra que transforma a convenção em contrato verificável pelo CI.
// Sem isso, "não editar components/ui" é só um acordo verbal que decai.
//
// Instalar: npm i -D eslint eslint-config-next eslint-plugin-jsx-a11y
import next from "eslint-config-next";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  ...next,
  jsxA11y.flatConfigs.recommended,

  {
    // Código de produto importa da camada da casa, nunca do vendored.
    files: ["app/**/*.{ts,tsx}", "components/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*", "**/components/ui/*"],
              message:
                "Importe de @/components/ds. A pasta components/ui é código gerado pelo CLI " +
                "e é sobrescrita por `shadcn add --overwrite`. Precisa de algo novo? " +
                "Crie ou estenda um adapter em components/ds/.",
            },
          ],
        },
      ],
    },
  },

  {
    // A camada de adapters é a única autorizada a tocar no vendored.
    files: ["components/ds/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },

  {
    // Código gerado: não é nosso, não revisamos estilo dele.
    ignores: ["components/ui/**"],
  },
];
