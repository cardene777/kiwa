#!/usr/bin/env bash
#
# Refuse to make unverified work permanent.
#
# `.claude/rules/dev-flow.md` puts `verify` before `ship`, and says a change with
# a failing gate never reaches `ship`. Read as context, that is advice. This hook
# is the part that refuses.
#
# Claude Code runs it before every Bash call. It looks at `git commit` and
# `git push`, the two that outlive the session. `/verify` records a passing run
# in `.kaname/verified`; a specification file newer than that record has not been
# through the gates.

set -uo pipefail

# See the same block in spec-gate.sh. Neither gate can judge without one of
# these, and a gate that cannot judge refuses rather than waves through.
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
  echo "kaname verify-gate: neither jq nor node is on PATH, so this command could not be checked." >&2
  exit 2
fi

payload=$(cat)
command_line=$(json_field "$payload" .tool_input.command)
[ -n "$command_line" ] || exit 0

# `git commit` and `git push` written plainly, and nothing else. A form this
# misses — `git -C other-repo commit` — is a deliberate trade: a gate that guesses
# wrong and blocks an unrelated command is a gate people delete.
gated_git='(^|[^[:alnum:]_.-])git[[:space:]]+(commit|push)([[:space:]]|$)'
[[ $command_line =~ $gated_git ]] || exit 0

root=${CLAUDE_PROJECT_DIR:-}
[ -n "$root" ] || root=$(json_field "$payload" .cwd)
[ -n "$root" ] || root=$PWD

spec_dir=docs/spec
if [ -f "$root/kaname.config.json" ]; then
  configured=$(json_field "$(cat "$root/kaname.config.json")" .specDir)
  [ -n "$configured" ] && spec_dir=$configured
fi

# A project with no specification has nothing for this gate to hold up. The
# readme is not a specification: it carries no criteria, so editing it neither
# needs verifying nor invalidates one.
spec_path="$root/$spec_dir"
[ -d "$spec_path" ] || exit 0
specs=$(find "$spec_path" -type f -name '*.md' ! -name 'README.md' -print 2>/dev/null | head -n 1)
[ -n "$specs" ] || exit 0

marker="$root/.kaname/verified"
if [ ! -f "$marker" ]; then
  {
    printf 'kaname verify-gate: nothing has verified %s, so this would make an\n' "$spec_dir"
    printf 'unverified specification permanent.\n\n'
    printf 'Run /verify. It runs the formal, runtime and human gates in order, stops at\n'
    printf 'the first failure, and records the result in .kaname/verified.\n'
  } >&2
  exit 2
fi

# Modification time, not content: whatever changed in a specification since the
# gates last ran has not been through them, and the gates are what decide that.
stale=$(find "$spec_path" -type f -name '*.md' ! -name 'README.md' -newer "$marker" -print 2>/dev/null | head -n 1)
[ -n "$stale" ] || exit 0

record=$(head -n 1 "$marker" 2>/dev/null)
[ -n "$record" ] || record="(the record is empty)"
relative=${stale#"$root"/}
{
  printf 'kaname verify-gate: %s changed after the last verification.\n\n' "$relative"
  printf '  last verified: %s\n\n' "$record"
  printf 'Run /verify again. Writing to .kaname/verified by hand passes this gate the\n'
  printf 'same way editing an assertion passes a test. See .claude/rules/verification.md.\n'
} >&2
exit 2
