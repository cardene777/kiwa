# @kiwa-test/observability

## 0.1.0

### Minor Changes

- 8afad1c: v5 — @kiwa-test/observability v0.1.0 新設: test 集計 + flaky 検出 + spec coverage gap dashboard

  設計 × 実装 × 観測 ループの観測 → 上流 spec フィードバック経路を SSOT 化する終端 adapter。

  ## 新規 API

  - `collectRunHistory` ... vitest 出力を history に追加、 maxPerTest で FIFO eviction
  - `fromVitestJson` ... vitest JSON reporter 出力を TestRunRecord[] に変換、 fullName から `T-XXX-NNN` ID を抽出
  - `detectFlaky` ... minRuns + threshold で pass/fail mixed test を抽出 (always-pass / always-fail は除外)
  - `analyzeSpecCoverage` ... spec markdown と test code を突き合わせ、 missingTcIds / extraTcIds 抽出
  - `renderDashboard` ... Summary + Flaky tests + Spec coverage gaps の markdown dashboard を出力

  ## skill SSOT

  - `.claude/skills/kiwa-observe/SKILL.md` ... 新設、 vitest 実行 → dashboard 生成 → user 提示までの Layer 3 flow
