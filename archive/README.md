# archive

Code that is no longer built, tested or published, kept because it is expected to come back.

Nothing here is part of the pnpm workspace. `pnpm-workspace.yaml` lists `packages/*` and `examples/*`; this directory matches neither, so `pnpm -r build` and `pnpm release` skip it. That is the whole mechanism — there is no separate exclusion to keep in sync.

## kaname

`@kiwa-lab/kaname` classified spec items into three layers (formal-verifiable, runtime-testable, human-review-only) and emitted `specFormal.md` and `specRuntime.md` so that a spec item could not be written without a verification path attached. It shipped in v2.16 and was renamed from `spec-kit` in v2.19.

It sits here because it was never finished — it stopped at 0.1.1 with no caller anywhere in the repository — not because the idea was dropped. The spec-driven axis it implements is still one of the three the MANIFESTO names.

| path | what it holds |
|---|---|
| `kaname/` | the package as it stood at 0.1.1 |
| `kaname-docs/` | its documentation, formerly `docs/libraries/foundation/kaname/` |
| `kaname-skill/` | the `/kaname` Claude Code skill, formerly `.claude/skills/kaname/` |

`docs/concepts/kaname-3-layer-model.md` and `docs/concepts/kaname-skill.md` stay where they are. They describe the model rather than the package, and the model is still current.

To bring it back: move `kaname/` to `packages/kaname`, restore its `-F` and `--filter` entries in the root `package.json` release script, add it to a category in `docs/libraries.json`, and move the docs back under `docs/libraries/foundation/`. The release-smoke cases in `tests/release-smoke/tests/v2-1*.test.ts` already assert against these paths and will need repointing the same way.

## Removed rather than archived

Two packages were deleted outright in the same pass and are recoverable from git history alone.

`@kiwa-lab/visual` wrapped `pixelmatch` in 111 lines exposing `comparePngBuffers` and `expectNoVisualDiff`. Neither was called anywhere, and `@playwright/test` — already a dependency of `@kiwa-lab/e2e` and `@kiwa-lab/dapp` — provides the same pixel comparison through `toHaveScreenshot()`, with baseline management and diff images included.

`@kiwa-lab/solidstart` invoked SolidStart server functions and API routes without a dev server. It had no example and no caller.

Both remain on npm at 2.0.0. Removing them from this repository stops future releases; it does not unpublish what shipped.
