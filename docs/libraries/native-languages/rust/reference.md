# kiwa-test-rs リファレンス

`kiwa-test-rs` は Rust 1.75 以降を対象にします。crate root は `setup_env`、`KiwaEnv`、`Mode`、`SetupOpts`、`assert_kiwa_eq!`、`assert_kiwa_close!` を公開します。feature を有効にしない module は compile できません。

## feature と module

| feature | module | 主な API |
| --- | --- | --- |
| なし | `unit` | `setup_env`、`KiwaEnv`、`Mode`、`SetupOpts` |
| default の `integration` | `integration` | `mock_server`、`MockServer`、`Route`、`MockResponse` |
| `axum` | `axum` | `test_app`、request builder、`TestResponse` |
| `actix-web` | `actix` | `test_app`、request builder、`TestResponse` |
| `tower-http` | `tower_http` | `test_chain`、CORS、trace、compression、auth、rate limit、timeout helper |
| `contract-foundry` | `contract::foundry` | Forge、Cast、Anvil、coverage、invariant、script |
| `contract-alloy` | `contract::alloy` | ABI、selector、signer、provider、EIP-712、Multicall3、Permit2 |
| `contract-reth` | `contract::reth` | Reth node、reorg、fidelity matrix |

`tower-http` は `axum` を有効にします。`contract-foundry` と `contract-reth` は CLI を PATH に必要とします。CLI がない場合の helper は subprocess を起動せず、skipped output を返す契約です。

## unit と integration

`setup_env(SetupOpts)` は `KiwaEnv` を返し、scope 終了時の `Drop` でも `stop` を呼びます。`Mode::Mock` と `Mode::Live` は fixture の意図を表す値で、Live が外部 resource を自動起動するわけではありません。

`integration::mock_server` は route を登録順に評価し、method と path が完全一致した最初の route を使います。未一致 request も記録し 404 を返します。`MockServer::recorded_requests` は body と multi-value headers をコピーして返します。`MockServer::stop` は mutable handle を必要とし、Drop 後も安全です。

## web framework

Axum、actix-web、tower-http の request builder は header、body、JSON を設定して in-process 実行します。response の `headers` は key ごとの最後の値です。Set-Cookie のような複数値は `headers_all`、`headers_all_values`、`cookies` を使って確認します。

停止後の `send` は lifecycle error です。builder の path や header が不正な場合も `Result` ではなく panic になる API があるため、fixture 入力を組み立てる test 側で検証してください。

## contract

Foundry module は `FoundryEnv`、`Anvil`、`CoverageReport`、`invariant_run`、`forge_script`、shrink parser を公開します。Alloy module は `SolAbi`、`Signer`、`Provider`、selector helper と ABI encoding helper を公開します。これらは alloy crate family を依存に追加せず、encoded bytes や parsed shape を利用側の provider へ渡す設計です。

Reth module は `RethNode` と `reth_reorg` を使い、dev node の subprocess と JSON-RPC endpoint を管理します。実 Reth client の sync、P2P、mainnet 接続を再現しません。

## 全 API の宣言

module ごとの公開 declaration と feature gate は [crate root](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/lib.rs)、[integration](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/integration.rs)、[Axum](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/axum.rs)、[Actix](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/actix.rs)、[tower-http](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/tower_http/mod.rs)、[contract](https://github.com/cardene777/kiwa/blob/main/kiwa-rs/src/contract/mod.rs) にあります。
