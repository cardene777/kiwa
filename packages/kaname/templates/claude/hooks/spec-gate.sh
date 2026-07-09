#!/usr/bin/env bash
#
# Refuse a criterion that names nothing to check it.
#
# `.claude/rules/spec-layers.md` says an item with no verification target is a
# wish rather than a criterion. A rule is context: it is read, and it persuades.
# This hook is the part that refuses.
#
# Claude Code runs it before Write and Edit, handing the pending tool call in on
# stdin as JSON. Exit 0 lets the call through. Exit 2 blocks it and gives stderr
# back to the model as the reason, so what is written here is what it reads.

set -uo pipefail

# jq when it is installed, node otherwise. kaname is an npm package, so node is
# on the machine that installed it. With neither, the gate cannot judge — and a
# gate that cannot judge must not wave the change through. A check that is
# skipped silently becomes a check that appears to have passed, which is the one
# failure this whole tool exists to prevent.
if command -v jq >/dev/null 2>&1; then
  json_field() { printf '%s' "$1" | jq -r "$2 // empty" 2>/dev/null; }
elif command -v node >/dev/null 2>&1; then
  json_field() {
    printf '%s' "$1" | node -e '
      let raw = "";
      process.stdin.on("data", (chunk) => { raw += chunk; });
      process.stdin.on("end", () => {
        const path = process.argv[1].split(".").slice(1);
        const value = path.reduce((node, key) => (node == null ? node : node[key]), JSON.parse(raw));
        if (value != null) process.stdout.write(String(value));
      });
    ' "$2" 2>/dev/null
  }
else
  echo "kaname spec-gate: neither jq nor node is on PATH, so this change could not be checked." >&2
  exit 2
fi

payload=$(cat)
tool_name=$(json_field "$payload" .tool_name)
file_path=$(json_field "$payload" .tool_input.file_path)
[ -n "$file_path" ] || exit 0

root=${CLAUDE_PROJECT_DIR:-}
[ -n "$root" ] || root=$(json_field "$payload" .cwd)
[ -n "$root" ] || root=$PWD

spec_dir=docs/spec
if [ -f "$root/kaname.config.json" ]; then
  configured=$(json_field "$(cat "$root/kaname.config.json")" .specDir)
  [ -n "$configured" ] && spec_dir=$configured
fi

# The project root reaches here two ways, and on macOS they disagree: a path
# under /var arrives resolved as /private/var. Compare against both spellings
# rather than resolving the file, which does not exist yet on a fresh Write.
real_root=$(cd "$root" 2>/dev/null && pwd -P)
[ -n "$real_root" ] || real_root=$root

under_spec_dir=no
for base in "$root" "$real_root"; do
  case "$file_path" in
  "$base/$spec_dir"/*) under_spec_dir=yes ;;
  esac
done
[ "$under_spec_dir" = yes ] || exit 0

case "$file_path" in
*.md) ;;
*) exit 0 ;;
esac
case "${file_path##*/}" in
README.md) exit 0 ;;
esac

# Write carries the whole file. Edit carries only the replacement, so the gate
# judges one criterion at a time: introduce a heading, and the target comes with
# it in the same edit. Reconstructing the file from a patch to judge the whole
# would be a second, worse implementation of Edit.
case "$tool_name" in
Write) text=$(json_field "$payload" .tool_input.content) ;;
Edit) text=$(json_field "$payload" .tool_input.new_string) ;;
*) exit 0 ;;
esac

# A criterion heading is `## <id> — <statement>`, and an id ends in a digit. That
# is what tells `## AC-001 — ...` apart from `## Overview`, so a prose section
# is not asked to name a test.
#
# `LC_ALL=C` makes the character classes below compare bytes. The em dash in a
# target line is three of them, none alphanumeric, so it strips away with the
# backticks and leaves the target itself behind — empty exactly when there is no
# target at all.
offenders=$(
  printf '%s\n' "$text" | LC_ALL=C awk '
    BEGIN { pending = ""; problems = 0 }

    /^## / {
      if (pending != "") { print "  " pending; problems++ }
      pending = ""
      if ($2 ~ /^[A-Za-z][A-Za-z0-9_-]*[0-9]$/) pending = $0
      next
    }

    /^[[:space:]]*-[[:space:]]+\*\*Verify by\*\*/ {
      target = $0
      sub(/.*\*\*Verify by\*\*/, "", target)
      gsub(/[^[:alnum:]]/, "", target)
      if (target == "") { print "  " $0; problems++ }
      pending = ""
      next
    }

    END {
      if (pending != "") { print "  " pending; problems++ }
      if (problems > 0) exit 1
    }
  '
)
status=$?
[ "$status" -eq 0 ] && exit 0

relative=${file_path#"$real_root"/}
relative=${relative#"$root"/}
{
  printf 'kaname spec-gate: %s has a criterion that names no verification target.\n\n' "$relative"
  printf '%s\n\n' "$offenders"
  printf 'Every criterion says where it is checked:\n\n'
  printf '  ## AC-001 — the refresh token is persisted before the response is sent\n\n'
  printf '  - **Layer** — runtime\n'
  printf '  - **Verify by** — `tests/session.test.ts`\n\n'
  printf 'An item with no target is a wish. Name the file that checks it, or move\n'
  printf 'the item to the human layer and name the review that reads it. See\n'
  printf '.claude/rules/spec-layers.md.\n'
} >&2
exit 2
