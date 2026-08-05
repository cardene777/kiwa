#!/usr/bin/env bash
#
# Run `pnpm test:all` while recording what the machine is doing, so that a red
# sweep leaves behind evidence of *why*.
#
# The four `orm-*-poc` examples are flaky (#1800). They went red once, taking
# 187 s / 127 s / 404 s / 244 s, and have since passed six times in a row under
# every condition tried — alone, in a partial sweep, in two full sweeps, and
# with two codex runs competing for memory. The red run's vitals were never
# captured, so there is nothing to compare against. This script exists so the
# next red run is not wasted the same way.
#
# Usage:
#   bash scripts/measure-sweep-vitals.sh
#
# Writes two files under `.context/scratch/`:
#   sweep-vitals.tsv    one row per 10 s: free memory, swap, containers, load
#   sweep-measured.log  the sweep's own output
#
# Match them by timestamp: find when a package started in the log, then read the
# rows around it.
#
# What a green run looks like, for comparison (measured 2026-08-05, 124 rows
# over 20.8 minutes):
#
#   free memory   56 MB min / 3985 MB max / 1305 MB mean
#   swap          4536 MB at peak
#   swapins       790 over the run
#   load1         18.21 at peak
#   containers    25-29 (25 belong to another project and are always up)
#
# Memory was already tight there and the sweep still passed, so a low number by
# itself does not explain a red run. What is missing is the same numbers from a
# run that fails.
set -uo pipefail

ROOT="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd -P)"
OUT="$ROOT/.context/scratch/sweep-vitals.tsv"
LOG="$ROOT/.context/scratch/sweep-measured.log"
INTERVAL="${SWEEP_VITALS_INTERVAL:-10}"

mkdir -p "$ROOT/.context/scratch"

_sample() {
  local free_mb swap_used ctr swapins load1

  # `vm_stat` prints page counts with a trailing period; strip it before
  # multiplying by the 16 KB page size.
  free_mb=$(vm_stat | awk '/Pages free/ {gsub(/\./,""); printf "%.0f", $3*16384/1024/1024}')
  swapins=$(vm_stat | awk '/Swapins/ {gsub(/\./,""); print $2}')
  swap_used=$(sysctl -n vm.swapusage 2>/dev/null | awk '{gsub(/M/,"",$6); print $6}')
  ctr=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
  load1=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')

  printf '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$(date +%H:%M:%S)" "$free_mb" "${swap_used:-0}" "$ctr" "$swapins" "${load1:-0}" >> "$OUT"
}

printf 'time\tfree_mb\tswap_used_mb\tcontainers\tswapins\tload1\n' > "$OUT"

( while :; do _sample; sleep "$INTERVAL"; done ) &
SAMPLER=$!
trap 'kill "$SAMPLER" 2>/dev/null' EXIT INT TERM

cd "$ROOT"
pnpm test:all > "$LOG" 2>&1
RC=$?

kill "$SAMPLER" 2>/dev/null

printf 'sweep rc=%s\n' "$RC"
tail -3 "$LOG"

printf '\nvitals (%s):\n' "$OUT"
awk -F'\t' 'NR>1 {
  if (minf == "" || $2 < minf) minf = $2
  if ($2 > maxf) maxf = $2
  sumf += $2
  if ($3 > maxs) maxs = $3
  if ($6 > maxl) maxl = $6
  if (firstin == "") firstin = $5
  lastin = $5
  n++
}
END {
  if (n == 0) { print "  no samples"; exit }
  printf "  free memory  %s MB min / %s MB max / %.0f MB mean\n", minf, maxf, sumf/n
  printf "  swap         %s MB at peak\n", maxs
  printf "  swapins      %d over the run\n", lastin - firstin
  printf "  load1        %s at peak\n", maxl
  printf "  samples      %d\n", n
}' "$OUT"

exit "$RC"
