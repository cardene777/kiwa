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

### When tests fail

`pnpm test` runs `pnpm -r test`, which stops at the first package that fails.
One red package hides every other one, and the count is invisible. Two example
packages had been failing since a rewrite in `@kiwa-lab/mobile` and
`@kiwa-lab/desktop`, and nobody saw it, because something earlier in the
alphabet failed first.

`pnpm test:all` runs all 219 of them and reports each failure. It takes about
half an hour, and prints a line per package as it goes:

```
$ pnpm test:all
testing 179 packages, one at a time

[  1/219] ok    examples/astro-server-endpoints-full  2.5s
[  9/219] RED   examples/basic-connect  2.5s
        Error: No tests found
[145/219] RED   examples/nextjs-safe-multisig  (killed after 900s)  (and it dirtied the tree)  900.3s
        anything it leaked outlives it. Later packages may fail because of this one.
...

green: 211   red: 8   dirty: 0   not run: 0
2 of the red packages also dirtied the tree.
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

It exits 1 when anything is red, blocked or dirty. Like `typecheck:all`, it is
sequential on purpose: many `test` scripts build the workspace packages they
depend on, so two at once rewrite the same `dist` while the other reads it.

Use `--only <substring>` while iterating on one package, and `--timeout <n>` to
change the per-package limit (900 seconds by default; a package killed for
exceeding it is reported red, never green).

Two things to know before you trust a number it prints:

- **Do not edit the tree while a sweep runs.** Anything that changes during a
  package's run is blamed on that package. A sweep once reported
  `packages/lean/tests/async.test.ts` as dirtied by
  `examples/nextjs-safe-multisig`, because that is where the file was edited.
- **A killed package can poison the ones after it.** `examples/nextjs-safe-multisig`
  hangs, and the `next-server` its Playwright config starts survives the kill
  and keeps port 3046. `examples/nextjs-zk-verifier` uses the same port, and
  fails with `already used` for a reason that has nothing to do with it. Until
  #1397 lands, check any red package alone with `--only` before believing it.

### What `pnpm test` actually needs

Measured, by hiding each tool and running the sweep — not by reading
`package.json`.

| tool | needed by | what you see without it |
|---|---|---|
| Node.js 20+, pnpm 10+ | everything | — |
| Playwright Chromium | the 22 packages whose `test` script ends in `playwright test` | `Executable doesn't exist at .../chromium_headless_shell-1223` |
| Foundry (`anvil` on `PATH`) | the packages that start a chain, through `@kiwa-lab/dapp` | `Error: anvil not found in PATH` |

Nothing else. In particular:

- **Docker is not needed.** Thirty-four examples name `testcontainers` somewhere:

  | | examples |
  |---|---|
  | declare it as a dependency | 6 |
  | reach for it with `await import('testcontainers' as string)`, undeclared | 3 |
  | name it only in a `package.json` description | 6 |
  | name it in a README, source or test as well | 19 |

  All of them pass with `DOCKER_HOST` pointed at a socket that does not exist,
  because a container is only started by a `real` adapter and `pnpm test` never
  reaches one.
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
typechecking 179 packages, 1 at a time

RED  examples/nuxt-server-routes-full
       server/plugins/analytics.ts(17,34): error TS2345: Argument of type ...
       ... and 16 more (--verbose)

green: 220   red: 1
```

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

```
$ pnpm typecheck:coverage
packages with test files: 218
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
- [ ] `pnpm test:all` shows no red or dirty package that `main` does not already show. The pre-existing red and dirty packages are tracked in #1396 and #1397; adding to them is not allowed, and `pnpm test` cannot tell you either way because it stops at the ninth package
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

By contributing, you agree your contributions will be licensed under the MIT License.
