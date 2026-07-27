# kiwa-test-go を始める

ここでは、Go の test に deterministic な fixture を一つ追加します。fixture は test の開始時には mock mode と seed を持ち、test が戻ると自動で停止します。追加の server や環境変数は必要ありません。

## 追加する

`kiwa-test-go` v0.2 は Go 1.25 以降を必要とします。対象 module の root で次を実行します。

```bash
go get github.com/cardene777/kiwa-test-go@v0.2.0
```

`go.mod` に `github.com/cardene777/kiwa-test-go v0.2.0` が追加されます。Gin、Echo、Fiber の adapter が必要になったときだけ、それぞれの import path を追加してください。root package だけなら runtime dependency は増えません。

## 最初の test を書く

`fixture_test.go` を作成し、次の内容を入れます。

```go
package example_test

import (
    "testing"

    kiwa "github.com/cardene777/kiwa-test-go"
)

func TestUsesMockMode(t *testing.T) {
    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
        Mode:  kiwa.ModeMock,
        Seed:  kiwa.Seed(42),
        Label: "users",
    })

    kiwa.AssertEqual(t, env.Mode(), kiwa.ModeMock)
    kiwa.AssertEqual(t, *env.Seed(), uint64(42))
    kiwa.AssertEqual(t, env.Label(), "users")
}
```

`Seed` は `UnitOpts.Seed` に渡す `uint64` の pointer を作ります。`SetupUnitEnv` はここで `env.Stop` を `t.Cleanup` に登録しているため、成功、失敗、`t.Fatal` のいずれで test が終わっても fixture は停止します。`Stop` を自分で呼ぶ必要があるのは、test の途中で停止後の振る舞いも確認したい場合だけです。

## 実行して確認する

```bash
go test . -run '^TestUsesMockMode$'
```

次のように package が `ok` となれば、fixture は期待した mode、seed、label を持って作られています。

```text
ok      example  0.0s
```

`env.Seed()` は seed を指定しなければ `nil` を返します。nil のまま値を dereference すると test が panic するため、seed を任意にする test では先に nil を確認してください。`UnitEnv` の同じ instance は goroutine 間で共有するためのものではありません。並列 test では各 goroutine が自分の fixture を作ります。

## skill から test を作る

仕様から Go test のたたき台を作る場合は、初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の command は `users` module の仕様を作り、その仕様から Go の unit test を生成します。

```text
/kiwa:kiwa-design --layer go-unit --module users
/kiwa:kiwa-go --module users
```

生成先は通常 `examples/{example}/users_test.go` です。生成物をそのまま正解とせず、このページのように入力、期待値、cleanup の責務を確認してから、生成した package で `go test . -run '^TestUsers$'` のように対象 test を実行してください。Gin、Echo、Fiber を対象にする場合は `--mode gin`、`--mode echo`、`--mode fiber` を明示します。

次は [HTTP mock server を使う](./how-to) で、HTTP request の内容まで検証します。
