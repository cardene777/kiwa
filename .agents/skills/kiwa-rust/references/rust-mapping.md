# 11 + 2 観点 → cargo test helper マッピング (Rust polyglot)

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点 + (PR #301 で追加) 12 UI feature 網羅 / 13 wallet 接続 flow を `kiwa-test-rs` v0.1 (PR #583 / #584) の Rust cargo test 文法に変換するときの code snippet 集。 `kiwa-design/references/viewpoints-catalog.md` § 観点 × Layer 2 ランナー の Rust 列を実装手順で展開した詳細版。

## 観点 1: 正常系

```rust
use kiwa::unit::{setup_env, Mode, SetupOpts};
use kiwa::assert_kiwa_eq;
use my_crate::calculate_fee;

#[test]
fn tc_001_returns_0_01_eth_for_standard_mint_flow() {
    let _env = setup_env(SetupOpts {
        mode: Mode::Mock,
        seed: Some(42),
        label: Some("happy-path".into()),
    });
    assert_kiwa_eq!(calculate_fee(1_u64, 0.01_f64), 0.01_f64);
}
```

## 観点 2: 異常系

```rust
use kiwa::unit::setup_env;
use kiwa::unit::SetupOpts;
use my_crate::{fetch_metadata, MetadataFetchError};

#[test]
fn tc_nn_surfaces_rpc_503_as_metadata_fetch_error() {
    let _env = setup_env(SetupOpts::default());
    let err = fetch_metadata("http://127.0.0.1:1").expect_err("should fail");
    assert!(matches!(err, MetadataFetchError::Rpc(_)));
}
```

`Result::expect_err` で error path、 `matches!` で error variant を確認する。 panic 系は `#[should_panic(expected = "...")]`。

## 観点 3: 境界値

```rust
use kiwa::assert_kiwa_eq;
use my_crate::mint;

#[test]
fn tc_nn_boundary_max_supply_rejects() {
    let err = mint(100_u64).err();
    assert!(err.is_some(), "100 (max supply +1) should reject");
}

#[test]
fn tc_nn_boundary_over_max_supply_rejects() {
    assert!(mint(101_u64).is_err());
}

#[test]
fn tc_nn_boundary_zero_edge_rejects() {
    assert!(mint(0_u64).is_err());
}
```

cargo test は table-driven の組込 helper を持たないので、 境界 1 件 = 1 `#[test]` で書く (vitest の `it.each` 相当は `paste::paste!` macro で書けるが、 generator skill では plain `#[test]` 列挙を default とする)。

## 観点 4: 状態遷移

```rust
use kiwa::unit::{setup_env, SetupOpts};
use kiwa::assert_kiwa_eq;
use my_crate::Counter;

#[test]
fn tc_nn_state_transition_increment_then_decrement_restores_value() {
    let _env = setup_env(SetupOpts::default());
    let mut c = Counter::new(10);
    c.increment();
    c.decrement();
    assert_kiwa_eq!(c.value(), 10_i64, "増減後の戻り値");
}
```

連続呼出と各 step assert。 fake timer 相当は Rust では `tokio::time::pause()` (async) / 自前 clock injection が default。

## 観点 5: 権限

```rust
use kiwa::unit::{setup_env, SetupOpts};
use my_crate::{authorize, Role};

#[test]
fn tc_nn_admin_role_can_authorize() {
    let _env = setup_env(SetupOpts {
        label: Some("role:admin".into()),
        ..Default::default()
    });
    assert!(authorize(Role::Admin, "delete_user").is_ok());
}

#[test]
fn tc_nn_member_role_rejects_admin_action() {
    let _env = setup_env(SetupOpts {
        label: Some("role:member".into()),
        ..Default::default()
    });
    let err = authorize(Role::Member, "delete_user").expect_err("should reject");
    assert!(matches!(err, my_crate::AuthError::Forbidden));
}
```

role context を fixture label に inject、 reject path は `expect_err` + `matches!`。

## 観点 6: 入力バリデーション

```rust
use my_crate::{parse_address, AddressError};

#[test]
fn tc_nn_zero_address_rejected() {
    let err = parse_address("0x0000000000000000000000000000000000000000").expect_err("zero rejected");
    assert!(matches!(err, AddressError::ZeroAddress));
}

#[test]
fn tc_nn_invalid_hex_rejected() {
    let err = parse_address("0xZZZ").expect_err("invalid hex rejected");
    assert!(matches!(err, AddressError::InvalidHex(_)));
}
```

schema 違反 input で `Result::Err` variant を `matches!` で確認。 zod 相当の宣言 schema は serde + validator crate が default。

## 観点 7: 冪等性

```rust
use kiwa::assert_kiwa_eq;
use my_crate::{State, apply_increment};

#[test]
fn tc_nn_apply_increment_is_idempotent_for_same_request_id() {
    let mut state = State::default();
    apply_increment(&mut state, "req-1");
    apply_increment(&mut state, "req-1");
    apply_increment(&mut state, "req-1");
    assert_kiwa_eq!(state.value(), 1_i64, "req-1 を 3 回 apply しても +1 だけ");
}
```

同一 input を N 回呼んで「副作用 1 回」 を `assert_kiwa_eq!` で確認。

## 観点 8: 並行処理

```rust
use std::thread;
use my_crate::race_winner;

#[test]
fn tc_nn_first_thread_wins_race() {
    let handles: Vec<_> = (0..4)
        .map(|i| thread::spawn(move || race_winner(i)))
        .collect();
    let results: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
    assert!(results.iter().any(|r| r.is_winner));
}
```

`std::thread::spawn` + `JoinHandle::join` で N 並列、 結果 collect 後 assert。 async は `tokio::join!` / `futures::join_all`。

## 観点 9: 性能

```rust
use std::time::Instant;
use my_crate::heavy_computation;

#[test]
fn tc_nn_heavy_computation_completes_within_100ms() {
    let start = Instant::now();
    let _ = heavy_computation(1000);
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "took {elapsed:?}");
}
```

`std::time::Instant::now()` で latency 計測、 baseline 比較。 micro-bench は `cargo bench` (criterion) が default で本 unit test は smoke-perf のみ。

## 観点 10: セキュリティ

```rust
use my_crate::sanitize_html;
use kiwa::assert_kiwa_eq;

#[test]
fn tc_nn_xss_payload_escaped() {
    let raw = "<script>alert(1)</script>";
    let safe = sanitize_html(raw);
    assert_kiwa_eq!(safe, "&lt;script&gt;alert(1)&lt;/script&gt;");
}
```

XSS payload / SQL injection input で safe escape 確認。 Rust では prototype pollution 系は実質発生しないので web context 限定。

## 観点 11: 回帰

```rust
use kiwa::assert_kiwa_eq;
use my_crate::compute_premium;

/// 既存 bug #123: 0-quantity で panic していた case の re-fix.
#[test]
fn tc_nn_regression_issue_123_zero_quantity_returns_zero_not_panic() {
    let premium = compute_premium(0_u64, 10_f64);
    assert_kiwa_eq!(premium, 0.0_f64);
}
```

1 test = 1 bug、 doc comment に Issue / PR 番号を明記。

## 観点 12: panic 系 (i64 overflow / unwrap on None 等、 Rust 固有)

```rust
use my_crate::Counter;

#[test]
#[should_panic(expected = "attempt to add with overflow")]
fn tc_nn_overflow_panics_on_debug_build() {
    let mut c = Counter::new(i64::MAX);
    c.increment();
}
```

debug build での arithmetic overflow は std panic、 `#[should_panic(expected = "...")]` で deterministic 確認。 release build (`cargo test --release`) では wrap になる挙動差は spec の「不足している仕様」 で明示。

## 観点 13: mock_server 経路 (integration、 PR #584)

```rust
use kiwa::integration::{mock_server, HttpMethod, MockResponse, MockServerOpts, RecordedRequest, Route};
use serde_json::json;

#[test]
fn tc_nn_get_users_returns_array() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Get,
        "/users",
        |_req: &RecordedRequest| {
            MockResponse::json(serde_json::to_vec(&json!([
                { "id": 1, "name": "sora" }
            ])).unwrap())
        },
    )));

    let resp = reqwest::blocking::Client::new()
        .get(format!("{}/users", server.base_url()))
        .send()
        .expect("send");
    assert_eq!(resp.status().as_u16(), 200);
    let body: serde_json::Value = resp.json().expect("json");
    assert_eq!(body[0]["id"], 1);
}
```

`mock_server` は OS 割当 port の hyper backend、 Drop で graceful shutdown。 同一 test 内で複数 server 同時起動可 (port 衝突なし、 PoC で確認済)。

## 観点 14: recorder 検証 (integration)

```rust
use kiwa::integration::{mock_server, HttpMethod, MockResponse, MockServerOpts, Route};

#[test]
fn tc_nn_recorder_captures_request_method_path_body() {
    let server = mock_server(MockServerOpts::default().with_route(Route::new(
        HttpMethod::Post,
        "/users",
        |_req| MockResponse::json(b"{\"id\":42}".to_vec()),
    )));

    let client = reqwest::blocking::Client::new();
    client
        .post(format!("{}/users", server.base_url()))
        .json(&serde_json::json!({ "name": "hina" }))
        .send()
        .expect("send");

    let recorded = server.recorded_requests();
    assert_eq!(recorded.len(), 1);
    assert_eq!(recorded[0].method, "POST");
    assert_eq!(recorded[0].path, "/users");
    let body: serde_json::Value = serde_json::from_slice(&recorded[0].body).expect("json");
    assert_eq!(body, serde_json::json!({ "name": "hina" }));
}
```

`recorded_requests()` は send 順の `Vec<RecordedRequest>`。 method / path / headers / body の 4 軸で session 内 capture を確認する。

## 観点 15: multi-route 並列 (integration)

```rust
use std::thread;
use kiwa::integration::{mock_server, HttpMethod, MockResponse, MockServerOpts, Route};

#[test]
fn tc_nn_4_endpoints_parallel_send_records_all() {
    let server = mock_server(
        MockServerOpts::default()
            .with_route(Route::new(HttpMethod::Get, "/a", |_| MockResponse::json(b"{}".to_vec())))
            .with_route(Route::new(HttpMethod::Get, "/b", |_| MockResponse::json(b"{}".to_vec())))
            .with_route(Route::new(HttpMethod::Get, "/c", |_| MockResponse::json(b"{}".to_vec())))
            .with_route(Route::new(HttpMethod::Get, "/d", |_| MockResponse::json(b"{}".to_vec()))),
    );

    let base = server.base_url();
    let handles: Vec<_> = ["a", "b", "c", "d"]
        .into_iter()
        .map(|path| {
            let base = base.clone();
            thread::spawn(move || {
                reqwest::blocking::Client::new()
                    .get(format!("{base}/{path}"))
                    .send()
                    .expect("send")
                    .status()
                    .as_u16()
            })
        })
        .collect();

    let statuses: Vec<_> = handles.into_iter().map(|h| h.join().unwrap()).collect();
    assert!(statuses.iter().all(|s| *s == 200));
    assert_eq!(server.request_count(), 4);
}
```

`thread::spawn` × N で並列 send、 順序非依存で `request_count()` の合計だけ確認する。

## anvil / chain 連携 (本 skill scope 外)

Rust の dApp e2e (alloy.rs + anvil) は v0.3+ 候補で v1.4 milestone scope 外 (`#575` 参照)。 本 skill は cargo test + mock_server に閉じる、 chain 連携が必要な case は kiwa-test-rs 側の roadmap 待ち。
