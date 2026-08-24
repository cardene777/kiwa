# Contributing to kiwa

Thank you for considering contributing to kiwa.
We welcome bug reports, documentation fixes, tests, examples, and feature improvements.

## Language policy (SSOT)

This policy covers contributions **to this repository**. It does not govern the
files kiwa generates into your own project — those follow your project's
conventions and the skill's `$DOC_LANG` setting.

Each surface below names the language it accepts. The split follows what a
reader needs in order to act: entry points a newcomer must read before
contributing are English, while the running record of how a change was made may
be in either language.

**English only:**

- Code comments and identifiers
- Test and suite names
- Issue and Discussion titles, bodies, and comments
- `README.md` and the English documentation locale (`docs/en/`)
- Contributor-facing guides such as `.changeset/README.md`

**English or Japanese — either is fine, and no translation is expected:**

- Commit messages (see § Commit message style)
- Pull request titles, bodies, and review comments
- `.github/PULL_REQUEST_TEMPLATE.md`
- Changeset summaries (`.changeset/*.md`, excluding `README.md`) and the
  CHANGELOG entries generated from them
- Security reports (see [`SECURITY.md`](./SECURITY.md))

**Localized content — write in the language of the locale you are editing:**

- `README.ja.md`, the default documentation locale (unprefixed paths under
  `docs/`), and `docs/ja/` are Japanese
- `docs/en/` is English

Note that `docs/` is **not** uniformly English. Its root locale is Japanese and
English lives under `docs/en/`, as configured in `docs/.vitepress/config.mts`.
Adding English prose to a Japanese page (or the reverse) is not the same as
contributing in English — localized pages stay in their own language.

These rules govern **prose**. Embedded code, comments, identifiers, frontmatter
keys, and commit-trailer tokens (`Co-authored-by:` and similar) keep their own
syntax and language requirements no matter what surrounds them. A Japanese pull
request body may contain an English code block, and a review suggestion written
in Japanese still carries English code comments.

For anything not listed above, apply this rule: if a reader consumes it to
understand or use the project, write English; if it exists to record how a
change was made, either language is fine. When neither reading is clear, choose
English — it is the safer default for a public repository.

This policy applies to **new work** starting at v2.18. Existing content that
predates it is left as is; **no rewriting of past commits or pull requests is
expected or wanted**. Japanese content in English-required surfaces will be
migrated opportunistically; please do not open bulk-translation PRs without
discussing scope first.

## Getting started

1. Fork and clone the repository
2. Install dependencies (`pnpm install`)
3. Run tests (`pnpm test:all` — not `pnpm test`, which stops at the first failure)
4. Make sure typecheck passes (`pnpm typecheck:all`)
5. Make sure build passes (`pnpm build`)
6. Sign off every commit with `git commit -s`

The `Signed-off-by:` trailer that `-s` adds certifies the Developer Certificate
of Origin version 1.1, reproduced verbatim in [`DCO`](./DCO). It states where
the contribution came from. It is separate from the ownership and relicensing
terms in [`LICENSE`](./LICENSE), which you agree to by opening a pull request.

### When tests fail

`pnpm test` runs `pnpm -r test`, which stops at the first package that fails.
One red package hides every other one, and the count is invisible. Two example
packages had been failing since a rewrite in `@kiwa-lab/mobile` and
`@kiwa-lab/desktop`, and nobody saw it, because something earlier in the
alphabet failed first.

`pnpm test:all` runs every package that has a `test` script and reports each
failure. Measured on 166 packages it takes about 21 minutes serially and about
5 with `--jobs 4` (see below); both numbers move with the machine. It prints a
line per package as it goes:

```
$ pnpm test:all
testing 171 packages, one at a time

[  1/171] ok    examples/auth-auth0-poc  6.6s
[122/171] ok    examples/orm-drizzle-mysql-poc  25.1s
[127/171] ok    examples/orm-prisma-mysql-poc  65.9s
[171/171] ok    tests/release-smoke  60.1s
...

green: 171   red: 0   dirty: 0   not run: 0
```

The four counters add up to the number of packages, always: one verdict each.
A package that failed *and* wrote into the repository is counted red, said so on
its own line, and listed in the dirty section, because that is where you look to
find out what wrote.

Four verdicts, and only one of them means the package is fine:

- `ok` — passed, and left the working tree as it found it.
- `RED` — failed, and its own output blames no missing tool.
- `SKIP` — failed, and its output names a tool that is not installed. It is
  printed with the line that says so, and the tool's install command. **This
  never means "passed," and it counts as a failure.** The first signature found
  wins, so a package that failed on its own *and* mentioned a missing tool lands
  here too; the classification tells you what to install, it does not excuse
  anything. `--allow-missing-tools` exits 0 anyway.
- `DIRTY` — the package's tests changed the working tree. A test that writes
  into the repository is a test with a side effect, and a `git add -A`
  afterwards sweeps it into an unrelated commit. This is a failure of the
  package that did it, whatever its exit code. The check reads
  `git status --porcelain` at the repository root: a test that writes outside
  the repository, or into an ignored path, is invisible to it.

It exits 1 when anything is red, blocked or dirty, and 4 when the invocation
itself was wrong — `--jobs 0`, a flag with no value, an `--only` that matches
nothing. Retrying on 1 can make sense; retrying on 4 cannot.

### Running the sweep in parallel

`pnpm test:all -- --jobs 4` runs four packages at a time. The default is 1, so
nothing changes unless you ask.

It was serial because many `test` scripts build the workspace packages they
depend on, so two at once rewrite the same `dist` while the other reads it. The
parallel path removes that cause instead of hoping: it builds the workspace once
up front and sets `KIWA_DEPS_PREBUILT=1`, which makes `scripts/build-deps.mjs` a
no-op in every child. What is left is two groups that contend on something the
machine has one of, and each gets a lane that stays serial — the targets that
declare `testcontainers`, and the three that launch a browser. Across all lanes
together, no more than `--jobs` targets run at a time.

**Parallel mode cannot tell you which package dirtied the tree.** That answer
comes from reading `git status` before and after each package, which means
nothing when several are running. The sweep still fails and still names the
paths; finding the owner means re-running with `--jobs 1`, and it says so.

Pick `--jobs` from what the machine has. Every target runs its own vitest, which
starts workers of its own, so 4 already keeps eight cores busy.

**Four packages are flaky, and they are the ones that start containers:**
`orm-drizzle-mysql-poc`, `orm-drizzle-postgres-poc`, `orm-prisma-mysql-poc` and
`orm-prisma-postgres-poc`. Two full sweeps taken the same day disagreed about
all four — red in one, green in the other — and the package that took 187 s in
the first took 25 s in the second. The four of them together went from 16
minutes to 2.3.

What the failure looks like differs between the pairs. The Prisma pair names a
case and a timeout: `T-PM-001` at 240 s, `T-PP-001` at 180 s. The Drizzle pair
reports only `FAIL .vitest-dist/tests/users-repo.test.js` — a sweep does not say
which case failed there, or why, so `--only` is the way to find out.

So a red in one of those four is not by itself evidence that you broke
something. Re-run it alone with `--only` before believing it — they pass in
seconds that way. Everything else is green on `main`, and a red anywhere else is
worth taking at face value. What makes these four swing by a factor of seven is
not yet known, and is tracked in #1800.

**If you do hit a red one, `bash scripts/measure-sweep-vitals.sh` runs the sweep
while recording memory, swap, containers and load.** The red run that opened
#1800 was never measured, and six attempts to reproduce it since — alone, in a
partial sweep, in two full sweeps, with two codex runs competing for memory —
all came back green. Whoever sees it next has the chance nobody has had yet.

The four ORM examples need a working container runtime. Even in a good run they
are the slowest examples in the sweep — 2.3 minutes between them, against
seconds for most others.

Keep this section in step with what a sweep actually reports — if it goes stale
it stops being a way to tell your own breakage from the pre-existing kind, which
is the only reason it is here.

Use `--only <substring>` while iterating on one package, and `--timeout <n>` to
change the per-package limit (900 seconds by default; a package killed for
exceeding it is reported red, never green).

Two things to know before you trust a number it prints:

- **Do not edit the tree while a sweep runs.** Anything that changes during a
  package's run is blamed on that package. A sweep once reported
  `packages/lean/tests/async.test.ts` as dirtied by
  `examples/nextjs-safe-multisig`, because that is where the file was edited.
- **A killed package can poison the ones after it.** A package that hangs is
  killed at the timeout, but a server its Playwright config started can survive
  the kill and hold its port. The next package that wants that port then fails
  with `already used` for a reason that has nothing to do with it. Check any red
  package alone with `--only` before believing it.

### Running only what changed

Every package under `packages/`, and `tests/release-smoke`, has a second entry
point: `test:fast`. It runs the TypeScript sources directly instead of the `tsc`
output the full run uses, and passes vitest's `--changed` so that only the files
your edits affect are collected.

```
$ pnpm -F @kiwa-lab/auth test:fast                           # against main
$ KIWA_FAST_BASE=HEAD pnpm -F @kiwa-lab/auth test:fast       # uncommitted only
$ pnpm -F kiwa-release-smoke test:fast
```

The base is `main` unless `KIWA_FAST_BASE` names another ref. Nothing changed
means nothing runs, and that exits 0.

**Do not edit `test:fast` by hand.** `scripts/sync-test-fast.mjs` derives it
from each package's own `test`, so a flag added to `test` reaches `test:fast`
by re-running the script. Written by hand, the two drift and the fast route
keeps running under whatever flags it was born with.

```
$ node scripts/sync-test-fast.mjs           # report drift (exits 1 when stale)
$ node scripts/sync-test-fast.mjs --write   # bring every package back in line
```

**It is a filter, not a gate.** An edit vitest cannot see in the module graph
selects nothing, and the run is green having checked nothing about it — the
release-smoke checks in particular read files rather than importing them, so
most edits outside that package select none of them. `pnpm test` is what decides
whether a package is green.

Two checks keep the route honest, because the routes share no code and would
otherwise drift unnoticed. `fast-route-equivalence.test.ts` runs both routes
with `vitest list` and fails when they collect a different number of files, a
different number of tests, or different files. `test-fast-sync.test.ts` fails
when any package's `test:fast` is not what the script derives from its `test`.

### What `pnpm test` actually needs

Measured, by hiding each tool and running the sweep — not by reading
`package.json`.

| tool | needed by | what you see without it |
|---|---|---|
| Node.js 20+, pnpm 10+ | everything | — |
| Playwright Chromium | the 22 packages whose `test` script ends in `playwright test` | `Executable doesn't exist at .../chromium_headless_shell-1223` |
| Foundry (`anvil` on `PATH`) | the packages that start a chain, through `@kiwa-lab/dapp` | `Error: anvil not found in PATH` |
| A container runtime | the four `orm-*-poc` examples listed above | they are red either way today, so this buys you nothing yet |

Beyond those:

- **Docker is needed by four examples, and by no others.** Thirty-four examples
  name `testcontainers` somewhere:

  | | examples |
  |---|---|
  | declare it as a dependency | 6 |
  | reach for it with `await import('testcontainers' as string)`, undeclared | 3 |
  | name it only in a `package.json` description | 6 |
  | name it in a README, source or test as well | 19 |

  Only the four `orm-*-poc` examples actually start a container under
  `pnpm test`; the rest never reach a `real` adapter and pass with `DOCKER_HOST`
  pointed at a socket that does not exist. The four that do reach one are red on
  `main` with the runtime present, so having Docker does not currently turn them
  green — it only changes how they fail.
- **`expo`, `react-native`, `metro`, `gradle`, `electron-builder` and
  `electron-updater` are not needed.** Two dogfood examples used to spawn them,
  and one of them ran `/usr/bin/osascript` on macOS. Those examples and the
  mobile / desktop adapters they drove are gone, so nothing spawns them.

### When typecheck fails

`pnpm typecheck` runs `pnpm -r`, which stops at the first package that fails. One
red package hides every other one, and the number of them is invisible: this
repository once sat with eight red packages, failing for five different reasons,
while a single error was all anyone ever saw.

`pnpm typecheck:all` runs every package and reports each failure:

```
$ pnpm typecheck:all
typechecking 173 packages, 1 at a time

RED  examples/nuxt-server-routes-full
       server/plugins/analytics.ts(17,34): error TS2345: Argument of type ...
       ... and 16 more (--verbose)

green: 172   red: 1
```

`main` is green here: 173 packages, 0 red. The block above shows the shape of a
failure, not the current state.

It is sequential on purpose. Many `typecheck` scripts build the workspace
packages they depend on, so two running at once rewrite the same `dist` while
the other reads it, and `tsc` reports missing members that exist. `--jobs 4`
runs them concurrently and will invent red packages that pass when run alone.

### When typecheck passes

A green typecheck says nothing about the files it never opened. Most packages
exclude `tests/` from `tsconfig.json` and compile it in the `test` script
instead; Playwright specs are compiled by neither, because Playwright transpiles
with esbuild and never looks at a type.

`pnpm typecheck:coverage` finds test files that nothing compiles, and exits 1 if
there are any:

On `main` it finds none:

```
$ pnpm typecheck:coverage
packages with test files: 171
packages whose tests nothing compiles: 0
```

When it does find one, it names the package and the files nothing compiles:

```
packages whose tests nothing compiles: 1

  examples/remix-full   1/6
      tests/e2e/remix-server.spec.ts
```

Run it after adding a test directory, a tsconfig, or a `typecheck` script. It
asks `tsc --showConfig` which files each config resolves rather than reading
`include` and `exclude` by hand, because `exclude` beats `include` and `extends`
chains are not obvious.

## Development setup

- Node.js 20+
- pnpm 10+
- Foundry (`anvil` / `forge` on `PATH`)
- Playwright Chromium (`pnpm exec playwright install chromium`)

Optional but useful:

- GitHub CLI for issue and PR workflows
- A local example app from `examples/` when validating end-to-end changes

## Repository layout

- `packages/dapp` — `@kiwa-lab/dapp` Playwright fixture runtime
- `packages/cli` — `@kiwa-lab/cli` project scaffolding and CLI commands
- `docs/` — English and Japanese documentation
- `examples/` — sample dApps and integration targets
- `tests/` — skill-chain docs, fixtures, and verification assets

## Skill chain workflow

kiwa contributors typically use the kiwa skill chain itself when adding tests
(self-host pattern). See:

- [tests/docs/README.md](./tests/docs/README.md) — overview
- [tests/docs/run-tests.md](./tests/docs/run-tests.md) — one-command full chain
- [tests/docs/skill-chain-tutorial.md](./tests/docs/skill-chain-tutorial.md) — step-by-step

When changing generated output, test the affected layer directly and update related
docs or examples if the workflow changes.

## Commit message style

We use emoji-prefixed conventional commits in Japanese (for example,
`📚 docs(scope): ...`), which § Language policy (SSOT) permits.
For English contributions, `feat:`, `fix:`, and `docs:` prefixes are also accepted.

Keep commits focused and easy to review.
If a change affects both packages and docs, explain the user-facing impact in the
commit body or pull request description.

## Pull request checklist

- [ ] `pnpm typecheck:all` shows no red package
- [ ] `pnpm test:all` shows no red or dirty package that `main` does not already show. `main` currently has 5 red and 0 dirty (see § When tests fail); adding to them is not allowed, and `pnpm test` cannot tell you either way because it stops at the first failure
- [ ] `pnpm build` passes
- [ ] Documentation updated (if API changed)
- [ ] Changeset added (`pnpm changeset`) for package version bumps

## Reporting issues

Open an Issue at <https://github.com/cardene777/kiwa/issues> with:

- Reproducer (minimal example or link to a public repo)
- Expected vs actual behavior
- Environment (Node.js version, OS, Foundry version)

Security issues should not be reported publicly.
Please follow [SECURITY.md](./SECURITY.md) instead.

## Other channels

For long-form questions or proposals that do not fit an Issue, use [GitHub Discussions](https://github.com/cardene777/kiwa/discussions).
For quick replies / DMs, you can also reach the maintainer on X at [@cardene777](https://x.com/cardene777). Please use Discussions or Issues for anything that benefits from being searchable.

## License

By contributing, you agree to the contribution terms in [`LICENSE`](./LICENSE): the
contribution grant that lets you fork and open a pull request, and the Developer
Certificate of Origin under which accepted contributions become the property of the
copyright holder. The project is pre-release and All rights reserved — contributions are
**not** placed under an open-source license at this stage.
