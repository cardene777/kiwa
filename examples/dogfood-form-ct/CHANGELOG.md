# dogfood-form-ct

## 0.0.1

### Patch Changes

- v1.16-3 (Issue #765) — new dogfood app driving 5 SaaS form patterns through Playwright Component Testing. Mock path uses `@kiwa-test/component` `createPlaywrightCTMock` + `createStoryRegistry` (a11y heuristic checker). Real adapter env-skips on `PW_CT_ENDPOINT` so the CT flow runs headless in local dev. 49 behavior tests + 4-flow perf gate + fidelity report emitted to `quality-report/`. Feeds the 7-axis release gate; provider prefix `@kiwa-test/component/form-ct`.
