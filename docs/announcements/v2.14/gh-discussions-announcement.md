# kiwa v2.14 released — @kiwa-lab/lean v0.1 新規 (Lean 4 spec generator、 kiwa = testing 特化 → testing + 形式検証 の 統合実験場 格上げ signal、 systematic pattern 56 度目、 depth-5 pattern → type-level 定理化 (`dispatch_total`)、 59 milestone streak、 4 PR rhythm 13 milestone 目、 42 package 到達)

Lean 4 spec generator 新規、 depth-5 pattern 5 lifecycle-orchestrator (transaction / session / cache / job / cli) の 5 state + 8 event + 40 セル SSOT を Lean 4 inductive type + total dispatch + totality theorem に変換。 runtime testing (TypeScript + vitest) と 静的形式検証 (Lean 4) を **同 SSOT** で駆動する 2 軸融合仕様駆動開発 pair。

```bash
pnpm add -D @kiwa-lab/lean@^0.1
```

[Migration v2.13 → v2.14](https://cardene777.github.io/kiwa/migrations/v2.13-to-v2.14)
