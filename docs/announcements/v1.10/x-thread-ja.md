1/ 🌱 kiwa v1.10 リリース — SaaS + self-host + polyglot の 3 軸並行拡張。

v1.9 で auth / queue / cache の provider gap を埋めた後、 v1.10 は 3 つの新次元を開拓。

Supabase Auth (core + advanced)、 RabbitMQ (basic + advanced)、 Rust contract layer (Foundry-rs + alloy.rs)。

6/6 sub-issues 全 resolved。

2/ `@kiwa-lab/auth` v0.3 — Supabase Auth (2 adapter)。

Core: PKCE OAuth、 magic link、 SMS OTP、 JWT HS256 + refresh rotation。

Advanced: RLS policy シミュレーション (SELECT/INSERT/UPDATE/DELETE + service_role bypass)、 MFA (TOTP RFC 6238 + backup codes + SMS AAL upgrade)、 SSO SAML 2.0 (SP-initiated + tampering 検知)、 Web3 SIWE (EIP-4361 + replay 保護)。

3/ `@kiwa-lab/queue` v0.3 — RabbitMQ (2 adapter)。

Basic: 4 exchange type (direct / topic / fanout / headers、 wildcards + x-match)、 consumer + ack/nack、 prefetch QoS、 mandatory return。

Advanced: DLX + maxDeliveries、 delayed message plugin (`x-delayed-message` + deterministic advanceClock)、 3-node cluster + quorum queue + assertQuorumHealthy、 federation upstream/link、 amqp-connection-manager exponential backoff。

4/ `kiwa-test-rs` v0.4.2 — Rust contract layer。

Foundry adapter: `FoundryEnv::detect` graceful skip、 `Anvil::spawn_deterministic` + Drop cleanup + wait_ready TCP probe、 `forge test` + coverage (summary + lcov)、 `cast call/send/rpc` wrapper。

alloy adapter: `SolAbi` JSON parser、 built-in keccak-256 selector、 Signer enum (LocalWallet / AwsKms / Ledger / Trezor)、 Provider enum (Http / Ws / Ipc)、 `ContractCall` encoding。

heavy dep 追加なし — alloy crate family も pull しない。

5/ Layer 1 spec + skill chain 拡張。

`/kiwa-design --layer contract-rust --provider {foundry|alloy}` で Rust contract test 用 9 column 拡張表を生成 (対象 contract / method / 呼出方向 / signer / provider / assertion 型)。

Layer 2 `/kiwa-rust --layer contract-rust --provider ...` が spec を read して Rust test file 生成。

6/ v1.9 user は zero-migration。

既存 test file はそのまま動く。 v1.10 追加は全て opt-in (Rust は feature gate、 TS は新関数呼出)。

Rust update:

```toml
kiwa-test-rs = { version = "0.4.2", features = ["contract-foundry", "contract-alloy"] }
```

7/ v1.10 milestone: https://github.com/cardene777/kiwa/issues/666

次 v1.11 候補は Storybook integration、 Dragonfly (2025 新興 cache)、 Reth (Rust Ethereum 実行 client)、 Go Iris + Chi (framework 縦深化) 等。

kiwa の release cadence 追いたい人は @cardene777 まで。
