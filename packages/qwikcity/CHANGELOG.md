# @kiwa/qwikcity

## 1.0.2

### Patch Changes

- re-publish 3 packages with version 1.0.2 — previous 1.0.1 publish + unpublish の履歴により同 version 再 publish 不可、 1.0.2 へ bump して registry に再登録。

  実装変更なし、 package.json version + CHANGELOG.md だけの patch bump。 npm registry に v1.0.2 として appear し、 v1.2 milestone (Issue #518/#519/#522) の publish 完了状態化する。

## 1.0.1

### Patch Changes

- 5c276bc: 🎉 New package `@kiwa/qwikcity` v1.0 — Qwik City routeAction\$ + routeLoader\$ + Endpoints test adapter (Issue #519、 v1.2 milestone 3/10).

  ## What's in the box

  - `invokeRouteAction({ action, formValues, cookies, headers, url })` — invoke a `routeAction$` callback with parsed form values + simulated RequestEvent (cookie / url / fail / redirect helpers).
  - `invokeRouteLoader({ loader, url, params, cookies, headers, platform })` — invoke a `routeLoader$` callback with a simulated RequestEvent + platform passthrough.
  - `invokeEndpoint({ handler, url, method, params, headers, formData, jsonBody })` — invoke an Endpoint (`onGet` / `onPost` / etc) with simulated `json` / `text` / `redirect` / `setHeader` / `status` helpers, capture the resolved EndpointResponse shape.
  - 3 brand symbols: `QWIK_FAIL_SYMBOL` / `QWIK_REDIRECT_SYMBOL` / `QWIK_ENDPOINT_REDIRECT_SYMBOL`.

  ## Coverage

  29 unit tests passing (action 9 + loader 8 + endpoint 12)、 coverage `lines / branches / functions / statements` 全 100%.

  ## Companion

  - New skill `/kiwa-qwikcity` — Layer 2 generator with 9 column extension tables for all 3 modes (action / loader / endpoint).
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `qwikcity-action` / `qwikcity-loader` / `qwikcity-endpoint` 追加。
  - `release.yml` + scripts/check-coverage-gates.mjs + check-mutation-gates.mjs + `tests/release-smoke/` 4 file + `package.json` release / mutation script を **18 packages 化**。
  - packages/qwikcity/{stryker.config.mjs,vitest.stryker.config.mjs} 配置で mutation gate 統合。
  - README Limitations 表で Qwik City ❌ → ✅ production-ready (v1.0.0+)。

  ## v1.2 milestone closeout for framework adapters

  This is the **final framework adapter** of v1.2 — `@kiwa/solidstart` (#518) + `@kiwa/qwikcity` (#519) で v1.2 framework 拡大が完了 (全ての主要 server-side framework に対応)、 残 v1.2 は Bun / Deno / Edge runtime / ORM / examples / hooks.server / sub-features の infrastructure 系。
