import { Explorer } from "@/components/explorer";
import { fetchCharacters } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initial = await fetchCharacters({ name: "", status: "", gender: "", page: 1 });
  return <Explorer initial={initial} />;
}
