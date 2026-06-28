---
"@kiwa-test/core": patch
"@kiwa-test/dapp": patch
"@kiwa-test/api": patch
"@kiwa-test/ui": patch
"@kiwa-test/data": patch
"@kiwa-test/e2e": patch
"@kiwa-test/a11y": patch
"@kiwa-test/cli-test": patch
"@kiwa-test/observability": patch
"@kiwa-test/visual": patch
"@kiwa-test/cli": patch
---

📦 11 packages initial v1.0.x npm publish (改名後初回)。

PR #476 で `@kiwa-test/core` ↔ `@kiwa-test/spec` swap rename + dApp 改名 + v1.0 major bump を local で実施したが、 npm への publish が未実行のため npm 上では旧 0.x 系のまま停滞していた。

本 changeset で全 11 packages を v1.0.1 へ patch bump して publish を発火させ、 改名後の v1.0 系を npm に反映する。

## 影響範囲

- 旧 `@kiwa-test/core` (0.3.1) は dApp E2E fixture の名残、 v1.0.1 では新 spec として publish
- 旧 `@kiwa-test/spec` は廃止 (`@kiwa-test/core` に統合)
- 新 `@kiwa-test/dapp` (404 → v1.0.1 として初公開)
- 既存 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) は v1.0.1 patch bump で公開
- v1.0.0 → v1.0.1 patch bump (PR #476 の v1.0.0 内部 bump を上書きせず継続)

## 確認方法

```bash
npm view @kiwa-test/core version    # → 1.0.1
npm view @kiwa-test/dapp version    # → 1.0.1 (新規公開)
npm view @kiwa-test/e2e version     # → 1.0.1
npm view @kiwa-test/a11y version    # → 1.0.1
npm view @kiwa-test/visual version  # → 1.0.1
```
