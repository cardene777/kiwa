# Contributing to kiwa

Thank you for considering contributing to kiwa.
We welcome bug reports, documentation fixes, tests, examples, and feature improvements.

## Language policy (SSOT)

All public collaboration on this repository is conducted in **English**. This
covers every artifact a maintainer or reviewer encounters through the public
GitHub surface:

- Issue titles and bodies
- Pull request titles, bodies, and review comments
- Commit messages
- Code comments and identifiers
- Documentation authored under `docs/` for public consumption

The goal is a low-friction path for OSS contributors regardless of first
language. Japanese is used only in files explicitly marked as Japanese
translations (for example, `README.ja.md`, `docs/ja/`) and in internal
retrospectives outside this repository. If you must reference Japanese source
material, quote and translate the relevant fragment in English inline.

This policy is retroactive for **new work** starting at v2.18. Existing
Japanese content that predates the policy will be migrated opportunistically;
please do not open bulk-translation PRs without discussing scope first.

## Getting started

1. Fork and clone the repository
2. Install dependencies (`pnpm install`)
3. Run tests (`pnpm test`)
4. Make sure typecheck passes (`pnpm typecheck`)
5. Make sure build passes (`pnpm build`)

### When typecheck fails

`pnpm typecheck` runs `pnpm -r`, which stops at the first package that fails. One
red package hides every other one, and the number of them is invisible: this
repository once sat with eight red packages, failing for five different reasons,
while a single error was all anyone ever saw.

`pnpm typecheck:all` runs every package and reports each failure:

```
$ pnpm typecheck:all
typechecking 221 packages, 1 at a time

RED  examples/nuxt-server-routes-full
       server/plugins/analytics.ts(17,34): error TS2345: Argument of type ...
       ... and 16 more (--verbose)

green: 220   red: 1
```

It is sequential on purpose. Many `typecheck` scripts build the workspace
packages they depend on, so two running at once rewrite the same `dist` while
the other reads it, and `tsc` reports missing members that exist. `--jobs 4`
runs them concurrently and will invent red packages that pass when run alone.

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
`📚 docs(scope): ...`).
For English contributions, `feat:`, `fix:`, and `docs:` prefixes are also accepted.

Keep commits focused and easy to review.
If a change affects both packages and docs, explain the user-facing impact in the
commit body or pull request description.

## Pull request checklist

- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
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
