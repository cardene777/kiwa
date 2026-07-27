# kiwa-test-rs を始める

ここでは Rust project の test に fixture を一つ作ります。fixture は mock mode、任意の seed、任意の label を保持し、変数が scope を抜けると停止します。まずは network を起動しない unit test として使います。

## 追加する

`kiwa-test-rs` 0.5 は Rust 1.75 以降と edition 2021 を対象にします。`Cargo.toml` の development dependency に追加します。

```toml
[dev-dependencies]
kiwa-test-rs = "0.5"
```

この既定設定には integration mock server が含まれます。fixture だけを使い、Hyper と Tokio を dependency graph に入れたくない場合は次のようにします。

```toml
[dev-dependencies]
kiwa-test-rs = { version = "0.5", default-features = false }
```

後から Axum、actix-web、tower-http の adapter が必要になったときだけ、対応する feature を追加してください。無効な feature の module は import できないため、compile error が出たら `Cargo.toml` の feature 指定を確認します。

## 最初の test を書く

`tests/fixture.rs` に次を置きます。

```rust
use kiwa::unit::{setup_env, Mode, SetupOpts};

#[test]
fn uses_mock_mode() {
    let env = setup_env(SetupOpts {
        mode: Mode::Mock,
        seed: Some(42),
        label: Some("users".into()),
    });

    assert_eq!(env.mode(), Mode::Mock);
    assert_eq!(env.seed(), Some(42));
    assert_eq!(env.label(), Some("users"));
}
```

`SetupOpts::default()` は `Mode::Mock` を選び、seed と label は `None` です。`KiwaEnv` は `Drop` で `stop` を呼ぶため、この test では manual cleanup は必要ありません。test の途中で lifecycle を調べる場合だけ `let mut env` として `env.stop()` を呼びます。`stop` は複数回呼んでも安全です。

## 実行して確認する

```bash
cargo test --test fixture uses_mock_mode
```

次のように test が通れば、fixture は mock mode と指定した seed を保持できています。

```text
test uses_mock_mode ... ok
```

`KiwaEnv` は作成した test thread に閉じる fixture で、別 thread へ送る `Send` handle ではありません。parallel test ごとに新しい fixture を作ってください。`Mode::Live` を選んでも network や filesystem の resource は起動しないため、実 resource を使う test では endpoint、credential、cleanup を利用側で明示します。

## skill から test を作る

仕様から Rust test の土台を作る場合は、初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の command は `users` module の仕様を作り、その仕様を Rust の unit test へ変換します。

```text
/kiwa:kiwa-design --layer rust-unit --module users
/kiwa:kiwa-rust --module users
```

生成物は通常 `examples/{example}/users_test.rs` に置かれます。生成された assertion や feature 指定を review し、この Quickstart と同じく入力、期待値、scope 終了時の cleanup を確認してから、生成された test file を指定して `cargo test --test users_test` を実行してください。

次は [Axum router を検証する](./how-to) で、port を開かずに route を検証します。
