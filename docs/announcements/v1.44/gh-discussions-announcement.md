# kiwa v1.44 released — Auth Passwordless UX III deepening + pair 1 depth-3 achievement

## Summary

kiwa v1.44 is out. **Pair 1 (Auth) achieves 3-stage extension** (v1.21 v0.4 4-protocol adapter → v1.22 v0.5 real driver + a11y gate → v1.44 v0.6 advanced Passwordless UX 8 axis). Second pair to reach depth 3 after Search (v1.14→v1.15→v1.36).

## What's new

### `@kiwa-lab/auth` v0.6.0

- **device-bound-passkey** — device binding + sync fabric verification + credential migration + credProps.rk
- **conditional-ui** — WebAuthn L3 conditional mediation + autofill hint + fallback ladder + timeout
- **step-up-mfa** — NIST AAL1 → AAL2 → AAL3 escalation ladder + trust duration cache
- **risk-based-auth** — signal aggregation + adaptive challenge + policy chain
- **auth-continuity** — seamless re-auth + refresh rotation + session extension + revocation window
- **cross-device-flow** — CTAP2 hybrid transport (caBLE) QR + BLE + tunnel + handshake
- **session-hijack-detect** — fingerprint drift + geo anomaly + concurrent + logout cascade
- **auth-telemetry** — attempt log + success rate + latency histogram + abuse detection

3 platform (chromium / webkit / firefox) × 8 axis = 24-cell fidelity grid.

### 3 new dogfood apps

- `examples/dogfood-auth-passwordless-ux-app` — 60 tests. device-bound + conditional-ui + cross-device.
- `examples/dogfood-auth-step-up-mfa-app` — 60 tests. step-up + continuity + hijack.
- `examples/dogfood-auth-risk-based-app` — 60 tests. risk + telemetry + hijack (concurrent + geo variant).

### 3 new tutorials

- **[Tutorial 97 — Passwordless UX](https://cardene777.github.io/kiwa/tutorials/97-passwordless-ux)**
- **[Tutorial 98 — Step-up MFA](https://cardene777.github.io/kiwa/tutorials/98-step-up-mfa)**
- **[Tutorial 99 — Risk-based auth](https://cardene777.github.io/kiwa/tutorials/99-risk-based-auth)**

### 22-milestone consecutive snippet validation streak

v1.23 → v1.44 = 22 milestones with tutorial code snippet validation tests.

### 縦深化 pair grid

12 pairs on record. **Pair 1 (Auth)** now at depth 3.

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

## Install

```bash
pnpm add -D @kiwa-lab/auth@^0.6
```

Additive-only. No breaking changes.

## Migration guide

[v1.43 → v1.44 migration guide](https://cardene777.github.io/kiwa/migrations/v1.43-to-v1.44)

## What's next

v1.44 confirms the 5-milestone new-base cadence + pair-deepening in-between milestones as the kiwa 2-tempo rhythm. Next expected depth-3 milestones = other pair-2 candidates (Realtime III / Streaming III / Database III / Security III / Frontend III).
