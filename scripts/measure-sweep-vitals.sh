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
# Writes three files under `.context/scratch/`:
#   sweep-vitals.tsv    one row per 10 s, plus one on each side of the sweep
#   sweep-measured.log  the sweep's output, every line stamped with the time
#   sweep-procs.log     the three heaviest processes at each sample
#
# Every line of the log carries `HH:MM:SS`, so a red package can be looked up by
# name and its rows found in the TSV by time. Without the stamps the log has
# only durations and the two files cannot be lined up at all.
#
# What a green run looks like, for comparison (measured 2026-08-05, 124 rows
# over 20.8 minutes, before pageouts and compressor pages were recorded):
#
#   free memory   56 MB min / 3985 MB max / 1305 MB mean
#   swap          4536 MB at peak
#   swapins       790 between first and last sample
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
PROCLOG="$ROOT/.context/scratch/sweep-procs.log"
INTERVAL="${SWEEP_VITALS_INTERVAL:-10}"

mkdir -p "$ROOT/.context/scratch"

_sample() {
  local vm free_mb swap_used ctr swapins pageouts compressed load1

  # Take one `vm_stat` snapshot and read every field from it, so the numbers in
  # a row all describe the same instant.
  #
  # The page size comes from its header rather than a constant: it is 16 KB on
  # this machine but 4 KB elsewhere, and hardcoding it would silently scale
  # every memory figure by four on someone else's laptop.
  #
  # Counts print with a trailing period, hence the `gsub`.
  vm=$(vm_stat 2>/dev/null)
  free_mb=$(printf '%s\n' "$vm" | awk '
    /page size of/ { for (i = 1; i <= NF; i++) if ($i == "of") { ps = $(i+1); break } }
    /Pages free/   { gsub(/\./, ""); pages = $3 }
    END { if (ps > 0 && pages != "") printf "%.0f", pages * ps / 1024 / 1024 }')
  swapins=$(printf '%s\n' "$vm" | awk '/Swapins/ {gsub(/\./,""); print $2}')
  # Pageouts and compressed pages separate "memory is tight" from "memory is
  # tight *and* the system is paying for it". Free pages alone cannot.
  pageouts=$(printf '%s\n' "$vm" | awk '/Pageouts/ {gsub(/\./,""); print $2}')
  compressed=$(printf '%s\n' "$vm" | awk '/Pages occupied by compressor/ {gsub(/\./,""); print $5}')

  swap_used=$(sysctl -n vm.swapusage 2>/dev/null | awk '{gsub(/M/,"",$6); print $6}')
  ctr=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
  load1=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$(date +%H:%M:%S)" "${free_mb:-0}" "${swap_used:-0}" "$ctr" \
    "${swapins:-0}" "${pageouts:-0}" "${compressed:-0}" "${load1:-0}" >> "$OUT"

  # The heaviest three processes, in a separate file so the TSV stays a table.
  # This is what tells you *who* was using the machine, which the aggregate
  # numbers never can.
  {
    printf '%s\n' "$(date +%H:%M:%S)"
    ps -Ao pid,rss,%cpu,comm -r 2>/dev/null | head -4 | tail -3
  } >> "$PROCLOG"
}

printf 'time\tfree_mb\tswap_used_mb\tcontainers\tswapins\tpageouts\tcompressed\tload1\n' > "$OUT"
: > "$PROCLOG"

cd "$ROOT"

# One sample before anything starts, so even a sweep that dies immediately
# leaves two points to subtract.
_sample

( while :; do sleep "$INTERVAL"; _sample; done ) &
SAMPLER=$!

_stop_sampler() {
  [ -n "${SAMPLER:-}" ] || return 0
  kill "$SAMPLER" 2>/dev/null
  wait "$SAMPLER" 2>/dev/null
  SAMPLER=""
}

# Forward the signal to the sweep and exit the way a signalled process should.
#
# Killing only the sampler would leave `pnpm` running in the foreground; the
# script would then wait for it, print `rc=0` and look like a clean run. A
# cancelled sweep must not read as a successful one.
_on_signal() {
  local sig="$1" code="$2"
  _stop_sampler
  if [ -n "${SWEEP_PID:-}" ]; then
    # Signal the whole process group, not just the subshell. `pnpm` spawns the
    # sweep, which spawns a package's test runner; signalling only the subshell
    # leaves all of them running and the script would go on to report a clean
    # exit for a run that was cancelled.
    #
    # `set -m` puts the background job in its own group, so the negative PID
    # reaches the subshell and everything under it without touching this script.
    kill -"$sig" -- -"$SWEEP_PID" 2>/dev/null || kill -"$sig" "$SWEEP_PID" 2>/dev/null
    wait "$SWEEP_PID" 2>/dev/null
  fi
  if [ -n "${STAMPER_PID:-}" ]; then
    kill "$STAMPER_PID" 2>/dev/null
    wait "$STAMPER_PID" 2>/dev/null
  fi
  [ -n "${STAMPER_FIFO:-}" ] && rm -f "$STAMPER_FIFO"
  _sample
  printf 'interrupted by SIG%s\n' "$sig" >&2
  exit "$code"
}

trap '_stop_sampler' EXIT
trap '_on_signal INT 130' INT
trap '_on_signal TERM 143' TERM

# Stamp each line with the wall-clock time it arrived. Without this the log
# carries only per-package durations, and there is no way to line a package up
# against the rows in the TSV — which is the entire point of measuring.
#
# The sweep runs in the background so its PID is available to the signal
# handlers; `pnpm` inside a pipeline would not be reachable. `PIPESTATUS[0]`
# keeps the sweep's own status rather than `awk`'s.
# The sweep writes to a pipe that a separate `awk` reads, rather than the two
# being one pipeline. A pipeline's members are not reachable from the parent —
# only the last one is — so signalling it would leave `pnpm` running while the
# script reported a clean exit.
#
# Job control (`set -m`) puts `pnpm` in a process group of its own, which is
# what makes `kill -- -PID` reach the sweep and everything it spawned.
STAMPER_FIFO="$ROOT/.context/scratch/.sweep-stamp.fifo"
rm -f "$STAMPER_FIFO"
mkfifo "$STAMPER_FIFO"

awk '{ "date +%H:%M:%S" | getline t; close("date +%H:%M:%S"); print t "  " $0; fflush() }' \
  < "$STAMPER_FIFO" > "$LOG" &
STAMPER_PID=$!

set -m
pnpm test:all > "$STAMPER_FIFO" 2>&1 &
SWEEP_PID=$!
set +m

wait "$SWEEP_PID"
RC=$?
SWEEP_PID=""

# Close the writing end so `awk` sees EOF, then let it drain.
exec 3>"$STAMPER_FIFO"
exec 3>&-
wait "$STAMPER_PID" 2>/dev/null
rm -f "$STAMPER_FIFO"

_stop_sampler

# One sample after the sweep returns. A run that fails does so in the seconds
# before it returns, and those are exactly the seconds a 10 s cadence is most
# likely to miss.
_sample

printf 'sweep rc=%s\n' "$RC"
tail -3 "$LOG"

printf '\nvitals (%s):\n' "$OUT"
awk -F'\t' 'NR>1 {
  if (minf == "" || $2 < minf) minf = $2
  if ($2 > maxf) maxf = $2
  sumf += $2
  if ($3 > maxs) maxs = $3
  if ($8 > maxl) maxl = $8
  if (firstin == "") { firstin = $5; firstout = $6 }
  lastin = $5
  lastout = $6
  if ($7 > maxc) maxc = $7
  n++
}
END {
  if (n == 0) { print "  no samples"; exit }
  printf "  free memory  %s MB min / %s MB max / %.0f MB mean\n", minf, maxf, sumf/n
  printf "  swap         %s MB at peak\n", maxs
  printf "  swapins      %d between the first and last sample\n", lastin - firstin
  printf "  pageouts     %d between the first and last sample\n", lastout - firstout
  printf "  compressed   %d pages at peak\n", maxc
  printf "  load1        %s at peak\n", maxl
  printf "  samples      %d\n", n
}' "$OUT"

printf '\nheaviest processes: %s\n' "$PROCLOG"

exit "$RC"
