# Fidelity — dogfood-storybook-design-system (v1.16-2)

Real-vs-mock behavioural fidelity for the React design-system Storybook 8 dogfood, produced by `examples/dogfood-storybook-design-system/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `STORYBOOK_URL` and no live `@storybook/react` install)

When the harness runs without a `STORYBOOK_URL` env var, the real adapter emits `STORYBOOK_REAL_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/component/storybook-design-system
version    : 0.1.0
verdict    : PASS (7-axis component branch — all axes clear the default gate)
divergences: 6 (registerAll / listStories / resolveArgs / mount / play / runA11y — real mode absent)
axes       : 7 (component branch — no AI-LLM cost / latency / token / accuracy overlay)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (6/6) | 70% | pass |
| perf.p95Ms | ~0.09 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 53 | 10 | pass |

Fidelity ratio counts mock-covered ops vs the real Storybook 8 surface (6 total — `registerAll` / `listStories` / `resolveArgs` / `mount` / `play` / `runA11y`). Divergences count all 6 because the real adapter is skipped when `STORYBOOK_URL` is absent — that is by design, wiring the env promotes the report to the real baseline.

## Reproduction

Mock only.

```bash
pnpm --filter dogfood-storybook-design-system test
cat examples/dogfood-storybook-design-system/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export STORYBOOK_URL=http://localhost:6006
# optional — plumb through to a follow-up Chromatic capture step
export CHROMATIC_PROJECT_TOKEN=chpt_...
pnpm --filter dogfood-storybook-design-system test
```

The v0.1 real adapter emits `STORYBOOK_LIVE_NOT_IMPLEMENTED` when `STORYBOOK_URL` is set — a follow-up milestone will swap in an `@storybook/react` preview channel driver that exercises the real story loader + play channel + a11y addon.

## Ops under measurement

Six provider-neutral ops on `StorybookAdapter`.

- `registerAll` — bulk registers 12 primitive `StoryMeta` records (+ Form) into the registry, keyed by kebab-case story id (Storybook 8 SB URL param compatible)
- `listStories` — enumerates every story descriptor; the count is the SSOT for the "12 primitives + Form" registration invariant
- `resolveArgs` — merges `meta.args + story.args` per CSF3 semantics and returns a resolved snapshot; the merge is preserved across `parameters.chromatic` and `parameters.a11y`
- `mount` — renders 1 story to a `MockNode` tree and hashes the resulting pseudo-HTML (SHA-256 → 16-char hex) for Chromatic baseline capture
- `play` — runs the story's play function, records 1 trace step per `step()` call, and increments a `handlersInvoked` counter as a proxy for the real preview's interaction log
- `runA11y` — invokes the heuristic checker inside `@kiwa/component` (button-name / image-alt / label rules) + any injected violations from `parameters.a11y`

## 12 primitives (design-system SSOT)

The dogfood exercises the 12 SaaS frontend primitives that show up in every commercial design system that ships to Chromatic / Storybook. Each has 2-3 stories to cover default state + at least one variant, and 7 of them (Button / Input / Modal / Dropdown / Tabs / Toast / Form) carry a play function so the interaction round-trip is measured.

| primitive | stories | play story |
|---|---|---|
| Button | Primary / Secondary / Interactive | Interactive (click) |
| Input | Empty / Prefilled / Typing | Typing (input) |
| Card | Default / Elevated | — |
| Modal | Open / Closed / Closable | Closable (close click + args.title check) |
| Dropdown | Default / Change | Change (select value change) |
| Tabs | OverviewActive / UsageActive / Switch | Switch (tab activation) |
| Toast | Success / Error / Dismiss | Dismiss (close click) |
| Table | Populated / Empty | — |
| Tooltip | Hidden / Visible | — |
| Badge | Info / Warning / WithCount | — |
| Avatar | Initials / WithImage / Online | — |
| Icon | Meaningful / Decorative | — |

Form (composed of Input + Button) contributes 1 additional play story (Submit) as a 7th interaction. It lives outside the 12-primitive scope but shares the same registry + fidelity path.

## Notes

Provider prefix `@kiwa/component/` does not match the AI-LLM branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — 4 AI-LLM axes are appended only when the prefix is `@kiwa/ai-*`). Component test dogfoods stay on the 7-axis common track — Storybook is a rendering surface, not a token-priced generative surface, so cost / latency / token / accuracy do not apply. Mount + play + a11y round-trip latency still feeds `perf.p95Ms` so component render performance stays visible in the report.
