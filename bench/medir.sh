#!/usr/bin/env bash
# Benchmark reproduzível: Chakra UI v2 × Chakra UI v3 × shadcn/ui sobre Next.js 16.
# Uso: bash bench/medir.sh
set -u
export LC_ALL=C
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APPS=(app-chakra app-chakra-v3 app-shadcn)
declare -A PORTS=( [app-chakra]=3101 [app-chakra-v3]=3103 [app-shadcn]=3102 )
declare -A PORTS_DEV=( [app-chakra]=3111 [app-chakra-v3]=3113 [app-shadcn]=3112 )

linha() { printf '%s\n' "------------------------------------------------------------"; }
kb() { awk -v v="$1" 'BEGIN{printf "%.1f", v/1024}'; }

porta_pid() { ss -ltnp 2>/dev/null | grep ":$1 " | sed -E 's/.*pid=([0-9]+).*/\1/' | head -1; }
mata_porta() { local p; p=$(porta_pid "$1"); [ -n "$p" ] && kill -9 "$p" 2>/dev/null; sleep 1; }

echo "### 1. node_modules (instalação de desenvolvimento)"
for a in "${APPS[@]}"; do
  [ -d "$ROOT/$a/node_modules" ] || { echo "$a: sem node_modules, rode npm install"; continue; }
  printf '%-14s %8.1f MB  %6s arquivos  %4s entradas no lock\n' "$a" \
    "$(echo "$(du -sb "$ROOT/$a/node_modules" | cut -f1)/1048576" | bc -l)" \
    "$(find "$ROOT/$a/node_modules" -type f | wc -l)" \
    "$(node -e "console.log(Object.keys(require('$ROOT/$a/package-lock.json').packages).length-1)")"
done
linha

echo "### 2. node_modules de produção (npm ci --omit=dev)"
TMP=$(mktemp -d)
for a in "${APPS[@]}"; do
  mkdir -p "$TMP/$a" && cp "$ROOT/$a/package.json" "$ROOT/$a/package-lock.json" "$TMP/$a/"
  ( cd "$TMP/$a" && npm ci --omit=dev >/dev/null 2>&1 )
  printf '%-14s %8.1f MB  %6s arquivos\n' "$a" \
    "$(echo "$(du -sb "$TMP/$a/node_modules" | cut -f1)/1048576" | bc -l)" \
    "$(find "$TMP/$a/node_modules" -type f | wc -l)"
done
rm -rf "$TMP"
echo "(shadcn: mova o pacote 'shadcn' para devDependencies antes de medir — o CLI vem em dependencies por padrão)"
echo "(chakra v3: 'react-icons' entra em dependencies pelos snippets color-mode/menu/toggle-tip/close-button — considere trocar pelas mesmas figuras em lucide-react, já usado no projeto)"
linha

echo "### 3. Build de produção (Turbopack)"
for a in "${APPS[@]}"; do
  rm -rf "$ROOT/$a/.next"
  frio=$( { /usr/bin/time -f "%e" npm --prefix "$ROOT/$a" run build >/dev/null; } 2>&1 | tail -1 )
  quente=$( { /usr/bin/time -f "%e" npm --prefix "$ROOT/$a" run build >/dev/null; } 2>&1 | tail -1 )
  printf '%-14s frio=%ss  quente=%ss  .next/static=%s\n' "$a" "$frio" "$quente" \
    "$(du -sh "$ROOT/$a/.next/static" | cut -f1)"
done
linha

echo "### 4. Dev server (subida + primeira compilação)"
for a in "${APPS[@]}"; do
  porta="${PORTS_DEV[$a]}"
  rm -rf "$ROOT/$a/.next"; : > "/tmp/dev-$a.log"
  t0=$(date +%s.%N)
  ( cd "$ROOT/$a" && nohup npm run dev -- --port "$porta" > "/tmp/dev-$a.log" 2>&1 & )
  until grep -q "Ready in" "/tmp/dev-$a.log" 2>/dev/null; do sleep 0.1; done
  t1=$(date +%s.%N)
  curl -s -o /dev/null "http://localhost:$porta/"; t2=$(date +%s.%N)
  curl -s -o /dev/null "http://localhost:$porta/estatico"; t3=$(date +%s.%N)
  printf '%-14s ready=%.2fs  1a compilação /=%.2fs  /estatico=%.2fs\n' "$a" \
    "$(echo "$t1-$t0" | bc)" "$(echo "$t2-$t1" | bc)" "$(echo "$t3-$t2" | bc)"
  mata_porta "$porta"
done
linha

echo "### 5. Servidores de produção + payload por rota"
for a in "${APPS[@]}"; do
  porta="${PORTS[$a]}"
  mata_porta "$porta"
  ( cd "$ROOT/$a" && nohup npm run start -- --port "$porta" > "/tmp/prod-$a.log" 2>&1 & )
done
sleep 6

for a in "${APPS[@]}"; do
  porta="${PORTS[$a]}"
  for rota in "/" "/estatico"; do
    curl -s "http://localhost:$porta$rota" -o /tmp/pagina.html
    html=$(wc -c < /tmp/pagina.html)
    htmlgz=$(gzip -9c /tmp/pagina.html | wc -c)
    inline=$(python3 -c "
import re
h = open('/tmp/pagina.html', encoding='utf8', errors='replace').read()
print(sum(len(s) for s in re.findall(r'<style[^>]*>(.*?)</style>', h, re.S)))")
    printf '%-14s %-10s HTML=%8s KB  gzip=%7s KB  CSS embutido no HTML=%7s KB\n' \
      "$a" "$rota" "$(kb "$html")" "$(kb "$htmlgz")" "$(kb "$inline")"
  done
done
linha

echo "### 6. Bytes estáticos por rota (raw / gzip) — soma de todos os chunks"
for a in "${APPS[@]}"; do
  raw=0; gz=0
  for f in "$ROOT/$a"/.next/static/chunks/*.js; do
    raw=$((raw + $(wc -c < "$f"))); gz=$((gz + $(gzip -9c "$f" | wc -c)))
  done
  csraw=0; csgz=0
  for f in "$ROOT/$a"/.next/static/chunks/*.css; do
    csraw=$((csraw + $(wc -c < "$f"))); csgz=$((csgz + $(gzip -9c "$f" | wc -c)))
  done
  printf '%-14s todos os chunks JS: raw=%s KB gzip=%s KB | CSS: raw=%s KB gzip=%s KB\n' \
    "$a" "$(kb $raw)" "$(kb $gz)" "$(kb $csraw)" "$(kb $csgz)"
done
echo "(números por rota, sem o que o navegador não baixa, exigem inspecionar Performance API — ver RELATORIO.md)"
linha

echo "### 7. TTFB de SSR (12 amostras, mediana)"
for a in "${APPS[@]}"; do
  porta="${PORTS[$a]}"
  for rota in "/" "/estatico"; do
    vals=()
    for _ in $(seq 1 12); do
      vals+=("$(curl -s -o /dev/null -w '%{time_starttransfer}' "http://localhost:$porta$rota")")
    done
    printf '%-14s %-10s mediana=%ss\n' "$a" "$rota" \
      "$(printf '%s\n' "${vals[@]}" | sort -n | sed -n 7p)"
  done
done

for a in "${APPS[@]}"; do mata_porta "${PORTS[$a]}"; done
echo "fim."
