# kiwa v2.2 released — Auth pair pioneer record 更新 (auth v0.7 continuous state machine、 5 state SSOT + 4 段 risk level + interval 動的切替、 48 milestone streak、 systematic pattern 45 度目 continuous state machine variant)

## Summary

kiwa v2.2 is out。 **Auth pair pioneer record 更新** milestone、 v0.6 Passwordless UX III 8 axis の 上位 layer として `continuous-auth` 状態機械 を追加。 「session 生存中 に risk score を 動的評価 して session lifetime + step-up trigger を 動的調整」 する pure state machine。 v2.1 quality-metrics 深化 IV から 継続の **4 PR rhythm 2 milestone 目**、 **systematic pattern 45 度目適用** (continuous state machine variant)、 **48 milestone snippet streak 到達**、 Auth pair v0.4 → v0.5 → v0.6 → v0.7 = 4 段深化。

## What's new

### `@kiwa/auth` v0.6 → v0.7 minor bump

- **6 export** = `startContinuousAuth` + `scoreToLevel` + `evaluateRisk` + `completeStepUp` + `freezeSession` + `terminateContinuousAuth`
- **5 state SSOT** = monitoring / elevated / step-up-required / session-frozen / terminated
- **4 段 risk level SSOT** = low [0, 0.3) / medium [0.3, 0.6) / high [0.6, 0.85) / critical [0.85, 1.0]
- **interval 動的切替** = elevated 15_000ms、 それ以外 60_000ms
- **shape 契約 preserving 絶対維持** = 既存 API (v0.1-v0.6) 変更 0

### dogfood 新規

- `dogfood-auth-continuous-app` = 4 pattern (startWithBaselineRisk + escalateOnRiskSignal + completeStepUpAndDeescalate + terminateOnHijack)、 7 test 全 PASS

### 1 new tutorial + migration + concept

- **[Tutorial 129 — auth v0.7 continuous state machine](https://cardene777.github.io/kiwa/tutorials/129-auth-continuous-state-machine)**
- Migration v2.1 → v2.2 additive
- Concept doc `auth-continuous-state-machine.md`

### 48-milestone consecutive snippet validation streak

v1.23 → v2.2 = **48 milestone**、 kiwa 史上最長記録更新継続。

### Auth pair pioneer record 更新

- v0.4 (v1.21) real driver
- v0.5 (v1.22) advanced Passwordless
- v0.6 (v1.44) Passwordless UX III (8 axis)
- **v0.7 (v2.2) = 4 段深化 continuous state machine**

Desktop v1.67 depth-6 candidate + quality-metrics v2.1 継続深化 と 独立進行、 **3 pair 並列 pioneer record 更新** state。

## Install

```bash
pnpm add -D @kiwa/auth@^2.1
```

## Migration guide

[v2.1 → v2.2](https://cardene777.github.io/kiwa/migrations/v2.1-to-v2.2)

## What's next

- v2.3+ = 別 pair の depth-5 拡張 (4 例目 発生 SOP) or Auth v0.8 継続深化 (device fingerprint / behavioral biometrics)
