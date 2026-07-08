# kiwa v1.44 リリース — Auth Passwordless UX III 深化 milestone + 縦深化 pair 第 1 pair 3 段拡張達成

## 概要

kiwa v1.44 をリリースしました。 **縦深化 pair 第 1 pair (Auth) 3 段拡張達成** — v1.21 v0.4 (4 protocol adapter) → v1.22 v0.5 (real driver + a11y gate) → v1.44 v0.6 (advanced Passwordless UX 8 axis) の 3 段構造。 pair 第 8 Search v1.14→v1.15→v1.36 に続く 2 例目 pair 深度 3 段記録。

## 何が変わったか

### `@kiwa/auth` v0.6.0 (v0.5.0 → v0.6.0 minor bump)

8 個の advanced Passwordless UX axis を追加しました。

- **device-bound-passkey** — device bind + credential migration + sync fabric (iCloud Keychain / Chrome Sync / Firefox Sync) + credProps.rk 確認
- **conditional-ui** — WebAuthn L3 `mediation: "conditional"` + autofill hint + fallback ladder + timeout
- **step-up-mfa** — NIST SP 800-63B AAL1 → AAL2 → AAL3 escalation ladder + factor 満足 + trust duration cache
- **risk-based-auth** — signal aggregation (device / IP / geo / velocity / behavioral) + adaptive challenge + policy chain
- **auth-continuity** — seamless re-auth + refresh token rotation + session extension + revocation window
- **cross-device-flow** — CTAP2 hybrid transport (caBLE) QR handshake + BLE proximity + tunnel + assertion signature
- **session-hijack-detect** — fingerprint drift + geo anomaly + concurrent session + logout cascade
- **auth-telemetry** — attempt log + success rate + latency histogram + abuse detection

3 platform (chromium / webkit / firefox) × 8 axis = 24 cell の fidelity grid。

### 3 dogfood app を新規追加

- `examples/dogfood-auth-passwordless-ux-app` — 60 tests。 device-bound + conditional-ui + cross-device の 3 axis。
- `examples/dogfood-auth-step-up-mfa-app` — 60 tests。 step-up + continuity + hijack の 3 axis。
- `examples/dogfood-auth-risk-based-app` — 60 tests。 risk + telemetry + hijack (concurrent + geo variant) の 3 axis。

### 3 tutorial を新規追加

- **[Tutorial 97 — Passwordless UX](https://cardene777.github.io/kiwa/tutorials/97-passwordless-ux)**
- **[Tutorial 98 — Step-up MFA](https://cardene777.github.io/kiwa/tutorials/98-step-up-mfa)**
- **[Tutorial 99 — Risk-based auth](https://cardene777.github.io/kiwa/tutorials/99-risk-based-auth)**

## 22 milestone 連続 snippet validation streak 達成

v1.23 → v1.44 で 22 milestone 連続で tutorial code snippet の validation test を kiwa monorepo 内に配置しています。

## 縦深化 pair pattern grid

12 pair が記録されています。 **Pair 1 (Auth) が深度 3 に到達**。

| Pair | Domain | Path | Depth |
|---|---|---|---|
| **1** | **Auth** | **v1.21→v1.22→v1.44** | **3** |
| 2 | Realtime | v1.13→v1.28 | 2 |
| 3 | Streaming | v1.20→v1.31 | 2 |
| 4 | Database | v1.14→v1.32 | 2 |
| 5 | Payment | v1.14→v1.19→v1.33→v1.41 | 4 |
| 6 | Frontend | v1.16→v1.34 | 2 |
| 7 | Observability | v1.14→v1.17→v1.35→v1.42 | 4 |
| 8 | Search | v1.14→v1.15→v1.36 | 3 |
| 9 | Security | v1.37→v1.39 | 2 |
| 10 | AI/LLM | v1.12→v1.15→v1.38→v1.40 | 4 |
| 11 | Security base | v1.37 | 1 |
| 12 | Edge / Serverless | v1.43 | 1 |

## インストール

```bash
pnpm add -D @kiwa/auth@^0.6
```

Additive-only。 breaking change はありません。

## Migration guide

[v1.43 → v1.44 migration guide](https://cardene777.github.io/kiwa/migrations/v1.43-to-v1.44)

## 次に何が来るか

v1.44 で 5-milestone new-base cadence + 中間 milestone での既存 pair 深化 の 2 段組み rhythm が確立完成。 次回 III 深化 target = 他の pair-2 候補 (Realtime III / Streaming III / Database III / Security III / Frontend III)。 次回 new base = v1.48 前後。
