# Fidelity — dogfood-form-ct (v1.16-3)

Real-vs-mock behavioural fidelity for the 5 form Playwright Component Testing dogfood, produced by `examples/dogfood-form-ct/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `PW_CT_ENDPOINT` and no live `@playwright/experimental-ct-react` install)

When the harness runs without a `PW_CT_ENDPOINT` env var, the real adapter emits `PW_CT_REAL_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/component/form-ct
version    : 0.1.0
verdict    : PASS (7-axis component branch — all axes clear the default gate)
divergences: 4 (mount / interactValidation / interactSubmit / checkA11y — real mode absent)
axes       : 7 (component branch — no AI-LLM cost / latency / token / accuracy overlay)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (4/4) | 70% | pass |
| perf.p95Ms | ~0.60 ms | 100 ms | pass |
| mutation.killRate | 73.33% (22/30) | 60% | pass |
| testCount.behavior | 50 | 10 | pass |

Fidelity ratio counts mock-covered ops vs the real Playwright CT surface (4 total — `mount` / `interactValidation` / `interactSubmit` / `checkA11y`). Divergences count all 4 because the real adapter is skipped when `PW_CT_ENDPOINT` is absent — that is by design, wiring the env promotes the report to the real baseline.

## Reproduction

Mock only.

```bash
pnpm --filter dogfood-form-ct test
cat examples/dogfood-form-ct/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export PW_CT_ENDPOINT=http://localhost:3100
# optional — force a specific browser channel through the CT runner
export PW_CT_BROWSER=chromium
pnpm --filter dogfood-form-ct test
```

The v0.1 real adapter emits `PW_CT_LIVE_NOT_IMPLEMENTED` when `PW_CT_ENDPOINT` is set — a follow-up milestone will swap in an `@playwright/experimental-ct-react` preview channel driver that exercises real browser mount + interact + a11y (axe-core) on every form kind.

## Ops under measurement

Four provider-neutral ops on `FormCTAdapter`.

- `mount` — renders 1 form kind into an in-memory MockNode canvas via `@kiwa-test/component` `createPlaywrightCTMock().mount(...)` and returns a summary (formId + kind + fieldCount + submitButtonLabel + hasFormElement)
- `interactValidation` — mounts the form, clicks the submit button with the validation-args fixture, captures the reported `FormValidationError` + the `role=alert` region's text, asserts `onSubmit` did not fire
- `interactSubmit` — mounts the form with the happy-path fixture, clicks submit, captures the `FormSubmitPayload`, asserts `onValidationError` did not fire
- `checkA11y` — mounts the form through `@kiwa-test/component` `createStoryRegistry` and runs the heuristic checker (button-name / image-alt / label rules) — every form is expected to pass

## 5 form patterns (SSOT for SaaS front ends)

The dogfood exercises the 5 form primitives that show up in every commercial SaaS onboarding / checkout / account flow. Each has 1 required field + at least 1 optional path, and every form is asserted on 4 axes — mount / validation / submit / a11y = 0.

| kind | fields | required | validation branch | submit payload keys |
|---|---|---|---|---|
| login | email + password + rememberMe | email + password | missing password | email / password / rememberMe |
| signup | email + password + passwordConfirm + acceptedTerms | all 4 + password === confirm | password mismatch | email / password / passwordConfirm / acceptedTerms |
| checkout | fullName + address + city + postalCode + cardNumber | all 5 + card matches `\d{12,19}` | malformed cardNumber | fullName / address / city / postalCode / cardNumber |
| profile | displayName + bio + websiteUrl | displayName + URL well-formed when present | malformed URL | displayName / bio / websiteUrl |
| search | query + filterCategory | query | empty query | query / filterCategory |

## Notes

Provider prefix `@kiwa-test/component/` does not match the AI-LLM branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts` — 4 AI-LLM axes are appended only when the prefix is `@kiwa-test/ai-*`). Component test dogfoods stay on the 7-axis common track — Playwright CT is a rendering + interaction surface, not a token-priced generative surface, so cost / latency / token / accuracy do not apply. Mount + interact + a11y round-trip latency still feeds `perf.p95Ms` so form CT performance stays visible in the report.
