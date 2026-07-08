---
title: "@kiwa/auth v0.7 continuous-auth 状態機械 SSOT"
---

# @kiwa/auth v0.7 continuous-auth 状態機械 SSOT

## What this covers

`@kiwa/auth` v0.7 の continuous-auth 状態機械 SSOT。 v0.6 で 8 axis Passwordless UX III (risk-based-auth + auth-continuity + session-hijack-detect 等) を land、 v0.7 で 3 axis を 継続合成 する 上位 layer として continuous-auth を追加。 Auth pair v0.4 → v0.5 → v0.6 → v0.7 = 4 段深化、 Desktop v1.67 depth-6 candidate と 独立進行 の Auth pair pioneer record 更新、 systematic pattern 45 度目適用 (continuous state machine variant)。

## 5 state SSOT

```
              startContinuousAuth
                       ↓
                 [monitoring] ←─────────────┐
                       │                    │
             evaluateRisk (high)            │
                       ↓                    │
                  [elevated] ←── evaluateRisk (low/medium)
                       │                    │
             evaluateRisk (critical)         │
                       ↓                    │
              [step-up-required]            │
                       │                    │
                completeStepUp              │
                       └────────────────────┘
                       (elevated 経由)

              freezeSession (from any) → [session-frozen]
              terminateContinuousAuth (from any) → [terminated]
```

## 4 段 risk level SSOT

| level | 範囲 (inclusive lower) | 挙動 |
|---|---|---|
| low | [0, 0.3) | monitoring |
| medium | [0.3, 0.6) | monitoring |
| high | [0.6, 0.85) | elevated (interval 15_000ms) |
| critical | [0.85, 1.0] | step-up-required |

## API 6 export SSOT

```ts
export function startContinuousAuth(input: {
  initialRiskScore?: number;      // default 0
  monitoringIntervalMs?: number;  // default 60_000
  timestamp: string;
}): ContinuousAuthSession;

export function scoreToLevel(score: number): RiskLevel;

export function evaluateRisk(input: {
  session: ContinuousAuthSession;
  newScore: number;
  timestamp: string;
}): ContinuousAuthSession;

export function completeStepUp(input: {
  session: ContinuousAuthSession;
  timestamp: string;
}): ContinuousAuthSession;  // throw if state !== 'step-up-required'

export function freezeSession(input: {
  session: ContinuousAuthSession;
  reason: string;
  timestamp: string;
}): ContinuousAuthSession;

export function terminateContinuousAuth(input: {
  session: ContinuousAuthSession;
  reason: string;
  timestamp: string;
}): ContinuousAuthSession;
```

## Session envelope shape SSOT

```ts
export interface ContinuousAuthSession {
  state: ContinuousAuthState;
  currentRiskLevel: RiskLevel;
  currentRiskScore: number;
  monitoringIntervalMs: number;      // elevated=15_000、 それ以外=60_000
  stepUpTriggeredCount: number;      // session 生存中 step-up 発火回数
  lastEvaluatedAt: string;           // ISO 8601
  events: string[];                  // 状態遷移 audit log
}
```

## interval 動的切替 SSOT

- elevated 状態 = 15_000ms (通常 の 1/4)
- monitoring / step-up-required = 60_000ms 復元
- 遷移時 に 常に 決定的 に 切替、 前 session の interval は 持ち越さない

## events log 累積 SSOT

全 遷移 で events 配列 に append、 audit trail として immutable log を提供:

- `continuous-auth-started`
- `risk-evaluated:{level}:{score.toFixed(2)}`
- `step-up-completed`
- `session-frozen:{reason}`
- `terminated:{reason}`

## guard clause SSOT

- `completeStepUp` は state !== 'step-up-required' で throw
- freeze / terminate は 任意 state から可 (revocation の 万能経路)
- evaluateRisk は 全 state で可 (状態遷移 の main driver)

## Backward compat 絶対維持

- 既存 API (v0.1-v0.6 全て) 変更 0
- shape 契約 preserving = adapter + provider 群 + 8 semantics axis + session/types 全て 触らず
- 新規 file `semantics/continuous-auth.ts` 追加 のみ

## Auth pair pioneer record 更新 SSOT

- **v0.4 (v1.21)** = real driver adapter
- **v0.5 (v1.22)** = advanced Passwordless (WebAuthn L3 + Passkey caBLE)
- **v0.6 (v1.44)** = Passwordless UX III (8 axis: device-bound-passkey + conditional-ui + step-up-mfa + risk-based-auth + auth-continuity + cross-device-flow + session-hijack-detect + auth-telemetry)
- **v0.7 (v2.2) = 4 段深化 continuous state machine** ← 本 doc

Desktop v1.67 の depth-6 candidate と 独立進行 (Desktop pioneer は invoke-cache、 Auth pioneer は continuous-auth)、 quality-metrics v2.1 継続深化 と 並列 に 進む。 v2.3+ で depth-5 pattern 「pattern 化 candidate」 昇格予定。

## systematic pattern 45 度目適用 の 8 原則

- shape 契約 preserving (既存 API 変更 0)
- additive-only (新規 file 追加のみ)
- backward compat 絶対維持 (opt-in、 v0.6 consumer は 触らず)
- **5 state SSOT** (state 数と遷移経路 の 網羅性)
- **4 段 level SSOT** (score 閾値 の 決定性)
- **interval 動的切替** (elevated 時 の 監視強化)
- **events log 累積** (audit trail 完全性)
- **guard clause** (無効遷移 は throw)

5 原則 (v2.1 systematic pattern 44 度目) に 3 原則 (5 state + 4 段 level + interval 動的切替) 追加 = 8 原則統合、 「continuous state machine variant」 として v2.3+ の 別 pair depth-5 拡張 で 再利用可能。

## Reference

- 実装 = `packages/auth/src/semantics/continuous-auth.ts`
- test = `packages/auth/tests/semantics/continuous-auth.test.ts` § T-A-CA-001-018 (18 test)
- dogfood = `examples/dogfood-auth-continuous-app/` (4 pattern workflow、 7 test)
- tutorial = `docs/tutorials/129-auth-continuous-state-machine.md`
- migration = `docs/migrations/v2.1-to-v2.2.md`
