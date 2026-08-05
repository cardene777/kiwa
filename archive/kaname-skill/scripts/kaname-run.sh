#!/usr/bin/env bash
# kaname skill 用の @kiwa-lab/kaname API 呼出 helper。
# node -e で classify() / splitSpec() を呼出、 JSON 経由で SpecDoc を渡し、
# 2 file 生成 + classify report を stdout に返す。
#
# usage:
#   kaname-run.sh --doc <path-to-spec-doc.json> --outdir <dir>
#
# spec-doc.json format = @kiwa-lab/kaname の SpecDoc 型 = { title, items: [...] }

set -euo pipefail

doc_path=""
out_dir=""

while [ $# -gt 0 ]; do
  case "$1" in
    --doc) doc_path="$2"; shift 2 ;;
    --outdir) out_dir="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [ -z "$doc_path" ] || [ -z "$out_dir" ]; then
  echo "usage: kaname-run.sh --doc <path> --outdir <dir>" >&2
  exit 2
fi

mkdir -p "$out_dir"

script_dir="$(cd "$(dirname "$0")" && pwd)"
kiwa_root="$(cd "$script_dir/../../../.." && pwd)"

node -e "
const fs = require('node:fs');
const path = require('node:path');
const { classify, splitSpec } = require(process.argv[3] + '/archive/kaname/dist/index.cjs');
const doc = JSON.parse(fs.readFileSync(process.argv[1], 'utf-8'));
const report = classify(doc);
if (!report.ok) {
  console.error(JSON.stringify({ ok: false, issues: report.issues }, null, 2));
  process.exit(3);
}
const out = splitSpec(doc);
fs.writeFileSync(path.join(process.argv[2], 'specFormal.md'), out.specFormal);
fs.writeFileSync(path.join(process.argv[2], 'specRuntime.md'), out.specRuntime);
fs.writeFileSync(path.join(process.argv[2], 'classify-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ok: true, summary: out.summary, files: ['specFormal.md', 'specRuntime.md', 'classify-report.json'] }, null, 2));
" "$doc_path" "$out_dir" "$kiwa_root"
