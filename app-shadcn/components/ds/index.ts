/**
 * Ponto único de importação de UI para o produto.
 *
 * Código de feature importa daqui — nunca de @/components/ui diretamente.
 * A regra é garantida por lint (ver eslint.config.mjs).
 *
 * Componentes sem customização são apenas re-exportados: o adapter existe
 * para dar um ponto de intercepção futuro, não para adicionar código agora.
 */

// —— adaptados (têm comportamento ou variante da casa)
export { Button, type ButtonProps } from "./button";
export { Field, type FieldProps } from "./field";
export { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog";

// —— repassados sem alteração (o dia em que precisarem mudar, viram arquivo próprio)
export { Badge } from "@/components/ui/badge";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
export { Separator } from "@/components/ui/separator";
export { Skeleton } from "@/components/ui/skeleton";
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
