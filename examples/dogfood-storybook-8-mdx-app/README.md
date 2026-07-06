# dogfood-storybook-8-mdx-app (v1.34-4)

A Storybook 8 harness that binds 12 primitives + 3 layouts + 5 interaction-focus stories to MDX docs (component preview + prose + code sample), drives the `@storybook/test` interaction runner (click / type / assert), and emits a story-coverage report over a provider-neutral `StorybookMdxAdapter`. Both mock (`@kiwa-test/component` v0.3 `createStoryRegistry` + in-process MdxRegistry + InteractionRunner + CoverageReporter) and real (Storybook 8 preview via `STORYBOOK_URL` + `STORYBOOK_MDX_READY=1` + `STORYBOOK_TEST_READY=1`) implementations satisfy the same 8-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-storybook-8-mdx-app test
```

The vitest suite drives the mock adapter through the same story registration + args resolution + mount + MDX render + interaction + a11y + coverage flows a live Storybook runtime would exercise. The emitted `quality-report/fidelity-latest.json` + `quality-report/fidelity-latest.md` feed the release process.

## Real mode (opt-in)

```bash
export STORYBOOK_URL=http://localhost:6006
export STORYBOOK_MDX_READY=1
export STORYBOOK_TEST_READY=1
pnpm --filter dogfood-storybook-8-mdx-app test
```

The real adapter defers the live preview wiring to a follow-up milestone. Until all three env vars are set, every real op refuses with `STORYBOOK_MDX_REAL_ENV_MISSING`. The fidelity harness records those refusals as behavioural divergences — this is the expected v1.34-4 baseline.

## Adapter contract

`StorybookMdxAdapter` covers 8 ops across 4 axes.

- **story surface (v1.16 shape)**
  - `registerAll` — bulk-register 16 metas + 16 MDX docs
  - `listStories` — enumerate every registered descriptor
  - `resolveArgs` — CSF3 args merge (meta.args + story.args)
  - `mount` — mount 1 story + capture markup + hash
- **MDX surface (v1.34-4 new)**
  - `renderMdx` — render 1 MDX doc into an ordered block list (prose / preview / code)
- **interaction surface (v1.34-4 new)**
  - `runInteraction` — drive `@storybook/test` (click / type / assert) for 1 story + count baked-in assertions
- **quality surface**
  - `runA11y` — heuristic + injected a11y violations
  - `computeCoverage` — story-level MDX + interaction + a11y coverage report

## Fidelity harness

The mock path exercises all 8 ops for every registered story; the real path skips every op with `STORYBOOK_MDX_REAL_ENV_MISSING` unless the env gates are set. Divergences accumulate as `MOCK_MISSING_OP` (when the real trace records an op the mock never did) or `BEHAVIORAL_DIVERGENCE` (mock ok=true vs real ok=false).

The release gate the harness feeds is `@kiwa-test/quality-metrics` 7-axis (component provider, no AI-LLM axes) — coverage / test-count / fidelity / perf.p95 / mutation.

## Stories

- 12 primitives — Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon
- 1 form — DesignSystem/Form (part of the design-system meta group)
- 3 layouts — Layout/PageContainer / Layout/SectionRow / Layout/SidebarShell
- 5 interaction-focus stories — Button/Interactive / Input/Typing / Modal/Closable / Form/Submit / Tabs/Switch

## Test count

- behavior — 45+ (story registration / args resolution / MDX / interaction / a11y / coverage / e2e-mock)
- fidelity — 5 (harness contract)
- emit — 1 (fidelity-latest report snapshot)
- total — 51+

## Reference

- Issue [#1051](https://github.com/cardene777/kiwa/issues/1051) / Linear CAR-787
- Base — [dogfood-storybook-design-system](../dogfood-storybook-design-system) (v1.16-2)
