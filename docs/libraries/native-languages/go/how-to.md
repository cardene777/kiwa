# HTTP mock server を使う

外部の users API を呼ぶ Go code を test するとき、実 API の URL を使うと、network、データ、rate limit の状態によって結果が変わります。`NewMockServer` は test の中だけで HTTP server を起動するため、client が送る request と、server が返す response を一つの test で固定できます。

## route と request を検証する

次の test は `GET /users` に JSON を返し、client がその route を一回だけ呼んだことまで確認します。server URL は固定しません。`NewMockServer` が割り当てた URL を production code の endpoint 設定へ渡してください。

```go
package example_test

import (
    "io"
    "net/http"
    "testing"

    kiwa "github.com/cardene777/kiwa-test-go"
)

func TestListsUsers(t *testing.T) {
    server := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
        kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
            return kiwa.JSON([]byte(`[{"id":1,"name":"sora"}]`))
        }),
    ))

    response, err := http.Get(server.URL() + "/users")
    if err != nil {
        t.Fatal(err)
    }
    defer response.Body.Close()

    body, err := io.ReadAll(response.Body)
    if err != nil {
        t.Fatal(err)
    }

    kiwa.AssertEqual(t, response.StatusCode, http.StatusOK)
    kiwa.AssertEqual(t, string(body), `[{"id":1,"name":"sora"}]`)
    kiwa.AssertEqual(t, server.RequestCount(), 1)
    kiwa.AssertEqual(t, server.RecordedRequests()[0].Path, "/users")
}
```

この test を含む module で次を実行します。

```bash
go test . -run '^TestListsUsers$'
```

`ok` と表示されれば、registered route が 200 と JSON body を返し、recorder が request を保持できています。`RecordedRequests` は内部 log の copy を返すため、取得した body や header を test 側で変更しても server の記録は変わりません。

## request body と header を使って response を決める

route handler は `RecordedRequest` を受け取ります。例えば POST body をそのまま返す endpoint は次のように書けます。

```go
kiwa.NewRoute(kiwa.MethodPOST, "/echo", func(request kiwa.RecordedRequest) kiwa.MockResponse {
    return kiwa.OK(request.Body).WithStatus(http.StatusCreated)
})
```

handler を実行する前に request は recorder へ追加されます。handler では `request.Method`、`request.Path`、`request.Headers`、`request.HeadersAll`、`request.Body` を読み、test の最後には `server.RecordedRequests()` で実際に送られた値を assert します。`Headers` は key ごとの単一値、複数の `Set-Cookie` などは `HeadersAll` を使います。

## 未登録 request を失敗として扱う

route は登録順に評価され、method と path が完全一致した最初の route だけが選ばれます。`GET /users/1` は `/users` と一致しません。未登録 route は self-describing な 404 を返しますが、request 自体は recorder に残ります。これは production code が想定外の URL を呼んだときにも、network timeout ではなく test failure として調べられるようにするためです。

path parameter、glob、正規表現、response sequence はこの server の責務ではありません。必要な route を明示的に追加するか、より高度な matching が必要なら専用の HTTP mock library を選んでください。

## cleanup と実環境の境界

`NewMockServer` は `t.Cleanup` で `Stop` を呼び、explicit な `server.Stop()` との重複も安全です。停止後に同じ URL へ request すると connection error になります。server handle を test 間で共有せず、各 test または subtest が自分の server を作ると、parallel test でも port と recorder が混ざりません。

この server は local HTTP transport と request contract の検証用です。TLS、proxy、DNS、実際の API 認証、相手 service の schema は再現しません。それらは staging などの real integration environment で別に確認してください。
