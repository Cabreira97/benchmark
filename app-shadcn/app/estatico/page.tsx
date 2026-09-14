import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FAQ } from "@/lib/api";

export const metadata = { title: "Pagina estatica — shadcn/ui" };

const ROWS = [
  { id: 1, metric: "First Load JS", note: "JS baixado antes da interacao" },
  { id: 2, metric: "node_modules", note: "Peso do diretorio de dependencias" },
  { id: 3, metric: "Build", note: "Tempo de next build com Turbopack" },
];

export default function StaticPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Pagina 100% estatica</h1>
        <Badge variant="secondary">RSC</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Sem estado, sem eventos, sem &quot;use client&quot;. Serve para medir o piso de JavaScript de cada
        biblioteca.
      </p>

      <Separator className="my-6" />

      <Alert>
        <AlertTitle>Por que esta rota existe</AlertTitle>
        <AlertDescription>
          Componentes shadcn/ui puramente visuais rodam como Server Components. Chakra UI v2 depende de Context
          e Emotion, entao a mesma rota precisa virar Client Component.
        </AlertDescription>
      </Alert>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metricas comparadas</CardTitle>
          <CardDescription>Os tres eixos do benchmark</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[64px]">#</TableHead>
                <TableHead>Metrica</TableHead>
                <TableHead>Descricao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums text-muted-foreground">{row.id}</TableCell>
                  <TableCell className="font-medium">{row.metric}</TableCell>
                  <TableCell className="text-muted-foreground">{row.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        {FAQ.map((item) => (
          <Card key={item.q}>
            <CardHeader>
              <CardTitle className="text-base">{item.q}</CardTitle>
              <CardDescription>{item.a}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
