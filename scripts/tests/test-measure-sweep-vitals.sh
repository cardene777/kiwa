#!/usr/bin/env bash
#
# Exercise `scripts/measure-sweep-vitals.sh` end to end against a stand-in for
# `pnpm`, so the parts that only matter when a sweep goes wrong — the exit code,
# the samples on either side, the signal reaching the sweep itself — are checked
# without waiting 45 minutes for a real one.
#
# Usage:
#   bash scripts/tests/test-measure-sweep-vitals.sh
set -uo pipefail

ROOT="$(CDPATH='' cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd -P)"
SCRIPT="$ROOT/scripts/measure-sweep-vitals.sh"
PASS=0
FAIL=0

_ok()  { PASS=$((PASS+1)); printf '  ok   %s\n' "$1"; }
_ng()  { FAIL=$((FAIL+1)); printf '  NG   %s\n' "$1"; [ $# -ge 2 ] && printf '       %s\n' "$2"; }

_mock_bin() {
  local dir="$1" body="$2"
  mkdir -p "$dir"
  printf '#!/usr/bin/env bash\n%s\n' "$body" > "$dir/pnpm"
  chmod +x "$dir/pnpm"
}

echo "== measure-sweep-vitals =="

# T1: 正常終了で rc 0、両端 sample、log に時刻が付く
T1=$(mktemp -d)
_mock_bin "$T1/bin" 'echo "[  1/171] ok    examples/foo  1.0s"; sleep 1; echo "green: 171   red: 0   dirty: 0   not run: 0"; exit 0'
OUT1=$(PATH="$T1/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" 2>&1)
RC1=$?
if [ "$RC1" = "0" ]; then _ok "正常終了で rc 0"; else _ng "正常終了で rc 0" "rc=$RC1"; fi

if grep -qE '^[0-9]{2}:[0-9]{2}:[0-9]{2}  \[' "$ROOT/.context/scratch/sweep-measured.log"; then
  _ok "log の各行に時刻が付く"
else
  _ng "log の各行に時刻が付く" "$(head -2 "$ROOT/.context/scratch/sweep-measured.log")"
fi

NROWS=$(tail -n +2 "$ROOT/.context/scratch/sweep-vitals.tsv" | grep -c .)
if [ "$NROWS" -ge 2 ]; then _ok "sample が 2 行以上ある ($NROWS)"; else _ng "sample が 2 行以上ある" "$NROWS"; fi

NCOL=$(head -1 "$ROOT/.context/scratch/sweep-vitals.tsv" | awk -F'\t' '{print NF}')
if [ "$NCOL" = "8" ]; then _ok "列が 8 つ (pageouts / compressed 追加)"; else _ng "列が 8 つ" "$NCOL"; fi

if [ -s "$ROOT/.context/scratch/sweep-procs.log" ]; then
  _ok "process log が空でない"
else
  _ng "process log が空でない"
fi
rm -rf "$T1"

# T2: sweep 失敗で rc を保持する
T2=$(mktemp -d)
_mock_bin "$T2/bin" 'echo "[122/171] RED   examples/orm-drizzle-mysql-poc  187.3s"; exit 37'
PATH="$T2/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" > /dev/null 2>&1
RC2=$?
if [ "$RC2" = "37" ]; then _ok "sweep の rc を保持する (37)"; else _ng "sweep の rc を保持する" "rc=$RC2"; fi

# 即時失敗でも両端 sample が残る
NROWS2=$(tail -n +2 "$ROOT/.context/scratch/sweep-vitals.tsv" | grep -c .)
if [ "$NROWS2" -ge 2 ]; then _ok "即時失敗でも sample が 2 行以上 ($NROWS2)"; else _ng "即時失敗でも sample が 2 行以上" "$NROWS2"; fi
rm -rf "$T2"

# T3: TERM で sweep を中断し 143 で終わる
#
# mock は「起動したことを file に残してから待つ」 形にする。pgrep で掴む形は
# 一般的な名前 (`sleep 20`) だと無関係な session を拾い、marker を付けると
# comment は ps に出ず exec は marker を消す、で 3 回外した。file なら確実に見える。
T3=$(mktemp -d)
STARTED="$T3/started"
STOPPED="$T3/stopped"
_mock_bin "$T3/bin" "touch '$STARTED'
trap \"touch '$STOPPED'; exit 143\" TERM
for _ in \$(seq 1 50); do sleep 0.5; done
echo \"green: 171   red: 0\"; exit 0"

PATH="$T3/bin:$PATH" SWEEP_VITALS_INTERVAL=1 bash "$SCRIPT" > /dev/null 2>&1 &
WPID=$!
sleep 3

if [ -f "$STARTED" ]; then
  _ok "mock sweep が起動している"
else
  _ng "mock sweep が起動している"
fi

kill -TERM "$WPID" 2>/dev/null
wait "$WPID" 2>/dev/null
RC3=$?
if [ "$RC3" = "143" ]; then _ok "TERM で 143 を返す"; else _ng "TERM で 143 を返す" "rc=$RC3"; fi

# mock 自身が TERM を受け取ったか。受け取っていれば signal が sweep まで届いている。
sleep 1
if [ -f "$STOPPED" ]; then
  _ok "TERM が sweep 本体まで届く"
else
  _ng "TERM が sweep 本体まで届く" "mock は TERM を受けていない"
fi
rm -rf "$T3"

# T4: sampler が残らない
if pgrep -f "measure-sweep-vitals" > /dev/null 2>&1; then
  _ng "sampler が残らない" "$(pgrep -fl 'measure-sweep-vitals' | head -2)"
else
  _ok "sampler が残らない"
fi

echo
echo "pass=$PASS fail=$FAIL"
[ "$FAIL" = "0" ]
