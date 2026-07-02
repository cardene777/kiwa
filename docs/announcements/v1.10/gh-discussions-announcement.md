# 🌱 kiwa v1.10 — SaaS + self-host + polyglot 拡張 (Supabase Auth + RabbitMQ + Rust contract layer land、 6 sub 全 resolved)

The v1.10 milestone (**6/6 GitHub Issues resolved**) just landed. After v1.9 filled the provider gap for auth / queue / cache (Clerk / Auth0 / Cloudflare Queues / SQS / Memcached / KeyDB)、 v1.10 shifts from **symmetric provider expansion** to **3-axis parallel expansion**: SaaS teams get Supabase Auth (core + advanced with RLS / MFA / SSO SAML / Web3 SIWE)、 self-host teams get RabbitMQ (basic + advanced with DLX / delayed message / cluster / federation / auto-reconnect)、 dApp Rust teams get the first-class contract layer via Foundry-rs + alloy.rs integration in `kiwa-test-rs`.

## 1. `@kiwa-test/auth` v0.3 — Supabase Auth (core + advanced)

Supabase Auth (GoTrue) is now a first-class kiwa provider with two layered adapters. The core adapter covers the daily SaaS flow (email/password + OAuth PKCE + magic link + SMS OTP + JWT session)、 the advanced adapter targets prod enterprise + dApp needs.

```ts
import {
  setupSupabaseAuthEnv,
  setupSupabaseAdvancedEnv,
} from "@kiwa-test/auth";

// Core adapter (v1.10-1) — email/password + OAuth + magic link + JWT.
const supa = await setupSupabaseAuthEnv({
  users: [{ email: "alice@example.test", password: "secret", emailConfirmed: true }],
});
const { session } = await supa.auth.signInWithPassword({
  email: "alice@example.test",
  password: "secret",
});
const claims = await supa.verifyToken(session.accessToken);

// Advanced adapter (v1.10-2) — RLS + MFA + SSO SAML + Web3 SIWE.
const adv = await setupSupabaseAdvancedEnv({
  users: [{ email: "svc@corp.test", role: "service_role" }],
  policies: [{
    name: "documents_owner_select",
    table: "documents",
    command: "select",
    roles: ["authenticated"],
    using: (row, ctx) => row.ownerId === ctx.userId,
  }],
});
const outcome = await adv.rls.checkRlsAccess({
  table: "documents",
  command: "select",
  accessToken: session.accessToken,
  row: { id: "1", ownerId: "user-1" },
});
// MFA (TOTP RFC 6238 + 10 backup codes + SMS phone factor)
const { factor } = await adv.mfa.enrollTotp({ userId: "user-1" });
// SSO SAML (SP-initiated flow + XML assertion mock)
const idp = adv.saml.registerIdp({ ... });
// Web3 SIWE (EIP-4361 + address bind + replay protection)
const chal = await adv.web3.createSiweChallenge({ address, domain, uri });
```

- **Core adapter** — PKCE OAuth (Google / GitHub / Apple / Azure / Facebook / Twitter)、 magic link + SMS OTP、 JWT (HS256) + refresh token rotation、 admin API mirror
- **Advanced adapter** — RLS policy simulator (SELECT / INSERT / UPDATE / DELETE + service_role bypass)、 MFA (TOTP + SMS + backup codes + AAL upgrade)、 SSO SAML 2.0 (IdP-initiated + SP-initiated + tampering detection)、 Web3 wallet auth (EIP-4361 SIWE + nonce replay protection)

## 2. `@kiwa-test/queue` v0.3 — RabbitMQ (basic + advanced)

RabbitMQ joins the queue provider family with two layered adapters. Both run in stub mode (docker-free AMQP 0.9.1 model emulator) and testcontainers mode (probe against a real `rabbitmq:3-management` broker).

```ts
import { setupRabbitMQEnv, setupRabbitMQAdvancedEnv } from "@kiwa-test/queue";

// Basic adapter (v1.10-3) — 4 exchange type + consumer + ack/nack/prefetch.
const rmq = await setupRabbitMQEnv({
  exchanges: [{ name: "orders", type: "topic" }],
  queues: [{ name: "orders.us" }],
  bindings: [{ exchange: "orders", queue: "orders.us", routingKey: "us.*" }],
});
await rmq.publish({ exchange: "orders", routingKey: "us.web", body: { id: 1 } });
await rmq.consume({
  queue: "orders.us",
  handler: (msg) => msg.ack(),
});

// Advanced adapter (v1.10-4) — DLX + delayed + cluster + federation + reconnect.
const adv = await setupRabbitMQAdvancedEnv({
  exchanges: [{ name: "dlx.work", type: "direct" }],
  delayedExchanges: [{ name: "sms.delayed", type: "x-delayed-message", delayedType: "direct" }],
  queues: [
    { name: "work.main", deadLetterExchange: "dlx.work", kind: "quorum" },
    { name: "work.triage" },
  ],
  cluster: {
    nodes: [
      { id: "rabbit@node-1", role: "primary", active: true },
      { id: "rabbit@node-2", role: "replica", active: true },
      { id: "rabbit@node-3", role: "replica", active: true },
    ],
  },
});
// Scheduled delivery — advance clock deterministic.
await adv.delayed.publishDelayed({
  exchange: "sms.delayed",
  routingKey: "sms.reminder",
  body: { phone: "+15551234", text: "Reminder!" },
  delayMs: 60_000,
});
await adv.delayed.advanceClock(60_000);
// Quorum queue survives single-node failure.
await adv.cluster.stopNode("rabbit@node-2");
adv.cluster.assertQuorumHealthy("work.main", { minReplicas: 2 });
```

- **Basic adapter** — 4 exchange type (direct / topic / fanout / headers) with wildcards + x-match、 consumer + ack / nack / requeue、 prefetch (QoS)、 exclusive + persistent + mandatory return
- **Advanced adapter** — DLX with `deadLetterExchange` + `maxDeliveries`、 delayed message plugin (`x-delayed-message` + `advanceClock`)、 3-node cluster with quorum queues + `assertQuorumHealthy`、 federation (upstream + link + `ingestFromUpstream`)、 amqp-connection-manager style exponential-backoff reconnect

## 3. `kiwa-test-rs` v0.4.2 — Rust contract layer (Foundry-rs + alloy.rs)

The Rust polyglot layer now includes a **contract module** with two feature-gated adapters — driving Foundry (`forge` / `cast` / `anvil`) from Rust via subprocess plumbing、 and parsing Foundry-emitted ABI JSON into a shape ready for the `sol!` macro.

```rust
use kiwa::contract::foundry::{Anvil, FoundryEnv};
use kiwa::contract::alloy::{ContractCall, Provider, Signer, SolAbi};

// Foundry integration (v1.10-5) — feature "contract-foundry".
let env = FoundryEnv::detect();
if !env.all_available() {
    eprintln!("foundry cli missing, skipping");
    return Ok(());
}
let anvil = Anvil::spawn_deterministic(8545)?;
anvil.wait_ready(std::time::Duration::from_secs(3))?;
let test_out = env.forge_test(std::path::Path::new("."))?;
assert!(test_out.success);
let coverage = env.forge_coverage(std::path::Path::new("."))?;
kiwa::contract::foundry::emit_lcov_to(&coverage, std::path::Path::new("lcov.info"))?;

// alloy.rs helper (v1.10-6) — feature "contract-alloy".
let abi = SolAbi::parse_foundry_out("ERC20", &std::fs::read_to_string("out/ERC20.json")?)?;
let selector = abi.selector_of("transfer").unwrap(); // "0xa9059cbb"
let signer = Signer::LocalWallet {
    chain_id: 31337,
    seed_descriptor: "anvil-account-0".to_string(),
};
let provider = Provider::anvil_http(8545);
let call = ContractCall::with_encoded_args(
    "0xcafe",
    &selector,
    /* pre-encoded ABI args hex */,
);
```

- **Foundry adapter** — `FoundryEnv::detect()` graceful skip、 `Anvil::spawn_deterministic()` with `Drop`-based cleanup + `wait_ready` TCP accept probe、 `forge test` + `forge coverage` (summary + lcov)、 `cast call` / `send` / `rpc` wrappers (signing credential redacted from command string)
- **alloy adapter** — pure-Rust `SolAbi` JSON parser for Foundry `out/*.json`、 built-in keccak-256 for 4-byte function selectors、 Signer enum (`LocalWallet` / `AwsKms` / `Ledger` / `Trezor`)、 Provider enum (`Http` / `Ws` / `Ipc`)、 `ContractCall` encoding ready for `cast rpc eth_call` or alloy `SolCall::abi_encode`
- **Zero heavy deps** — neither module pulls the alloy crate family (30+ MiB transitive tree) nor requires Foundry CLI at compile time. Users opt into the alloy crates themselves when they need `sol!` code-gen; kiwa provides the ABI reading + selector + signer / provider shape as inputs.

## 4. `contract-rust` Layer 1 spec + skill chain 拡張

The `/kiwa-design --layer contract-rust --provider {foundry|alloy}` flag is now available. The 9-column extended table covers 6 dimensions: target contract (Solidity file)、 target method、 call direction (call / send)、 signer path、 provider transport、 assertion type. Layer 2 skills read from `tests/spec/contract/test-spec-{module}.contract-rust.md`.

## Migration

Existing v1.9 test files require no changes. v1.10 additions are all opt-in (feature-gated on the Rust side、 new function calls on the TS side). Rust users update:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.4.2", features = ["contract-foundry", "contract-alloy"] }
```

Full changelog + AC verification per sub-Issue: [#666](https://github.com/cardene777/kiwa/issues/666) (parent) → [#667](https://github.com/cardene777/kiwa/issues/667) [#668](https://github.com/cardene777/kiwa/issues/668) [#669](https://github.com/cardene777/kiwa/issues/669) [#670](https://github.com/cardene777/kiwa/issues/670) [#671](https://github.com/cardene777/kiwa/issues/671) [#672](https://github.com/cardene777/kiwa/issues/672).

Happy testing! 🌱
