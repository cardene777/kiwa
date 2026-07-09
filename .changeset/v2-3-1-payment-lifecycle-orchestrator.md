---
"@kiwa-lab/payment": minor
---

v2.3-1 @kiwa-lab/payment v2.1 = lifecycle-orchestrator 新設 (depth-5 pattern 4 例目 発生 candidate)。

v1.33 Payment 深化 II で v0.4 到達 (9 axis advanced billing II semantics)、 v2.3 で lifecycle-orchestrator 追加 = subscription lifecycle + dunning + retry + revenue-recovery + chargeback の 継続合成 layer。 auth v0.7 continuous-auth pattern の Payment 版、 systematic pattern 45 度目 continuous state machine variant を Payment pair に転用。

追加 API 3 export = `startLifecycle` (初期化) + `handleEvent` (event driven 遷移) + `summarizeLifecycle` (統計サマリー)、 5 state SSOT (active-billing / grace-period / dunning-active / chargeback-dispute / canceled) + 8 event SSOT (payment-succeeded / payment-failed / dunning-succeeded / dunning-exhausted / chargeback-filed / chargeback-won / chargeback-lost / user-canceled)、 40 セル 遷移 表 を 1 switch で 実装、 無効 event は soft-reject + invalid log 記録 (throw ではなく、 payment 経路 で 過剰 event 受信 が normal のため)。

18 behavior test (T-P-LO-001 〜 T-P-LO-018) で 5 state × 8 event の 全 遷移 経路 + summary 統計 + shape 契約 preserving verify cover。

Payment pair v0.1-v0.4 + v2.1 で 5 段深化到達 = **depth-5 pattern 4 例目 発生** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 + Payment v2.1 = 4 例目確定、 「絶対的 rule」 昇格 signal 到達済 pattern の 4 例目実証、 pattern の 「rule」 化 が より 確実な dominant pattern に 昇格)。

shape 契約 preserving 絶対維持 = 既存 27 semantics + adapter + provider 群 全て 触らず、 新規 file `semantics/lifecycle-orchestrator.ts` + semantics/index.ts export block 追加のみ、 v0.1-v0.4 API 変更 0、 backward compat 絶対維持。
