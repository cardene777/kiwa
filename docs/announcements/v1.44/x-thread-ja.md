# kiwa v1.44 x-thread (日本語)

## Tweet 1 — hook

kiwa v1.44 リリース — Auth Passwordless UX III 深化 が land.

@kiwa-lab/auth v0.5.0 → v0.6.0 minor bump. 3 platform (chromium + webkit + firefox) 上に advanced Passwordless UX production semantics 8 axis を追加 (24 fidelity grid / 8 axis × 3 platform).

縦深化 pair pattern 第 1 pair (Auth) **3 段拡張達成** (v1.21 v0.4 → v1.22 v0.5 → v1.44 v0.6)、 pair 第 8 Search v1.14→v1.15→v1.36 に続く 2 例目 pair 深度 3 段記録。

## Tweet 2 — 8 axis Passwordless UX advanced III semantics

Device-bound-passkey (device bind + sync fabric verification + credential migration + credProps.rk) / Conditional-ui (autofill hint + mediation "conditional" + fallback ladder + timeout) / Step-up-mfa (NIST SP 800-63B AAL escalation ladder + factor satisfaction + trust duration cache) / Risk-based-auth (signal aggregation + adaptive challenge + policy chain) / Auth-continuity (seamless re-auth + refresh rotation + session extension + revocation window) / Cross-device-flow (CTAP2 hybrid transport caBLE + QR + BLE + tunnel + assertion) / Session-hijack-detect (fingerprint drift + geo anomaly + concurrent session + logout cascade) / Auth-telemetry (attempt log + success rate + latency histogram + abuse detection).

## Tweet 3 — pair 第 1 pair 3 段拡張達成 (2 例目 record)

Auth v1.21 v0.4 (4 protocol adapter) → v1.22 v0.5 (real driver + a11y gate) → **v1.44 v0.6 advanced Passwordless UX 8 axis** の 3 段構造。 5-milestone new-base cadence (v1.43 Edge / Serverless base 導入) 直後の pair 深化継続 milestone、 4 段拡張 record 3 例安定化 (v1.40 AI/LLM / v1.41 Payment / v1.42 Observability) + 5-milestone new-base cadence の 2 段組み rhythm 定着を実証。

## Tweet 4 — snippet streak + npm publish

**22 milestone 連続 snippet validation streak** (v1.23-v1.44) 達成。

`pnpm add -D @kiwa-lab/auth` で v0.6.0 が入る。 breaking change なし。 migration guide は https://cardene777.github.io/kiwa/migrations/v1.43-to-v1.44

sub-milestone 6 完遂 (v1.44-1 auth v0.6 + 8 axis + 526 test / v1.44-2 dogfood-passwordless-ux + 60 test / v1.44-3 dogfood-step-up-mfa + 60 test / v1.44-4 dogfood-risk-based + 60 test / v1.44-5 docs + 538 test = 22 milestone snippet streak / v1.44-6 publish).

#kiwa #auth #webauthn #passkey #passwordless #testing #vitest
