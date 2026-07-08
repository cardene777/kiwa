# Fidelity — dogfood-visual-regression (v1.16-4)

Real-vs-mock behavioural fidelity for the 10-scene Chromatic-style visual regression dogfood, produced by `examples/dogfood-visual-regression/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `CHROMATIC_PROJECT_TOKEN` and no live `chromatic-cli` install)

When the harness runs without a `CHROMATIC_PROJECT_TOKEN` env var, the real adapter emits `CHROMATIC_REAL_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/component/visual-regression
version    : 0.1.0
verdict    : PASS (7-axis component branch — all axes clear the default gate)
divergences: 3 (seedBaselines / captureAll / review — real mode absent)
axes       : 7 (component branch — no AI-LLM cost / latency / token / accuracy overlay)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (3/3) | 70% | pass |
| perf.p95Ms | ~1.20 ms | 100 ms | pass |
| mutation.killRate | 73.33% (22/30) | 60% | pass |
| testCount.behavior | 44 | 10 | pass |

Fidelity ratio counts mock-covered ops vs the real Chromatic adapter surface (3 total — `seedBaselines` / `captureAll` / `review`). Divergences count all 3 because the real adapter is skipped when `CHROMATIC_PROJECT_TOKEN` is absent — that is by design, wiring the env promotes the report to the real baseline.

## Reproduction

Mock only.

```bash
pnpm --filter dogfood-visual-regression test
cat examples/dogfood-visual-regression/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export CHROMATIC_PROJECT_TOKEN=chpt_xxxxxxxxxxxxxxxx
# optional — pin the branch label so Chromatic groups the runs
export CHROMATIC_BRANCH=feature/v1.16-4
# optional — hand a running Storybook preview URL to the connected driver
export CHROMATIC_STORYBOOK_URL=http://localhost:6006
pnpm --filter dogfood-visual-regression test
```

The v0.1 real adapter emits `CHROMATIC_LIVE_NOT_IMPLEMENTED` when `CHROMATIC_PROJECT_TOKEN` is set — a follow-up milestone will swap in a real `chromatic-cli` driver that uploads a Storybook preview build, captures baseline + diff, and drives accept / reject through the Chromatic web app for every (scene × viewport) pair.

## Ops under measurement

Three provider-neutral ops on `VisualRegressionAdapter`.

- `seedBaselines` — walks the 10-scene registry, renders each with `seedArgs()`, hashes the pseudo-HTML through `@kiwa/component` `hashMarkup`, and seeds a `VisualBaseline` for every declared viewport (10 scenes × 2 viewports = 20 seed pairs per invocation)
- `captureAll` — walks the 10-scene registry, renders each with either `seedArgs()` or `changedArgs()`, captures the current markup, and returns 1 `VisualDiff` per viewport (`status='new'` for the first capture, `status='passed'` for a match, `status='failed'` on hash mismatch). Every diff also carries the `baselineHash` and `currentHash` fields for downstream inspection
- `review` — records an accept or reject entry against a `(sceneId, viewport)` pair; accept swaps the baseline for the currently captured markup so the next matching capture reads passed, reject leaves the baseline intact so the next matching capture still fails

Every op emits at least 1 trace event, so the fidelity harness can diff the mock vs the real Chromatic behaviour without needing a live upload to run.

## 10 scenes (SSOT for SaaS front ends)

The dogfood exercises the 5 UI primitives that show up in every SaaS design system, each in both light + dark themes. The intent-change branch swaps 1 visible bit (button label, cell text, heading rename) so the pseudo-HTML hash diverges and the mock reports `status='failed'`.

| primitive | fields captured in the pseudo-HTML | intent-change diff | test |
|---|---|---|---|
| card | heading + body + primary button + `data-theme` | button label swap | `diff-detect.test.ts` |
| modal | overlay + dialog + header + body + confirm / cancel + `data-theme` | header title rename | `diff-detect.test.ts` |
| table | caption + 3-column verdict table + `data-theme` | first-row verdict swap | `diff-detect.test.ts` |
| toast | live-region container + icon + message + close + `data-theme` | message rewrite | `diff-detect.test.ts` |
| form | sign-in form + email + password + submit + `data-theme` | submit label swap | `diff-detect.test.ts` |

Each primitive renders identically across light + dark themes except for the `data-theme` attribute at the scene root — sufficient for the pseudo-HTML hash to diverge and the mock to score light + dark as distinct baselines.

## Notes

Provider prefix `@kiwa/component/` does not match the AI-LLM branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — 4 AI-LLM axes are appended only when the prefix is `@kiwa/ai-*`). Component test dogfoods stay on the 7-axis common track — Chromatic is a snapshot + diff surface, not a token-priced generative surface, so cost / latency / token / accuracy do not apply. Seed + capture + review round-trip latency still feeds `perf.p95Ms` so visual-regression performance stays visible in the report.
