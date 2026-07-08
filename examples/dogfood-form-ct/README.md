# dogfood-form-ct

Playwright Component Testing dogfood for kiwa v1.16-3 (Issue #765).

5 SaaS form patterns — login / signup / checkout / profile / search — driven through the `@kiwa/component` `createPlaywrightCTMock` API. Each form is asserted on 4 axes — mount / validation error / submit success / a11y violation count = 0. A skipped real adapter (`makeRealAdapter`, env-gated on `PW_CT_ENDPOINT`) mirrors the same 4-op surface so the fidelity harness can produce a 7-axis `@kiwa/quality-metrics` release gate report.

## What runs

```
pnpm --filter dogfood-form-ct test        # 54 behavior tests + fidelity emit
pnpm --filter dogfood-form-ct test:perf   # 3-layer perf gate (serial + concurrent + memory)
```

Both commands are pure Node (no browser process needed) — the mock adapter uses an in-memory MockNode canvas, and the real adapter records `PW_CT_REAL_ENV_MISSING` for every op when the env var is unset.

## Layout

```
src/
  forms/
    types.ts       # form arg shapes + FormRender<K> generic
    builders.ts    # buildField / buildCheckbox / buildSelect / buildTextArea / buildSubmitButton / buildErrorRegion
    login.ts       # buildLoginForm (email + password + rememberMe)
    signup.ts      # buildSignupForm (email + password + confirm + terms)
    checkout.ts    # buildCheckoutForm (fullName + address + city + postal + card)
    profile.ts     # buildProfileForm (displayName + bio + websiteUrl)
    search.ts      # buildSearchForm (query + filterCategory)
    index.ts       # FORM_KINDS + FORM_SPECS (mountArgs / validationArgs / submitArgs)
  adapters/
    interface.ts   # FormCTAdapter (4 ops) + trace / metric shapes
    mock.ts        # makeMockAdapter via @kiwa/component createPlaywrightCTMock
    real.ts        # makeRealAdapter with PW_CT_ENDPOINT env-skip
  flows/
    form-flows.ts  # mountAllForms / validateAllForms / submitAllForms / a11yAllForms
    fidelity.ts    # runAdapterMatrix + runFidelityHarness (7-axis release gate)
tests/
  mount.test.ts               # 8 tests — mount axis
  validation.test.ts          # 11 tests — validation-error axis
  submit.test.ts              # 11 tests — submit-success axis
  a11y.test.ts                # 9 tests — a11y-violation axis
  interact.test.ts            # 5 tests — input handler wiring (fireEvent)
  e2e-mock-mode.test.ts       # 5 tests — full 4-flow trace coherence
  fidelity-report.test.ts     # 4 tests — fidelity harness contract
  emit-fidelity-report.test.ts # 1 test — writes quality-report/{json,md}
  perf/
    dogfood-form-ct.perf.ts   # 3-layer perf (mount / validation / submit / a11y)
```

## AC map (Issue #765)

- [x] 5 form × 4 assertion (mount / validation / submit / a11y) drivable end-to-end via `runAllForms(adapter)`
- [x] release gate 7 軸 pass (component prefix — no AI-LLM overlay), see `quality-report/fidelity-latest.md`
- [x] real vs mock fidelity 実測 — mock 4 ops covered, real skipped with `PW_CT_REAL_ENV_MISSING` per op
- [x] `docs/quality-reports/component/form-ct.md` written

## 5 forms and the validation branches

| kind | fields | required | validation-args triggers | submit-args accepted |
|---|---|---|---|---|
| login | email + password + rememberMe | email + password | email present, password missing → missingFieldIds=['password'] | email=`user@example.com`, password=`hunter2!`, rememberMe=true |
| signup | email + password + passwordConfirm + acceptedTerms | all 4 + password === confirm | passwordConfirm mismatch → missingFieldIds=['passwordConfirm'] | all 4 populated + password === confirm |
| checkout | fullName + address + city + postalCode + cardNumber | all 5 + `\d{12,19}` on card | non-numeric card → missingFieldIds=['cardNumber'] | 4242 4242 4242 4242 |
| profile | displayName + bio + websiteUrl | displayName + URL well-formed when present | malformed URL → missingFieldIds=['websiteUrl'] | displayName + optional bio + `https://ada.example.com` |
| search | query + filterCategory | query | empty query → missingFieldIds=['query'] | query + filterCategory=`books` |

## Real-mode wiring (opt-in for follow-up milestone)

Set `PW_CT_ENDPOINT` to promote the report to real Playwright CT. The v0.1 real adapter currently records `PW_CT_LIVE_NOT_IMPLEMENTED` for every op — the next milestone will swap in a real `@playwright/experimental-ct-react` driver that mounts the same `render(args)` fixtures through the preview iframe channel, keeping the mock + real code paths interchangeable.
