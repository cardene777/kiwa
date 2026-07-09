# @kiwa-lab/auth v0.7 continuous-auth state machine in 15 min

## What you'll build

`@kiwa-lab/auth` v0.7 (Auth pair pioneer record 更新、 v0.6 → v0.7 = 4 段深化) の pure state machine を利用した continuous authentication flow。 「session 生存中 に risk score を 動的評価 して session lifetime + step-up trigger を 動的調整」 する。 48 milestone streak、 systematic pattern 45 度目適用 (continuous state machine variant)。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa-lab/auth` v2.1 (`pnpm add -D @kiwa-lab/auth@^2.1`)

## Step-by-step build

### 1. baseline risk で 監視 開始

```ts
import { semantics } from '@kiwa-lab/auth';

const session = semantics.startContinuousAuth({
  initialRiskScore: 0,
  monitoringIntervalMs: 60_000, // 通常 1 分間隔
  timestamp: new Date().toISOString(),
});
// session.state = 'monitoring'、 currentRiskLevel = 'low'
```

### 2. risk score 上昇 で 状態遷移

```ts
// telemetry signal で risk score を re-evaluate
const escalated = semantics.evaluateRisk({
  session,
  newScore: 0.75, // high level
  timestamp: t1,
});
// escalated.state = 'elevated'、 monitoringIntervalMs = 15_000 (通常 の 1/4)

// critical (0.85+) で step-up-required
const critical = semantics.evaluateRisk({
  session: escalated,
  newScore: 0.95,
  timestamp: t2,
});
// critical.state = 'step-up-required'
```

### 3. step-up MFA 完了 で 降格

```ts
const afterStepUp = semantics.completeStepUp({
  session: critical,
  timestamp: t3,
});
// afterStepUp.state = 'elevated'、 stepUpTriggeredCount = 1

// risk が下がったら monitoring 復帰
const monitoring = semantics.evaluateRisk({
  session: afterStepUp,
  newScore: 0.1,
  timestamp: t4,
});
// monitoring.state = 'monitoring'、 monitoringIntervalMs = 60_000
```

### 4. hijack detect で 完全終了

```ts
// freeze → terminate cascade で 段階的に revocation
const frozen = semantics.freezeSession({
  session,
  reason: 'geo-anomaly',
  timestamp: t5,
});
const terminated = semantics.terminateContinuousAuth({
  session: frozen,
  reason: 'geo-anomaly',
  timestamp: t6,
});
// terminated.state = 'terminated'、 events に freeze + terminate 両方 record
```

## 5 state SSOT

| state | 意味 |
|---|---|
| monitoring | 通常 監視、 60_000ms interval |
| elevated | risk 上昇、 15_000ms interval |
| step-up-required | critical risk、 MFA 要求中 |
| session-frozen | write op block、 read op 継続可 |
| terminated | 完全 revocation |

## 4 段 risk level SSOT

| level | 範囲 | 挙動 |
|---|---|---|
| low | [0, 0.3) | monitoring |
| medium | [0.3, 0.6) | monitoring |
| high | [0.6, 0.85) | elevated |
| critical | [0.85, 1.0] | step-up-required |

## systematic pattern 45 度目適用 の 8 原則

- shape 契約 preserving (既存 API 変更 0)
- additive-only (新規 file 追加のみ)
- backward compat 絶対維持 (opt-in、 v0.6 consumer は 触らず)
- **5 state SSOT** (state 数と遷移経路 の 網羅性)
- **4 段 level SSOT** (score 閾値 の 決定性)
- **interval 動的切替** (elevated 時 の 監視強化)
- **events log 累積** (audit trail 完全性)
- **guard clause** (無効遷移 は throw)

## Auth pair pioneer record 更新

- v0.4 (v1.21) real driver
- v0.5 (v1.22) advanced Passwordless
- v0.6 (v1.44) Passwordless UX III
- **v0.7 (v2.2) = 4 段深化、 continuous state machine**

Desktop v1.67 の depth-6 candidate と 独立進行、 Auth pair pioneer record 更新。

## Reference: dogfood-auth-continuous-app

4 pattern workflow (`startWithBaselineRisk` + `escalateOnRiskSignal` + `completeStepUpAndDeescalate` + `terminateOnHijack`) の実装は `examples/dogfood-auth-continuous-app/` を参照。

## What's next

- v2.3+ = 別 pair の depth-5 拡張 or Auth v0.8 継続深化 (device fingerprint / behavioral biometrics 統合)
