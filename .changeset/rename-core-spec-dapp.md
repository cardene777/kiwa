---
"@kiwa-test/core": major
"@kiwa-test/dapp": major
"@kiwa-test/api": major
"@kiwa-test/ui": major
"@kiwa-test/data": major
"@kiwa-test/e2e": major
"@kiwa-test/a11y": major
"@kiwa-test/cli-test": major
"@kiwa-test/observability": major
"@kiwa-test/visual": major
"@kiwa-test/cli": major
---

📛 Rename `@kiwa-test/core` → `@kiwa-test/dapp`、 `@kiwa-test/spec` → `@kiwa-test/core` (v1.0 swap rename)。

## Breaking change

- 旧 `@kiwa-test/core` (dApp E2E fixture / Playwright + viem + anvil) は `@kiwa-test/dapp` に rename
- 旧 `@kiwa-test/spec` (全 adapter の共通基盤 / parseSpec / createPool / TestEnvBase) は `@kiwa-test/core` に rename
- 命名と中身を一致させ、 「真の core」 (10 package 横断の共通基盤) を `@kiwa-test/core` の位置に置く

## Migration

```ts
// 旧
import { dappE2eTest } from "@kiwa-test/core";
import { parseSpec, createPool } from "@kiwa-test/spec";

// 新
import { dappE2eTest } from "@kiwa-test/dapp";
import { parseSpec, createPool } from "@kiwa-test/core";
```

旧 `@kiwa-test/core` (0.3.1 まで) と旧 `@kiwa-test/spec` (0.1.1 まで) は npm 上で deprecate、 v1.0 では新名で publish される。

依存する 9 adapter (api / ui / data / e2e / a11y / cli-test / observability / visual / cli) も import path 変更による major bump。
