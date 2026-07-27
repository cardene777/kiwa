# Axum router を検証する

Axum application の route を test するとき、localhost に bind して HTTP client を通す必要はありません。`test_app` は router を private Tokio runtime に包み、`oneshot` で in-process 実行します。これにより port の取り合いを避けながら、status、body、header を response として確認できます。

## feature を追加する

Axum adapter は opt-in です。application が使う Axum と crate の feature を development dependency に追加します。

```toml
[dev-dependencies]
axum = { version = "0.8", features = ["json", "tokio"] }
kiwa-test-rs = { version = "0.5", features = ["axum"] }
```

`kiwa::axum` が見つからない compile error は、多くの場合 feature が有効になっていないことが原因です。workspace では dependency feature が test target に伝わっているかも確認してください。

## route を呼ぶ

`tests/health.rs` を作り、次の内容全体を保存します。この test は `GET /health` を router に直接送り、200 と `ok` を確認します。

```rust
use axum::{routing::get, Router};
use kiwa::axum::{test_app, HttpMethod};

#[test]
fn health_endpoint_responds() {
    let app = Router::new().route("/health", get(|| async { "ok" }));
    let test = test_app(app);

    let response = test.request(HttpMethod::Get, "/health").send();

    assert_eq!(response.status(), 200);
    assert_eq!(response.body_str(), "ok");
}
```

```bash
cargo test --features axum --test health health_endpoint_responds
```

`test health_endpoint_responds ... ok` と表示されれば、request が router に届き、buffer 済み response を assert できています。`request` には `header`、`body`、`json` を連結できます。`json` には `serde_json::to_vec` などで serialize した bytes を渡し、content type は adapter が設定します。

## 404 と入力不正を扱う

未登録 path は Axum が返す 404 response として受け取れます。例えば `test.request(HttpMethod::Get, "/unknown").send()` の `status()` は 404 です。一方、request target が `/` で始まらない場合や header が HTTP として不正な場合、`send` は `Result` を返さず panic します。test の input を組み立てる helper で path と header を検証し、panic を通常の application error として扱わないでください。

## lifecycle と実環境の境界

`TestApp` は scope 終了時に Tokio runtime を停止します。途中で停止状態も test したいときは `let mut test = test_app(app)` として `test.stop()` を呼びます。停止後の `send` は lifecycle violation として panic するため、停止済み handle を helper から返したり、test 間で再利用したりしません。

この adapter は router と middleware の挙動を process 内で確かめます。TLS、proxy、DNS、実 service への request、production runtime の scheduling は再現しません。router が外部 API を呼ぶ場合は `kiwa::integration::mock_server` をその upstream URL として注入し、実 service との接続は staging などの environment で別に検証してください。
