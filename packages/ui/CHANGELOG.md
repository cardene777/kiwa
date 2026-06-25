# @kiwa-test/ui

## 0.1.0

### Minor Changes

- 1d58d62: v2 — @kiwa-test/ui v0.1.0 新設: React component test adapter (Vitest + Testing Library + JSDOM)

  kiwa 汎用テストツール化 v2 (UI adapter)。
  React component の Layer 1 spec (kiwa-design markdown 9 column) → Layer 2 test code 経路を `@kiwa-test/ui` adapter で確立する。

  ## 新規 API

  - `setupComponentEnv({ mode })` ... `render` / `interaction` / `snapshot` の 3 経路統合
  - `RenderTestEnvUi` / `InteractionTestEnvUi` / `SnapshotTestEnvUi` ... mode 別の TestEnv 型
  - `@testing-library/react` + `@testing-library/user-event` + `jsdom` を peer dep として lazy import

  ## PoC

  - `examples/react-component-poc/` ... Counter component + Layer 1 spec.md (7 case) + vitest test 7 件 (render / interaction / snapshot 3 経路) 全 PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer ui` 出力 path + ui 専用 9 column 表 (Mode / Component 追加) を SSOT 化
  - `.claude/skills/kiwa-ui/SKILL.md` ... 新設、 9 column → setupComponentEnv 機械変換 + 実装例
