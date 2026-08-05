# Turning off `tsup`'s `clean`, and what that leaves open

`clean` empties `dist/` at the start of every build. The packages that have a `test`
script — 171 of them — rebuild their shared dependencies during `test`, and
`pnpm -r test` runs them in parallel, so that emptying overlaps with whatever is
reading `dist/` at the time. Removing `clean` removes the overlap (#1741, #1724).

`clean` also served a second purpose — deleting output that a later build no longer
produces. That job moved to `scripts/clean-dist.mjs`, which runs at the head of
`release`, before anything is published.

`tests/release-smoke/tests/tsup-clean-race.test.ts` holds the invariants. It writes a
marker into `dist/`, runs the package's own build script, and reads the result: a
surviving marker means `clean` is off. Observing the real build is what makes the check
independent of how the config is written — five earlier rounds of parsing or evaluating
`tsup.config.ts` each produced a new way around it.

This document records what that approach cannot cover, and the decision for each
(#1750).

## Closed

### The chunk side is verified, not assumed

`cli` and `dapp` emit content-hashed chunks, so their output is not a fixed set of six
files. They are listed separately from the fixed-output packages.

The check used to define "chunk side" as "does not emit exactly the fixed six". A package
that emits no chunks but happens to produce a different count would sit on the chunk side
while actually being fixed, and the name of the classification would stop matching its
contents.

Both sides are now checked against the thing the classification claims: the chunk side
must emit at least one content-hashed file (`chunk-P3SA3F4I.js`, `vitest-CF4UUB4M.d.ts`),
and the fixed side must emit none.

The test recognises hashes by name — eight uppercase alphanumerics before the extension —
which is a convention, not proof. A hand-written entry called `foo-DEADBEEF.js` would read
as a chunk. Deciding it properly means asking esbuild for its metafile and following the
entry-to-chunk relation, which reintroduces exactly what this suite gave up: reconstructing
what the bundler did instead of looking at what it produced. The convention is accepted,
and a false positive is treated as a prompt to revisit the classification.

### A config cannot read the marker

The check adds a file to `dist/` before building. A config that branches on whether that
file exists could emit one shape while being measured and another in normal builds.

There is no marker-free route. `tsup`'s `clean` calls `removeFiles(['**/*'], outDir)`,
which globs the *contents* — the directory itself is never removed, so its inode is
unchanged either way. Modification times do not separate the two cases either: with
`clean` on, files are deleted and rewritten; with it off, they are overwritten in place.
Both leave every output newer than the start of the build. The only observable difference
is whether something that the build does not write survives, and the check has to put
that something there.

So the marker stays, and the configs are checked for reading it. No `tsup.config.ts`
belonging to a checked package may import `node:fs` (or `fs`, or `node:fs/promises`) by
`import`, `require`, or dynamic `import()`, and none may mention the marker name. A
config decides entry points and output formats; it has no reason to read a file while
being evaluated.

Banning the module rather than listing function names is deliberate. Naming
`existsSync` / `readdirSync` / `statSync` / `readFileSync` leaves `opendirSync`,
`globSync`, and `fs.promises.readdir` — the list grows every time someone finds another
one. Comments are stripped by parsing the file rather than by matching line prefixes, so
a trailing `// existsSync()` in a design note no longer reads as code.

The 41 configs belonging to the checked packages are scanned; the check also fails if
that count collapses, so a filter mistake cannot make it pass by scanning nothing.

This closes writing the read directly. It does not close indirection — assembling
`'node:' + 'fs'` and passing it to a dynamic import, or reading through another module. A
config is arbitrary JavaScript evaluated at build time, and any check that works by
observation can be made to react to the observation. What is left is a narrower gap than
an unchecked one, not a closed one.

### Publishing has one entrance

`clean-dist.mjs` runs at the head of the root `release`. Nothing stopped someone from
running `pnpm publish --filter <package>` instead, which skips it — and every package
declares `files: ["dist"]`, so whatever is in `dist/` goes into the tarball. The
acceptances below all rest on "it gets removed before publishing", which was not enforced.

`release` now exports `KIWA_RELEASE=1` *after* the cleanup succeeds, and
`scripts/assert-pnpm-publish.mjs` — wired as `prepublishOnly` on all 71 publishable
packages — refuses to publish without it. Setting the marker after the cleanup matters:
before it, a failed cleanup would still allow the publish.

## Accepted

### An immutable declaration file survives the failure cleanup

When a build fails, the build script deletes the declaration files so that a stale
declaration cannot pair with fresh JavaScript:

```
tsup || node -e "...rmSync(f, {force: true})...; process.exit(1)"
```

`chflags uchg dist/index.d.ts` makes that deletion fail — `rmSync` raises `EPERM` even
with `force: true`, and the file stays (measured). The build still exits non-zero, so the
failure is visible; what is lost is the cleanup.

`clean-dist.mjs` does not remove it either. A recursive `rmSync` over a directory holding
an immutable file fails with `ENOTEMPTY` (measured). So the guarantee here is not "it gets
removed before publishing" — it is that `release` stops. The cleanup runs first and its
failure propagates, so nothing is published from a directory that could not be emptied.
The script deliberately does not catch that error; swallowing it would report success and
carry on to the publish.

Accepted. Setting the immutable flag is a deliberate local act, not something a build or a
dependency does, and the failure is loud rather than silent. Catching it earlier would
mean the check performing the same `chflags` dance on every package on every run.

### PowerShell as the script shell

`tsup || node -e "..."` assumes the shell understands `||`. `sh` and `cmd.exe` both do.
PowerShell 5.1 does not — it fails to parse. A repository can select it with
`script-shell=powershell.exe` in `.npmrc`.

Accepted, because this repository does not target Windows as a development environment.
`package.json` declares `engines.node >= 20` and no `os` field, there is no `.npmrc`
pinning a shell, and the tooling assumes POSIX utilities in several places. `README.md` に Windows への言及があっても、 それは
library の利用者側の対応範囲を指すもので、 kiwa 自体を Windows で build する話ではない。

If that changes, the cleanup has to move out of the shell — a small Node script invoked
as `tsup || node scripts/drop-declarations.mjs` would work in any shell, at the cost of
one more file per package.

Not targeting Windows is not a licence to fail open on it. `clean-dist.mjs` used to check
containment by comparing against a prefix ending in a literal `/`; where the separator is
`\`, that comparison is always false and the script would delete nothing while still
reporting success — the publish would then proceed over an uncleaned `dist/`. It now uses
`relative()`, which does not depend on the separator. An unsupported platform should
behave correctly or refuse, not quietly do nothing.

### A killed shell skips the cleanup

The premise recorded in #1750 was that `SIGKILL` prevents the `||` branch from running.
Measurement shows that is only true in part.

| What is killed | Cleanup | Why |
|---|---|---|
| `tsup` alone, by pid | Runs | The shell survives, sees exit status 137, and takes the `||` branch (measured) |
| The shell, or the whole process group | Skipped | Nothing is left to run it — the stale declaration remains (measured) |

The first case is handled. The second cannot be: it is outside the shell by definition,
and no in-process handler survives `SIGKILL`.

Which case is more common is not something this repository can claim either way. Two
routes reach the second: `scripts/test-all.mjs` sends `SIGKILL` to the child's whole
process group when a package exceeds its time limit, and pressing Ctrl-C signals the
foreground process group. Killing `tsup` alone requires finding its pid deliberately.

Accepted, on the same grounds as the immutable file. The residue is local and
`scripts/clean-dist.mjs` clears it before publishing. Closing it would need a layer
outside the build (a check at the head of the next build that declarations and JavaScript
came from the same run), which costs more than the failure it prevents.

## The shape of what is accepted

All three accepted items end at the same place: a stale declaration in a local `dist/`,
and `scripts/clean-dist.mjs` standing between it and a publish. What that step guarantees
is narrower than "it gets removed" — it either empties the directory or fails, and
`release` stops on the failure. Either way nothing is published over stale output.

That is the whole of the safety net, which is why the review of #1750 spent most of its
findings on it: whether it runs at all, whether it can be bypassed by publishing a single
package, whether it does nothing on a platform with a different path separator, and
whether it reports success when it could not delete.

### That step had not been running

Writing the three acceptances down made the dependency on `clean-dist.mjs` explicit, and
checking it revealed that the script could not start. Its opening comment contained
`packages/` followed by `*` and `/dist`; the `*` and `/` closed the block comment, and
everything after it parsed as code:

```
SyntaxError: Unexpected identifier 'tsup'
```

It had been in that state since #1741 introduced it. `pnpm release` would have stopped at
its first step, so nothing was published from a dirty `dist/` — but the safety net the
whole "turn `clean` off" decision rests on was not there.

The existing check only asserted that the file exists and that `release` starts with it.
Existence is not the property that matters. The suite now runs the real script against a
temporary tree with the same layout and checks what it does: stale declarations and
chunks removed, nested directories removed with them, `src/` and `package.json`
untouched, and the reported count matching. A separate check runs `node --check` on it,
so a script that cannot parse fails here rather than during a release.

The same `*` and `/` mistake appeared in a test comment written for this change and was
caught by `tsc`; the script had no such check because it is not compiled.
