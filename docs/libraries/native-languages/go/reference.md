# kiwa-test-go リファレンス

このページは `github.com/cardene777/kiwa-test-go` の公開 package をまとめます。root package は unit fixture、assertion、実ポートの HTTP mock server を持ち、framework adapter は別 import path です。

## unit fixture

`SetupUnitEnv(t, UnitOpts)` は `testing.TB` に cleanup を登録して `*UnitEnv` を返します。zero value の `UnitOpts` は `ModeMock`、seed と label は未設定です。`ModeLive` は real-resource fixture を選ぶフラグで、network や filesystem を自動で開始するものではありません。

| API | 結果 |
| --- | --- |
| `Seed(uint64)` | `UnitOpts.Seed` に渡す `*uint64` |
| `UnitEnv.ID` | process 内で単調増加する fixture ID |
| `UnitEnv.Mode` | `ModeMock` または `ModeLive` |
| `UnitEnv.Seed` | 設定済み seed、未設定なら nil |
| `UnitEnv.Label` | 設定済み label、未設定なら空文字列 |
| `UnitEnv.Stop` | idempotent な停止処理 |
| `UnitEnv.IsStopped` | 明示停止または cleanup 後か |

`UnitEnv` は作成した goroutine で使う前提です。同じ handle を goroutine 間で共有する同期 API ではありません。

## assertion

`AssertEqual(t, got, want, hint...)` は `reflect.DeepEqual`、`AssertClose(t, got, want, tolerance, hint...)` は絶対差を使います。どちらも失敗時に `t.Fatalf` します。`AssertClose` は片方でも NaN の場合に失敗します。

## HTTP mock server

`NewMockServer(t, MockServerOpts)` は OS が選ぶ port で server を開始し、`t.Cleanup` で停止します。route は登録順で評価し、method と path が完全一致した最初の route を使います。glob、parameter、正規表現の path matching はありません。未一致 request も recorder に残り、404 を返します。

| API | 動作 |
| --- | --- |
| `NewRoute` | method、完全一致 path、handler から Route を作る |
| `MockServerOpts.WithRoute` | route を追加した options を返す |
| `OK` | 200 と defensive copy された body |
| `JSON` | 200、JSON content type、defensive copy された body |
| `MockResponse.WithStatus` | status を差し替える |
| `MockResponse.WithBody` | body を defensive copy して差し替える |
| `MockResponse.WithHeader` | 単一値 header を差し替える |
| `MockResponse.WithHeaderValues` | Set-Cookie など複数値 header を追加する |
| `MockServer.RecordedRequests` | body と multi-value header をコピーした snapshot |
| `MockServer.Stop` | idempotent に server を閉じる |

`HeadersAll` は複数値を保持します。`Headers` と同じ key を指定した場合、`Headers` が最後に Set されて `HeadersAll` の値を置き換えます。

## framework adapter

Gin、Echo、Fiber、Chi、Iris は同じ fluent request surface を提供します。各 package の `NewTestServer` は framework の app または router を受け取り、socket を bind せずに handler を実行します。

| import path | constructor | app accessor |
| --- | --- | --- |
| `kiwa-test-go/gin` | `gin.NewTestServer(t, engine)` | `Engine` |
| `kiwa-test-go/echo` | `echo.NewTestServer(t, app)` | `Echo` |
| `kiwa-test-go/fiber` | `fiber.NewTestServer(t, app)` | `App` |
| `kiwa-test-go/chi` | `chi.NewTestServer(t, router)` | `Router` |
| `kiwa-test-go/iris` | `iris.NewTestServer(t, app)` | `App` |

各 test server は `Request(method, path)` を返します。request には `Header`、`Body`、`JSON`、`Send` があり、Fiber だけは request timeout を指定する `Timeout` も持ちます。response には `StatusCode`、`Headers`、`HeadersAll`、`HeadersAllValues`、`Cookies`、`Body`、`BodyString`、`JSON` があります。

停止済み server に `Send` すると test failure になります。adapter の response body と recorder の request body は copy されるため、取得後に変更しても内部記録は変わりません。

## 全 API の宣言

root package の宣言は [unit](https://github.com/cardene777/kiwa/blob/main/kiwa-go/unit.go)、[assertion](https://github.com/cardene777/kiwa/blob/main/kiwa-go/assertions.go)、[integration](https://github.com/cardene777/kiwa/blob/main/kiwa-go/integration.go) にあります。framework adapter の全 method は [Gin](https://github.com/cardene777/kiwa/blob/main/kiwa-go/gin/gin.go)、[Echo](https://github.com/cardene777/kiwa/blob/main/kiwa-go/echo/echo.go)、[Fiber](https://github.com/cardene777/kiwa/blob/main/kiwa-go/fiber/fiber.go)、[Chi](https://github.com/cardene777/kiwa/blob/main/kiwa-go/chi/chi.go)、[Iris](https://github.com/cardene777/kiwa/blob/main/kiwa-go/iris/iris.go) を参照してください。これらは各 package の public declaration だけを持ち、internal recorder は import できません。
