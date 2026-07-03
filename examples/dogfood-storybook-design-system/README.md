# dogfood-storybook-design-system

Dogfood app (v1.16-2) — a React design-system Storybook 8 harness that registers **12 primitives** (**Button / Input / Card / Modal / Dropdown / Tabs / Toast / Table / Tooltip / Badge / Avatar / Icon**) as `StoryObj` (CSF3) with `args`, `play`, and `parameters`, drivable in both `KIWA_MODE=real` (envelops a real `@storybook/react` preview when `STORYBOOK_URL` is set) and `KIWA_MODE=mock` (`@kiwa-test/component` `createStoryRegistry` + play + a11y). The resulting fidelity report feeds `@kiwa-test/quality-metrics` 7-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-test/component` `createStoryRegistry` + `mount` + `play` + `runA11y`).
- `KIWA_MODE=real` — driven by `makeRealAdapter()`, which detects `STORYBOOK_URL`. Without the env var each method reports `STORYBOOK_REAL_ENV_MISSING`; with the env var each method reports `STORYBOOK_LIVE_NOT_IMPLEMENTED` (a placeholder trace that keeps the divergence shape stable for follow-up work that swaps in the real `@storybook/react` preview channel driver).

Real-mode envs.

- `STORYBOOK_URL` — required to enable real mode (base URL of the running Storybook preview)
- `CHROMATIC_PROJECT_TOKEN` — optional, plumbed through to a follow-up Chromatic capture step

## Layout

```
src/
  components/
    design-system.ts   -- 12 framework-agnostic (args) => MockNode renderers
    stories.ts         -- 12 StoryMeta + StoryObj definitions (CSF3)
  adapters/
    interface.ts       -- provider-neutral contract (registerAll / listStories / resolveArgs / mount / play / runA11y)
    mock.ts            -- kiwa mock adapter (@kiwa-test/component createStoryRegistry)
    real.ts            -- real @storybook/react adapter with env-skip when STORYBOOK_URL is missing
  flows/
    story-flows.ts     -- 4 user-facing flows (register + resolve + play + a11y)
    fidelity.ts        -- trace-diffing harness feeding @kiwa-test/quality-metrics
tests/
  story-registration.test.ts   -- 6 story registration invariants
  args-resolution.test.ts      -- 15 CSF3 meta+story merge assertions
  play-function.test.ts        -- 11 play function trace + interaction tests
  a11y.test.ts                 -- 9 a11y checker tests
  e2e-mock-mode.test.ts        -- 7 end-to-end mock-mode flows
  fidelity-report.test.ts      -- 4 harness contract tests (incl. mock-failure propagation)
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
  perf/
    dogfood-storybook-design-system.perf.ts -- 3-layer perf (serial + concurrent + memory)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-storybook-design-system test
cat examples/dogfood-storybook-design-system/quality-report/fidelity-latest.md
cat examples/dogfood-storybook-design-system/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/component/storybook-design-system.md` when they become canonical for a release.

## The 6-op Storybook surface

The whole point of the design-system dogfood is to exercise the mock's story surface in the exact shape a real Storybook 8 preview channel implements.

1. `registerAll` — bulk register the 12 primitive `StoryMeta` records; the mock stores each entry keyed by kebab-case story id.
2. `listStories` — enumerate every story descriptor; count must equal `countStories()` (the SSOT declared in `components/stories.ts`).
3. `resolveArgs` — merge `meta.args + story.args` per CSF3 semantics and return the resolved snapshot.
4. `mount` — render 1 story to a `MockNode` tree and hash the resulting pseudo-HTML for Chromatic baseline capture.
5. `play` — run the story's play function and record 1 trace step per `step()` call; non-play stories fast-path to `{ steps: [], ok: true }`.
6. `runA11y` — invoke the heuristic checker inside `@kiwa-test/component` (button-name / image-alt / label) + include any injected violations.

Every method emits at least 1 trace event, so the fidelity harness can diff the mock vs the real preview channel without adding shape-level noise.

## Release gate (7 axes)

Because the provider string is `@kiwa-test/component/storybook-design-system`, `evaluateReleaseGate` includes the common 7 axes (coverage 3 / fidelity / perf p95 / mutation / behavior tests). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply — Storybook is a rendering surface, not a token-priced generative surface.

- coverage — line >= 85%, branch >= 80%, function >= 90%
- fidelity — ratio >= 70% (mock covered ops / real total ops, penalised by behavioural divergences)
- perf — p95 <= 100 ms for the mount + play + a11y round-trip
- mutation — kill rate >= 60%
- behavior tests — >= 10 (this dogfood ships 53)

## Play function invariants

Each of the 6 play-story invocations exercises 1 specific interaction so the fidelity harness can compare the mock's `handlersInvoked` counter against the real preview's interaction log.

| story | interaction |
|---|---|
| `Button/Interactive` | fires the click handler on a labelled button |
| `Input/Typing` | mutates `value` and fires the input event |
| `Modal/Closable` | clicks the `aria-label="Close"` button (also asserts `args.title` resolves) |
| `Dropdown/Change` | mutates `select.value` and fires the change event |
| `Tabs/Switch` | clicks the tab role button to activate `usage` |
| `Toast/Dismiss` | clicks the close button whose accessible name is `Dismiss notification` |
| `Form/Submit` | clicks the submit button (extra 7th interaction covers the form submit chain) |

## Related

- v1.16-1 `@kiwa-test/component` v0.1 (`packages/component/`)
- v1.11-1 `@kiwa-test/quality-metrics` (`packages/quality-metrics/`)
- v1.16 milestone parent [#762](https://github.com/cardene777/kiwa/issues/762), this sub [#764](https://github.com/cardene777/kiwa/issues/764)
