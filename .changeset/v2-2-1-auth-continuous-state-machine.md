---
"@kiwa/auth": minor
---

v2.2-1 @kiwa/auth v0.7 = continuous-auth 状態機械 新設 (Auth pair pioneer record 更新)。

v0.6 の Passwordless UX III 8 axis (risk-based-auth + auth-continuity + session-hijack-detect 等) の 上位 layer として、 「session 生存中に risk score を 動的評価 して session lifetime + step-up trigger を 動的調整」 する pure state machine を追加。 3 axis は そのまま 保持、 新規 continuous-auth layer で 統合判定 のみ 追加 = shape 契約 preserving。

追加 API 6 export = `startContinuousAuth` (初期化) + `scoreToLevel` (4 段 category SSOT) + `evaluateRisk` (状態遷移) + `completeStepUp` (step-up 完了) + `freezeSession` (一時凍結) + `terminateContinuousAuth` (revocation)、 5 state SSOT (monitoring / elevated / step-up-required / session-frozen / terminated)、 4 段 risk level (low / medium / high / critical、 boundary は SSOT で inclusive lower)、 elevated 状態 の monitoring interval は 15_000ms、 通常 は 60_000ms で 動的切替。

18 behavior test (T-A-CA-001 〜 T-A-CA-018) で scoreToLevel 4 boundary + startContinuousAuth 2 経路 + evaluateRisk 5 遷移 + completeStepUp 3 経路 + freeze/terminate 例外経路 + 統合 workflow + shape 契約 preserving verify の 全経路 cover。

Auth pair は v0.4 → v0.5 → v0.6 で 3 段深化済み、 v0.7 で 4 段目、 Desktop v1.67 の depth-6 candidate と 独立に 進行する Auth pair pioneer record 更新、 systematic pattern 45 度目適用 (continuous state machine variant)。

shape 契約 preserving 絶対維持 = 既存 semantics 8 axis + adapter + provider 群 全て 触らず、 新規 file `semantics/continuous-auth.ts` + semantics/index.ts 6 export 追加 のみ、 v0.1-v0.6 API 変更 0、 backward compat 絶対維持。
