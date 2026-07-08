1/ 🌱 kiwa v1.10 shipped — 3-axis parallel expansion: SaaS + self-host + polyglot.

After v1.9 filled the provider gap for auth / queue / cache, v1.10 opens 3 new dimensions.

Supabase Auth (core + advanced), RabbitMQ (basic + advanced), Rust contract layer (Foundry-rs + alloy.rs).

6/6 sub-issues resolved.

2/ `@kiwa/auth` v0.3 — Supabase Auth (2 adapters).

Core: PKCE OAuth, magic link, SMS OTP, JWT HS256 + refresh rotation.

Advanced: RLS policy sim (SELECT/INSERT/UPDATE/DELETE + service_role bypass), MFA (TOTP RFC 6238 + backup codes + SMS AAL upgrade), SSO SAML 2.0 (SP-initiated + tampering detect), Web3 SIWE (EIP-4361 + replay protection).

3/ `@kiwa/queue` v0.3 — RabbitMQ (2 adapters).

Basic: 4 exchange type (direct / topic / fanout / headers with wildcards + x-match), consumer + ack/nack, prefetch QoS, mandatory return.

Advanced: DLX + maxDeliveries, delayed message plugin (`x-delayed-message` + deterministic advanceClock), 3-node cluster + quorum queue + assertQuorumHealthy, federation upstream/link, amqp-connection-manager exponential backoff.

4/ `kiwa-test-rs` v0.4.2 — Rust contract layer.

Foundry adapter: FoundryEnv::detect graceful skip, Anvil::spawn_deterministic + Drop cleanup + wait_ready TCP probe, forge test + coverage (summary + lcov), cast call/send/rpc wrappers.

alloy adapter: SolAbi JSON parser, built-in keccak-256 selector, Signer enum (LocalWallet / AwsKms / Ledger / Trezor), Provider enum (Http / Ws / Ipc), ContractCall encoding.

Zero heavy deps — neither module pulls the alloy crate family.

5/ Layer 1 spec + skill chain extended.

`/kiwa-design --layer contract-rust --provider {foundry|alloy}` now emits 9-column extended table for Rust contract tests (target contract / method / call direction / signer / provider / assertion type).

Layer 2 `/kiwa-rust --layer contract-rust --provider ...` reads the spec and generates the Rust test file.

6/ Zero-migration for v1.9 users.

Existing test files keep working. v1.10 additions are all opt-in (feature-gated on Rust, new function calls on TS).

Rust update:

```toml
kiwa-test-rs = { version = "0.4.2", features = ["contract-foundry", "contract-alloy"] }
```

7/ v1.10 milestone: https://github.com/cardene777/kiwa/issues/666

Next up: v1.11 candidates include Storybook integration, Dragonfly (2025 new cache), Reth (Rust Ethereum execution client), Go Iris + Chi (framework depth).

Follow @cardene777 for kiwa release cadence.
