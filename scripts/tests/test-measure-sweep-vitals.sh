#!/usr/bin/env bash
#
# Exercise `scripts/measure-sweep-vitals.sh` end to end against stand-ins for
# `pnpm`, `vm_stat`, `sysctl`, `docker` and `ps`, so the parts that only matter
# when a sweep goes wrong — the exit code, the samples on either side, the
# signal reaching the sweep itself — are checked without waiting 45 minutes for
# a real one.
#
# The fixtures return known values, so each column can be asserted against a
# number rather than "is non-empty". An earlier version checked only shapes and
# stayed green while four of the five fixes it was meant to protect were undone.
#
# Usage:
#   bash scripts/tests/test-measure-sweep-vitals.sh
set -uo pipefail

ROOT="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd -P)"
SCRIPT="$ROOT/scripts/measure-sweep-vitals.sh"
TSV="$ROOT/.context/scratch/sweep-vitals.tsv"
LOG="$ROOT/.context/scratch/sweep-measured.log"
PROCS="$ROOT/.context/scratch/sweep-procs.log"
FIFO="$ROOT/.context/scratch/.sweep-stamp.fifo"

PASS=0
FAIL=0

_ok() { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
_ng() {
  FAIL=$((FAIL + 1))
  printf '  NG   %s\n' "$1"
  [ $# -ge 2 ] && printf '       %s\n' "$2"
  return 0
}

_eq() {
  local label="$1" want="$2" got="$3"
  if [ "$want" = "$got" ]; then _ok "$label"; else _ng "$label" "want=$want got=$got"; fi
}

# Fixtures for everything `_sample` reads. Page size is 4096 rather than this
# machine's 16384, so a hardcoded constant produces a different answer than
# reading the header:
#
#   4096 bytes * 2560 pages = 10 MB free
_make_fixtures() {
  local dir="$1"
  mkdir -p "$dir"

  cat > "$dir/vm_stat" <<'EOF'
#!/usr/bin/env bash
cat <<'STATS'
Mach Virtual Memory Statistics: (page size of 4096 bytes)
Pages free:                                2560.
Pages active:                             10000.
Pages occupied by compressor:              7777.
Pageouts:                                  4444.
Swapins:                                   1111.
STATS
EOF

  cat > "$dir/sysctl" <<'EOF'
#!/usr/bin/env bash
# `-n` suppresses the key, so the fields start at `total`. Including the key
# here would shift every column and the parser would read the wrong one.
case "$*" in
  *vm.swapusage*) echo "total = 8192.00M  used = 2048.00M  free = 6144.00M  (encrypted)" ;;
  *vm.loadavg*)   echo "{ 3.50 2.20 1.10 }" ;;
  *)              exit 1 ;;
esac
EOF

  cat > "$dir/docker" <<'EOF'
#!/usr/bin/env bash
# Three container ids, so the count column should read 3.
case "$*" in
  *ps*) printf 'aaa\nbbb\nccc\n' ;;
  *)    exit 1 ;;
esac
EOF

  cat > "$dir/ps" <<'EOF'
#!/usr/bin/env bash
cat <<'PROCLIST'
  PID    RSS  %CPU COMM
  101 900000  95.0 fixture-hog-one
  102 800000  85.0 fixture-hog-two
  103 700000  75.0 fixture-hog-three
  104 600000  65.0 fixture-hog-four
PROCLIST
EOF

  chmod +x "$dir/vm_stat" "$dir/sysctl" "$dir/docker" "$dir/ps"
}

_mock_pnpm() {
  local dir="$1" body="$2"
  mkdir -p "$dir"
  printf '#!/usr/bin/env bash\n%s\n' "$body" > "$dir/pnpm"
  chmod +x "$dir/pnpm"
}

_col() { awk -F'\t' -v r="$1" -v c="$2" 'NR==r {print $c}' "$TSV"; }

echo "== measure-sweep-vitals =="

# ---------------------------------------------------------------- T1: values
T1=$(mktemp -d)
_make_fixtures "$T1/bin"
_mock_pnpm "$T1/bin" 'echo "[  1/171] ok    examples/foo  1.0s"
sleep 1
echo "green: 171   red: 0   dirty: 0   not run: 0"
exit 0'

PATH="$T1/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" > /dev/null 2>&1
RC1=$?

_eq "正常終了で rc 0" "0" "$RC1"

_eq "header が 8 列" \
  "$(printf 'time\tfree_mb\tswap_used_mb\tcontainers\tswapins\tpageouts\tcompressed\tload1')" \
  "$(head -1 "$TSV")"

# 2560 pages * 4096 = 10 MB. Reading the header is the only way to get 10;
# assuming 16384 would give 40.
_eq "free_mb が page size を header から読む (4096 -> 10MB)" "10" "$(_col 2 2)"
_eq "swap_used_mb を sysctl から取る" "2048.00" "$(_col 2 3)"
_eq "containers を docker ps の行数から取る" "3" "$(_col 2 4)"
_eq "swapins を vm_stat から取る" "1111" "$(_col 2 5)"
_eq "pageouts を vm_stat から取る" "4444" "$(_col 2 6)"
_eq "compressed を vm_stat から取る" "7777" "$(_col 2 7)"
_eq "load1 を sysctl から取る" "3.50" "$(_col 2 8)"

# Every line, not just one.
TOTAL_LINES=$(grep -c . "$LOG")
STAMPED=$(grep -cE '^[0-9]{2}:[0-9]{2}:[0-9]{2}  ' "$LOG")
_eq "log の全行に時刻が付く ($TOTAL_LINES 行)" "$TOTAL_LINES" "$STAMPED"

# Three processes per sample, and the names come from the fixture.
SAMPLES=$(tail -n +2 "$TSV" | grep -c .)
PROC_HOGS=$(grep -c 'fixture-hog' "$PROCS")
_eq "process log が sample ごとに 3 件" "$((SAMPLES * 3))" "$PROC_HOGS"
if grep -q 'fixture-hog-four' "$PROCS"; then
  _ng "process log は上位 3 件に絞る" "4 件目が入っている"
else
  _ok "process log は上位 3 件に絞る"
fi

if [ ! -e "$FIFO" ]; then _ok "正常終了で FIFO が残らない"; else _ng "正常終了で FIFO が残らない"; fi
rm -rf "$T1"

# ------------------------------------------------------- T2: failure keeps rc
T2=$(mktemp -d)
_make_fixtures "$T2/bin"
_mock_pnpm "$T2/bin" 'echo "[122/171] RED   examples/orm-drizzle-mysql-poc  187.3s"; exit 37'

PATH="$T2/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" > /dev/null 2>&1
RC2=$?
_eq "sweep の rc を保持する" "37" "$RC2"

NROWS2=$(tail -n +2 "$TSV" | grep -c .)
if [ "$NROWS2" -ge 2 ]; then
  _ok "即時失敗でも両端 sample が残る ($NROWS2)"
else
  _ng "即時失敗でも両端 sample が残る" "$NROWS2"
fi
rm -rf "$T2"

# ------------------------------------------------------- T3/T4: signal paths
#
# The mock records its own lifecycle in files. Matching on process names failed
# three ways: a generic name matched another session's process, a marker in a
# comment never reaches `ps`, and a marker before `exec` is replaced by it.
_signal_case() {
  local sig="$1" want_rc="$2" label="$3"
  local dir started stopped wpid rc
  dir=$(mktemp -d)
  started="$dir/started"
  stopped="$dir/stopped"

  _make_fixtures "$dir/bin"
  _mock_pnpm "$dir/bin" "touch '$started'
trap \"touch '$stopped'; exit $want_rc\" $sig
for _ in \$(seq 1 60); do sleep 0.5; done
echo \"green: 171   red: 0\"; exit 0"

  PATH="$dir/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" > /dev/null 2>&1 &
  wpid=$!

  # Wait for the mock to say it started rather than sleeping a fixed amount.
  # A fixed 3 s was enough most of the time and not enough on a loaded machine,
  # which made this test itself flaky — one run in three failed while the code
  # under test was fine.
  local waited=0
  while [ ! -f "$started" ] && [ "$waited" -lt 100 ]; do
    sleep 0.2
    waited=$((waited + 1))
  done

  if [ -f "$started" ]; then _ok "$label: mock sweep が起動する"; else _ng "$label: mock sweep が起動する" "20 秒待っても起動せず"; fi

  kill -"$sig" "$wpid" 2>/dev/null
  wait "$wpid" 2>/dev/null
  rc=$?
  _eq "$label: rc $want_rc を返す" "$want_rc" "$rc"

  sleep 1
  if [ -f "$stopped" ]; then
    _ok "$label: signal が sweep 本体まで届く"
  else
    _ng "$label: signal が sweep 本体まで届く" "mock は $sig を受けていない"
  fi

  if [ ! -e "$FIFO" ]; then _ok "$label: FIFO が残らない"; else _ng "$label: FIFO が残らない"; fi
  rm -rf "$dir"
}

_signal_case TERM 143 "TERM"

# SIGINT is not exercised the same way. A shell script started in the
# background inherits SIGINT as ignored — POSIX says so, and bash honours it —
# so `kill -INT` from this test never reaches the trap no matter how the script
# is written. Verified with a standalone probe: the same script answers TERM and
# ignores INT purely because of how the test launches it.
#
# Ctrl-C from a terminal arrives at the foreground process group instead, which
# is a path a background-launched test cannot reproduce. What can be checked is
# that the handler is wired at all.
if grep -q "trap '_on_signal INT 130' INT" "$SCRIPT"; then
  _ok "INT: handler が登録されている (実配送は前面起動でのみ検証可)"
else
  _ng "INT: handler が登録されている"
fi

# ------------------------------------------------------------- T5: no strays
#
# Identify leftovers by this shell's own children rather than by script name,
# which would also match a copy running in another session.
STRAY=$(pgrep -P $$ 2>/dev/null | wc -l | tr -d ' ')
_eq "子 process が残らない" "0" "$STRAY"

echo
echo "pass=$PASS fail=$FAIL"
[ "$FAIL" = "0" ]
