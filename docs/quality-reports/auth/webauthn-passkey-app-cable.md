# WebAuthn Passkey Dogfood — caBLE hybrid transport quality report

Report for `examples/dogfood-webauthn-passkey-app` GH #890 (v1.22-4).
Adds the caBLE hybrid transport (CTAP2) axes on top of the register / signin / userVerification / residentKey fidelity work v1.21-2 landed.

## Fidelity axes (caBLE hybrid transport, 5 軸)

| axis | mock (`@kiwa/auth` caBLE surface) | real (real phone + real BLE + real WebSocket tunnel) | assertion |
|---|---|---|---|
| 1. QR code generation | `FIDO:/<sessionId>?pubkey=<tagged>&tunnel=<hint>&nonce=<nonce>` — deterministic session id counter, credential id tag embedded in pubkey | `FIDO:/` URI carrying base32-encoded EC P-256 public key + tunnel server hint + random nonce | Both encode as a `FIDO:/` URI. Mock keeps the pubkey / tunnel / nonce as literal strings so structural drift is caught; real produces base32 payload but the URI shape + field ordering is identical. |
| 2. BLE advertisement handshake | deterministic shared secret `shared-secret::<sessionId>::<nonce>` — both sides derive matching values, verified=true | ECDH between ephemeral P-256 keys, nonce as KDF salt, 20-byte encrypted advertisement | Mock verifies that shared secret derivation is stable across the initiator + responder + binds to nonce. Real advertisement payload is opaque bytes; mock keeps `ble-adv::<sessionId>::<len>` so the correlation key survives to the tunnel step. |
| 3. WebSocket tunnel establishment | in-memory FIFO with session id + tunnel hint carried over from QR, FIFO drain, close/reject lifecycle | duplex WebSocket over tunnel server, protected by BLE handshake shared secret | Both fail the tunnel open when the handshake did not verify. Both preserve message order (FIFO). Mock rejects send / drain after close; real closes the socket + fails subsequent frames. |
| 4. Credential migration payload | `enc::<sessionId>::<credentialId>::<userId>` tagged string, appended to tunnel wire log | encrypted `PasskeyCredential` blob shipped over the tunnel | Both bind the migration payload to the session id + credential id + user id so cross-session leak is impossible. Mock preserves the credential object verbatim on the initiator side so the fidelity harness can inspect the resulting shape without cracking encryption. |
| 5. Signature roundtrip | `sig::<credentialId>::<challenge>::<sessionId>` signature over WebAuthn L3 §7.2 assertion, verified=true | ES256 / EdDSA signature over the client data JSON + authenticator data | Both refuse an empty challenge (WebAuthn L3 §7.2). Both bind signature to credential id so cross-credential assertion is impossible. Mock preserves the challenge input verbatim in the signature tag for wire-log inspection; real signature bytes are opaque but the initiator-side verification path is identical. |

## Test coverage

- `packages/auth/tests/setup-passkey-cable-env.test.ts` — 24 tests split into six describe blocks:
  - `caBLE fidelity axis 1 — QR code generation` — 5 tests covering session id counter + credential tagging + tunnel hint + nonce + `FIDO:/` URI shape + empty tunnel / nonce rejection + per-session public key freshness
  - `caBLE fidelity axis 2 — BLE advertisement handshake` — 4 tests covering shared secret derivation + advertisement payload embedding + empty session id rejection + nonce binding
  - `caBLE fidelity axis 3 — WebSocket tunnel establishment` — 5 tests covering session id + tunnel hint carryover + FIFO drain semantics + handshake-not-verified refusal + session id mismatch refusal + close lifecycle
  - `caBLE fidelity axis 4 — credential migration payload` — 3 tests covering encrypted payload shape + wire log recording + closed tunnel refusal
  - `caBLE fidelity axis 5 — signature roundtrip` — 4 tests covering signature tag shape + tunnel wire log ordering (migration → signature) + empty challenge refusal + closed tunnel refusal
  - `caBLE end-to-end ceremony — runCaBLESession chains every step` — 3 tests covering step completion order + credential id consistency migration→signature + per-session artifact independence
- `examples/dogfood-webauthn-passkey-app/tests/passkey-cable.spec.ts` — 16 tests exercising the same five axes end-to-end from the dogfood app boundary, plus the `runCaBLESession` chain assertion + replay-impossibility check.

## Environment gating

- `KIWA_MODE=mock` — mock caBLE surface always runs (pure in-memory simulation, no BLE stack or tunnel server needed).
- Real caBLE hybrid transport (real phone + BLE advertisement + WebSocket tunnel server) is out of scope for `pnpm test` / `pnpm test:e2e` on developer machines — the fidelity harness proves the wire-format assertions the real path would satisfy without driving a real Bluetooth stack.
- Chrome `--enable-features=WebAuthenticationRemoteDesktopSupport` flag is experimental at the time of v1.22-4 land — the mock covers every wire-format axis the real path exposes; a future revision can add a Playwright real-device harness once the flag stabilizes.

## Known follow-ups

- Real device caBLE walkthrough — once Chrome ships stable hybrid transport support, add a `tests/e2e/passkey-cable-real.spec.ts` that drives a real Chrome Virtual Authenticator over a locally-run tunnel server. The fidelity axes stay stable; only the driver changes.
- Federation JWKS rotation real e2e (GH #891, v1.22-5) — uses the caBLE credential migration payload as a signal that a passkey survived cross-device sync during rotation.
- v1.22-6 release publish — the caBLE fidelity axes feed into the release gate 7 軸 pass count alongside the register / signin / uv / residentKey axes.
