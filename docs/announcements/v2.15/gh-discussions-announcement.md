# kiwa v2.15 released — @kiwa-lab/lean v0.2 verifyLeanSpec + Lean toolchain 統合 (Level 1 spec 生成 → Level 2 spec verify、 systematic pattern 57 度目、 60 milestone streak、 kiwa 全体 pipeline testing + spec 生成 + spec 検証 の 3 段完成)

Lean toolchain 統合、 生成 Lean file を `lean --check` で検証。 3 経路 (`ok` / `verification-failed` / `lean-not-installed` / `skipped-by-env`) で 決定的 CI 動作。 depth-5 pattern の 5 lifecycle-orchestrator を Lean spec + verify pipeline で 型 + 定理レベルで 保証可能に。

```bash
pnpm add -D @kiwa-lab/lean@^0.2
```

[Migration v2.14 → v2.15](https://cardene777.github.io/kiwa/migrations/v2.14-to-v2.15)
