---
title: "kiwa v1.10 リリース — SaaS + self-host + polyglot の 3 軸並行拡張 (Supabase Auth + RabbitMQ + Rust contract layer)"
emoji: "🌱"
type: "tech"
topics: ["oss", "testing", "supabase", "rabbitmq", "rust"]
published: false
---

## TL;DR

kiwa v1.10 milestone (**6/6 GitHub Issues resolved**) を land した。 v1.9 が auth / queue / cache の provider gap 埋め (Clerk / Auth0 / Cloudflare Queues / SQS / Memcached / KeyDB の 6 provider 追加) だったのに対し、 v1.10 は **3 軸並行拡張** に思想シフト。 SaaS teams (Supabase Auth の core + advanced)、 self-host teams (RabbitMQ の basic + advanced)、 dApp Rust teams (Foundry-rs + alloy.rs の Rust contract layer) を同時 land。

- 親 Issue: [#666](https://github.com/cardene777/kiwa/issues/666)
- 6 sub-Issue: [#667](https://github.com/cardene777/kiwa/issues/667) - [#672](https://github.com/cardene777/kiwa/issues/672)

## 1. Supabase Auth core + advanced (v1.10-1 + v1.10-2)

Supabase Auth (GoTrue) の provider を追加。 core と advanced の 2 adapter に分離し、 core は日常 SaaS flow、 advanced は enterprise + dApp 需要をカバーする。

### Core adapter (v1.10-1)

email/password + OAuth PKCE + magic link + SMS OTP + JWT session (HS256) を testcontainers Supabase Local 経路で mock。

```ts
import { setupSupabaseAuthEnv } from "@kiwa-test/auth";

const env = await setupSupabaseAuthEnv({
  projectUrl: "https://poc.supabase.co",
  users: [
    { email: "alice@example.test", password: "secret", emailConfirmed: true },
  ],
});

const { session } = await env.auth.signInWithPassword({
  email: "alice@example.test",
  password: "secret",
});
const claims = await env.verifyToken(session.accessToken);
```

- **email/password + OAuth PKCE** (Google / GitHub / Apple / Azure / Facebook / Twitter)
- **magic link + SMS OTP** — verifyOtp で consume、 `listOtpDeliveries` で inbox mock
- **JWT session** — HS256、 per-env signing secret、 cross-env token 拒否
- **refresh token rotation** — old token invalidation

### Advanced adapter (v1.10-2)

RLS policy シミュレーション + MFA + SSO SAML + Web3 SIWE。

```ts
import { setupSupabaseAdvancedEnv, type RlsPolicy } from "@kiwa-test/auth";

const ownerPolicy: RlsPolicy = {
  name: "documents_owner_select",
  table: "documents",
  command: "select",
  roles: ["authenticated"],
  using: (row, ctx) => row.ownerId === ctx.userId,
};

const env = await setupSupabaseAdvancedEnv({
  users: [{ email: "alice@example.test", role: "authenticated" }],
  policies: [ownerPolicy],
});

// RLS
const outcome = await env.rls.checkRlsAccess({
  table: "documents",
  command: "select",
  accessToken: aliceLogin.accessToken,
  row: { id: "d1", ownerId: aliceLogin.userId, body: "hello" },
});
// outcome.allowed === true (owner match)

// MFA TOTP + AAL upgrade
const { factor } = await env.mfa.enrollTotp({ userId: alice.id });
const challenge = await env.mfa.challenge({ factorId: factor.id });
const code = generateSupabaseTotpCode(factor.secret);
const result = await env.mfa.verifyChallenge({ challengeId: challenge.id, code });
// result.aal === "aal2"

// SSO SAML SP-initiated flow
const idp = env.saml.registerIdp({ ... });
const authnReq = await env.saml.initiateSsoLogin({ email: "employee@acme.test" });
const assertion = env.saml.mintAssertion({ ... });
const { accessToken } = await env.saml.exchangeAssertion({ assertion });

// Web3 SIWE (EIP-4361)
const chal = await env.web3.createSiweChallenge({ address, domain, uri });
const sig = env.web3.signSiweMessage({ message: chal.message, privateKey });
const session = await env.web3.verifySiweMessage({
  challengeId: chal.id,
  signature: sig,
  privateKey,
});
```

- **RLS** — PostgreSQL RLS の subset (USING + WITH CHECK + service_role bypass)、 policy 定義 / drop / list API
- **MFA** — TOTP RFC 6238 (SHA-1 HMAC + 30s step + 6-digit)、 SMS phone factor、 10-code backup codes、 aal1 → aal2 upgrade
- **SSO SAML 2.0** — SP-initiated flow、 IdP metadata + attribute map、 mint / verify assertion (HMAC で XML-DSig stand-in)、 tampering 検知
- **Web3 wallet auth** — EIP-4361 canonical serialization + address bind + nonce replay 保護 + mock address derive

## 2. RabbitMQ basic + advanced (v1.10-3 + v1.10-4)

RabbitMQ が queue provider family に加入。 basic は AMQP 0.9.1 model、 advanced は prod 級 pattern (DLX + delayed + cluster + federation + auto-reconnect)。

### Basic adapter (v1.10-3)

stub (in-process) + testcontainers 両 mode。

```ts
import { setupRabbitMQEnv } from "@kiwa-test/queue";

const env = await setupRabbitMQEnv({
  exchanges: [
    { name: "orders", type: "topic" },
  ],
  queues: [{ name: "orders.us" }],
  bindings: [
    { exchange: "orders", queue: "orders.us", routingKey: "us.*" },
  ],
});

await env.publish({ exchange: "orders", routingKey: "us.web", body: { id: 1 } });
await env.consume({
  queue: "orders.us",
  handler: (msg) => msg.ack(),
  options: { prefetch: 10 },
});
```

- **4 exchange type** — direct / topic / fanout / headers、 topic wildcards `*` / `#`、 headers x-match=all/any
- **consumer semantic** — ack / nack / requeue / prefetch (QoS) / exclusive / persistent
- **mandatory return** — unroutable publish の `listReturned()` 集約
- **per-message TTL** — `expirationMs` で dead 遷移
- **testcontainers mode** — `rabbitmq:3-management` の management API aliveness probe

### Advanced adapter (v1.10-4)

```ts
import { setupRabbitMQAdvancedEnv } from "@kiwa-test/queue";

const env = await setupRabbitMQAdvancedEnv({
  exchanges: [{ name: "dlx.work", type: "direct" }],
  delayedExchanges: [
    { name: "sms.delayed", type: "x-delayed-message", delayedType: "direct" },
  ],
  queues: [
    {
      name: "work.main",
      deadLetterExchange: "dlx.work",
      deadLetterRoutingKey: "work.failed",
      kind: "quorum",
    },
    { name: "work.triage" },
  ],
  cluster: {
    nodes: [
      { id: "rabbit@node-1", role: "primary", active: true },
      { id: "rabbit@node-2", role: "replica", active: true },
      { id: "rabbit@node-3", role: "replica", active: true },
    ],
  },
  federation: {
    upstreams: [{ name: "upstream-eu", uri: "amqp://eu-broker:5672" }],
    links: [{ upstreamName: "upstream-eu", downstreamExchange: "dlx.work" }],
  },
});

// DLX — nack requeue=false で DLX route
await env.consume({
  queue: "work.main",
  handler: (msg) => msg.nack({ requeue: false }),
});
const dl = await env.dlx.assertDeadLettered("work.main", { reason: "rejected" });

// Delayed — deterministic な advanceClock
await env.delayed.publishDelayed({
  exchange: "sms.delayed",
  routingKey: "sms.reminder",
  body: { phone: "+15551234", text: "Reminder!" },
  delayMs: 60_000,
});
await env.delayed.advanceClock(60_000);

// Quorum queue が single-node failure に耐える
await env.cluster.stopNode("rabbit@node-2");
env.cluster.assertQuorumHealthy("work.main", { minReplicas: 2 });

// Federation — upstream broker から downstream にレプリケート
await env.federation.ingestFromUpstream({
  upstreamName: "upstream-eu",
  exchange: "dlx.work",
  routingKey: "work.failed",
  body: "from-eu",
});

// Auto-reconnect — exponential backoff
const result = await env.autoReconnect.simulateReconnect({ failAttempts: 3 });
// { succeeded: true, attempts: 4, totalDelayMs: 700 }
```

- **DLX** — queue-level `deadLetterExchange` + `deadLetterRoutingKey` + `maxDeliveries`、 nack / delivery-limit 超過で route
- **Delayed message plugin** — `x-delayed-message` exchange + `publishDelayed({ delayMs })` + `advanceClock(ms)` で deterministic
- **Cluster mode** — 3-node primary/replica、 stopNode/startNode、 resolveQueueNode deterministic、 assertQuorumHealthy
- **Federation** — upstream + link 登録、 ingestFromUpstream で downstream 到達検証
- **Auto-reconnect** — amqp-connection-manager 系の exponential backoff (initialDelay × factor cap maxDelay、 maxAttempts 保証)

## 3. Rust contract layer — Foundry-rs + alloy.rs (v1.10-5 + v1.10-6)

`kiwa-test-rs` に `contract` module を追加。 Foundry CLI 経路 (feature `contract-foundry`) + alloy.rs 経路 (feature `contract-alloy`) の 2 adapter を feature gate で opt-in。 **heavy dep 追加なし** — alloy crate family (30+ MiB transitive tree) は user が opt-in、 kiwa 側は pure Rust の abstraction 層のみ。

### Foundry adapter (v1.10-5)

```rust
use kiwa::contract::foundry::{Anvil, FoundryEnv, emit_lcov_to};

// PATH probe — foundry 未 install でも panic せず graceful skip
let env = FoundryEnv::detect();
if !env.all_available() {
    return;  // skip when foundry cli is missing
}

// Deterministic anvil spawn + Drop cleanup
let anvil = Anvil::spawn_deterministic(8545)?;
anvil.wait_ready(std::time::Duration::from_secs(3))?;

// forge test + summary parser
let test_out = env.forge_test(std::path::Path::new("."))?;
assert!(test_out.success);
assert_eq!(test_out.tests_passed, Some(12));

// forge coverage — summary + lcov 2 pass
let coverage = env.forge_coverage(std::path::Path::new("."))?;
emit_lcov_to(&coverage, std::path::Path::new("lcov.info"))?;

// cast wrappers — signing credential redacted from command_str
let call_out = env.cast_call("http://127.0.0.1:8545", "0x...", "totalSupply()", &[])?;
```

- **`FoundryEnv::detect()`** — forge / cast / anvil availability probe、 graceful skip pattern (`ForgeTestOutput::skipped` / `CastOutput::skipped` / `CoverageReport::skipped`)
- **`Anvil::spawn_deterministic(port)`** — `Drop` 実装で kill + wait 自動 cleanup、 `wait_ready(timeout)` で TCP accept 監視、 zombie process 防止
- **`emit_lcov_to(&report, path)`** — CI 想定の path に lcov file を write
- **`cast_call/send/rpc`** wrapper — signing credential は command_str から意図的に redact

### alloy.rs helper (v1.10-6)

```rust
use kiwa::contract::alloy::{
    ContractCall, Provider, Signer, SolAbi, canonical_signature, keccak_selector_hex,
};

// ABI JSON parser — Foundry out/*.json → SolAbi shape
let abi = SolAbi::parse_foundry_out("ERC20", &fs::read_to_string("out/ERC20.json")?)?;
let selector = abi.selector_of("transfer").unwrap();  // "0xa9059cbb"
let sig = abi.signature_of("transfer").unwrap();       // "transfer(address,uint256)"

// Signer 4 種 + Provider 3 種
let signer = Signer::LocalWallet {
    chain_id: 31337,
    seed_descriptor: "anvil-account-0".to_string(),
};
let provider = Provider::anvil_http(8545);

// Call encoding — cast rpc / alloy SolCall::abi_encode 兼用
let call = ContractCall::with_encoded_args(
    "0xcafe",
    &selector,
    "0000000000000000000000001111111111111111111111111111111111111111",  // to
);
```

- **`SolAbi::parse_foundry_out(name, json)`** — Foundry `out/*.json` の ABI array を hand-rolled parser で read、 function + event + error + constructor / fallback / receive を kind 別に整理
- **built-in keccak-256** — 4-byte function selector 計算に `sha3` crate 追加なし、 canonical signature (例 `transfer(address,uint256)` → `0xa9059cbb`) を生成
- **Signer enum** — `LocalWallet` / `AwsKms` / `Ledger` / `Trezor` の 4 経路、 実 signing は user side の alloy-signer で実装
- **Provider enum** — `Http` / `Ws` / `Ipc` の 3 transport、 `Provider::anvil_http(port)` shortcut
- **`ContractCall::no_args` / `with_encoded_args`** — selector + calldata を hex 生成、 `cast rpc eth_call` や alloy `SolCall::abi_encode` に直接投入可能

## 4. Layer 1 spec + skill chain 拡張

`/kiwa-design --layer contract-rust --provider {foundry|alloy}` flag が使用可能に。 9 column 拡張表で 6 次元 (対象 contract Solidity file / 対象 method / 呼出方向 call or send / signer path / provider transport / assertion 型) を cover。 出力は `tests/spec/contract/test-spec-{module}.contract-rust.md`。

Layer 2 `/kiwa-rust --layer contract-rust --provider ...` が spec を read して Rust test file を生成 (`tests/{module}_contract_foundry.rs` / `tests/{module}_contract_alloy.rs`)。

## Migration

v1.9 user は zero-migration。 既存 test file はそのまま動く。 v1.10 追加は全て opt-in。

Rust update:

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.4.2", features = ["contract-foundry", "contract-alloy"] }
```

TS 側は import 追加のみ。

## v1.11 候補

- Storybook integration (v2.0 pull-forward 候補)
- Dragonfly (2025 新興 cache、 eco system 熟成待ち)
- Reth (Rust Ethereum 実行 client、 dApp test 需要が育つ)
- Go Iris + Chi (framework 縦深化続き)

## 参考

- v1.10 親 Issue: https://github.com/cardene777/kiwa/issues/666
- Supabase Auth 公式: https://supabase.com/docs/guides/auth
- RabbitMQ 公式: https://www.rabbitmq.com/documentation.html
- Foundry-rs: https://github.com/foundry-rs/foundry
- alloy.rs: https://github.com/alloy-rs/alloy
