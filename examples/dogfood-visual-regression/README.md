# dogfood-visual-regression

Chromatic-style visual regression dogfood for kiwa v1.16-4 (Issue #766).

10 UI scenes — 5 primitives (`card` / `modal` / `table` / `toast` / `form`) × 2 themes (`light` / `dark`) — driven through the `@kiwa-lab/component` `createChromaticVisualMock` API. Each scene is asserted on 4 AC axes — baseline seed / capture / diff-on-intent-change / accept-restores-baseline — with a bonus reject axis proving the review branch. A skipped real adapter (`makeRealAdapter`, env-gated on `CHROMATIC_PROJECT_TOKEN`) mirrors the same 3-op fidelity surface (`seedBaselines` / `captureAll` / `review`, plus a `captureOne` single-scene convenience) so the fidelity harness can produce a 7-axis `@kiwa-lab/quality-metrics` release gate report.

## What runs

```
pnpm --filter dogfood-visual-regression test        # 57 behavior tests + fidelity emit
pnpm --filter dogfood-visual-regression test:perf   # 3-layer perf gate (serial + concurrent + memory)
```

Both commands are pure Node (no browser process needed) — the mock adapter uses the in-memory `MockNode` → SHA-256 hex hash pipeline from `@kiwa-lab/component`, and the real adapter records `CHROMATIC_REAL_ENV_MISSING` for every op when the env var is unset.

## Layout

```
src/
  scenes/
    types.ts         # SceneArgs / SceneSpec / Theme / SceneRegistration
    primitives.ts    # 5 renderers — renderCard / renderModal / renderTable / renderToast / renderForm
    index.ts         # SCENE_REGISTRATIONS + SCENE_SPECS + SCENE_IDS + SCENE_COUNT SSOT
  adapters/
    interface.ts     # VisualRegressionAdapter (4 ops) + trace / metric shapes
    mock.ts          # makeMockAdapter via @kiwa-lab/component createChromaticVisualMock + StoryRegistry
    real.ts          # makeRealAdapter with CHROMATIC_PROJECT_TOKEN env-skip
  flows/
    visual-flows.ts  # seedAllBaselines / captureAllScenesNeutral / captureAllScenesChanged / acceptAllPendingChanges / rejectAllPendingChanges + runAllScenes
    fidelity.ts      # runAdapterMatrix + runFidelityHarness (7-axis release gate)
tests/
  visual/
    scenes.test.ts               # 10 tests — scene registry contract
    seed.test.ts                 # 8 tests — baseline seed axis
    capture.test.ts              # 9 tests — capture axis (multi-viewport)
    diff-detect.test.ts          # 7 tests — diff detect axis (intent change → FAIL)
    review-workflow.test.ts      # 10 tests — accept / reject branches
  e2e-mock-mode.test.ts          # 7 tests — full round-trip trace coherence
  fidelity-report.test.ts        # 5 tests — fidelity harness contract
  emit-fidelity-report.test.ts   # 1 test — writes quality-report/{json,md}
  perf/
    dogfood-visual-regression.perf.ts  # 3-layer perf (seed / neutral / changed / accept)
```

## AC map (Issue #766)

- [x] 10 scene baseline seed 完了 — `seedAllBaselines` returns 10 outcomes (`SCENE_COUNT × VIEWPORTS_PER_SCENE = 20 seed pairs`, seed axis test suite)
- [x] diff 検知 (意図的変更で FAIL、 accept で PASS) — `captureAllScenesChanged` reports 20 failed diffs after seed, and `acceptAllPendingChanges` swaps the baseline so a repeat changed capture reads passed (see `T-DFVR-REV-001`)
- [x] release gate 11 軸 pass — the component branch of `evaluateReleaseGate` evaluates the common 7 axes (coverage 3 / fidelity / perf p95 / mutation / behavior test count); the AI-LLM 4 axes (cost / latency / token / accuracy) do not apply to a snapshot + diff surface. See `quality-report/fidelity-latest.md`
- [x] `docs/quality-reports/component/visual-regression.md` — hand-promoted snapshot of the fidelity report

## 10 scenes and the intent-change branches

| primitive | light hash bit that changes | dark hash bit that changes | test |
|---|---|---|---|
| card | button label — `Learn more` → `Read the docs` | same, in `card-dark` variant | `diff-detect.test.ts` |
| modal | title — `Publish milestone` → `Publish milestone v1.16` | same, in `modal-dark` variant | `diff-detect.test.ts` |
| table | first-row verdict cell — `pass` → `warn` | same, in `table-dark` variant | `diff-detect.test.ts` |
| toast | message — `Report emitted.` → `Report emitted and promoted.` | same, in `toast-dark` variant | `diff-detect.test.ts` |
| form | submit button label — `Sign in` → `Continue` | same, in `form-dark` variant | `diff-detect.test.ts` |

Every scene registers with `parameters.chromatic.viewports = ['mobile', 'desktop']` and `diffThreshold = 0` (hash-exact matching). Ten scenes × 2 viewports = 20 diff samples per full capture.

## Real-mode wiring (opt-in for follow-up milestone)

Set `CHROMATIC_PROJECT_TOKEN` to promote the report to real Chromatic. The v0.1 real adapter currently records `CHROMATIC_LIVE_NOT_IMPLEMENTED` for every op — the next milestone will swap in a `chromatic-cli` driver that uploads the Storybook preview build and captures baseline / diff / review through the Chromatic web app, keeping the mock + real code paths interchangeable.

Real-mode envs.

- `CHROMATIC_PROJECT_TOKEN` — required to enable real mode (project token from chromatic.com)
- `CHROMATIC_STORYBOOK_URL` — optional Storybook preview URL for the connected driver
- `CHROMATIC_BRANCH` — optional branch label passed to `chromatic-cli`

## Related

- v1.16-1 `@kiwa-lab/component` v0.1 (`packages/component/`) — `createChromaticVisualMock` + `hashMarkup`
- v1.16-2 `dogfood-storybook-design-system` (`examples/dogfood-storybook-design-system/`) — Storybook 8 story registration + 12 primitives
- v1.16-3 `dogfood-form-ct` (`examples/dogfood-form-ct/`) — Playwright CT form patterns
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762), this sub [#766](https://github.com/cardene777/kiwa/issues/766)
