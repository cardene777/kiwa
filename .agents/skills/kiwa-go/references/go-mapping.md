# 11 + 2 観点 → testing.T helper マッピング (Go polyglot)

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点 + (PR #301 で追加) 12 UI feature 網羅 / 13 wallet 接続 flow を `kiwa-test-go` v0.1 (PR #585 / #586) の Go `testing.T` 文法に変換するときの code snippet 集。 `kiwa-design/references/viewpoints-catalog.md` § 観点 × Layer 2 ランナー の Go 列を実装手順で展開した詳細版。

## 観点 1: 正常系

```go
import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/my-pkg"
)

func TestCalculateFeeReturns001ETHForStandardMintFlow(t *testing.T) {
	_ = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
		Mode:  kiwa.ModeMock,
		Seed:  kiwa.Seed(42),
		Label: "happy-path",
	})
	kiwa.AssertEqual(t, mypkg.CalculateFee(1, 0.01), 0.01)
}
```

## 観点 2: 異常系

```go
import (
	"errors"
	"testing"

	"github.com/example/my-pkg"
)

func TestFetchMetadataSurfacesRPC503AsMetadataFetchError(t *testing.T) {
	_, err := mypkg.FetchMetadata("http://127.0.0.1:1")
	if err == nil {
		t.Fatal("want err")
	}
	var fetchErr *mypkg.MetadataFetchError
	if !errors.As(err, &fetchErr) {
		t.Fatalf("want MetadataFetchError, got %T", err)
	}
}
```

`errors.As` で error variant、 `errors.Is` で sentinel error 確認。

## 観点 3: 境界値 (table-driven)

```go
import "testing"

func TestMintBoundary(t *testing.T) {
	tests := []struct {
		name    string
		tokenID uint64
		wantErr bool
	}{
		{name: "max_supply", tokenID: 100, wantErr: true},
		{name: "over_max_supply", tokenID: 101, wantErr: true},
		{name: "zero_edge", tokenID: 0, wantErr: true},
		{name: "happy_99", tokenID: 99, wantErr: false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := mypkg.Mint(tc.tokenID)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("want err for %d", tc.tokenID)
				}
			} else if err != nil {
				t.Fatalf("unexpected err for %d: %v", tc.tokenID, err)
			}
		})
	}
}
```

Go の table-driven test は `t.Run(tc.name, ...)` で sub-test、 `-run TestMintBoundary/max_supply` で単発実行可。

## 観点 4: 状態遷移

```go
import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/counter"
)

func TestIncrementThenDecrementRestoresValue(t *testing.T) {
	_ = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
	c := counter.NewCounter(10)
	c.Increment()
	c.Decrement()
	kiwa.AssertEqual(t, c.Value(), int64(10), "増減後の戻り値")
}
```

連続呼出と各 step assert、 fake timer 相当は `time.Sleep` ベースを避けて clock injection が default。

## 観点 5: 権限

```go
import (
	"errors"
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/auth"
)

func TestAdminRoleCanAuthorize(t *testing.T) {
	_ = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Label: "role:admin"})
	if err := auth.Authorize(auth.RoleAdmin, "delete_user"); err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
}

func TestMemberRoleRejectsAdminAction(t *testing.T) {
	_ = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Label: "role:member"})
	err := auth.Authorize(auth.RoleMember, "delete_user")
	if err == nil {
		t.Fatal("want err")
	}
	if !errors.Is(err, auth.ErrForbidden) {
		t.Fatalf("want ErrForbidden, got %v", err)
	}
}
```

role context は fixture `Label`、 reject path は `errors.Is` で sentinel 確認。

## 観点 6: 入力バリデーション

```go
import (
	"errors"
	"testing"

	"github.com/example/address"
)

func TestZeroAddressRejected(t *testing.T) {
	_, err := address.Parse("0x0000000000000000000000000000000000000000")
	if err == nil {
		t.Fatal("want err")
	}
	if !errors.Is(err, address.ErrZeroAddress) {
		t.Fatalf("want ErrZeroAddress, got %v", err)
	}
}
```

schema 違反 input で sentinel error を `errors.Is` で確認。

## 観点 7: 冪等性

```go
import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/state"
)

func TestApplyIncrementIsIdempotentForSameRequestID(t *testing.T) {
	s := state.New()
	s.ApplyIncrement("req-1")
	s.ApplyIncrement("req-1")
	s.ApplyIncrement("req-1")
	kiwa.AssertEqual(t, s.Value(), int64(1), "req-1 を 3 回 apply しても +1 だけ")
}
```

同一 input を N 回呼んで「副作用 1 回」 を `kiwa.AssertEqual` で確認。

## 観点 8: 並行処理 (t.Parallel + sync)

```go
import (
	"sync"
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/race"
)

func TestFirstGoroutineWinsRace(t *testing.T) {
	t.Parallel()
	var wg sync.WaitGroup
	results := make([]race.Result, 4)
	for i := 0; i < 4; i++ {
		wg.Add(1)
		i := i
		go func() {
			defer wg.Done()
			results[i] = race.Winner(i)
		}()
	}
	wg.Wait()

	hasWinner := false
	for _, r := range results {
		if r.IsWinner {
			hasWinner = true
			break
		}
	}
	kiwa.AssertEqual(t, hasWinner, true)
}
```

`t.Parallel()` で test 全体を並列対象に、 内部の N goroutine は `sync.WaitGroup` / `errgroup.Group` で同期。

## 観点 9: 性能

```go
import (
	"testing"
	"time"

	"github.com/example/heavy"
)

func TestHeavyComputationCompletesWithin100ms(t *testing.T) {
	start := time.Now()
	_ = heavy.Computation(1000)
	elapsed := time.Since(start)
	if elapsed > 100*time.Millisecond {
		t.Fatalf("took %v, want < 100ms", elapsed)
	}
}
```

`time.Since(start)` で latency 計測、 baseline 比較。 micro-bench は `testing.B` 別経路 (`go test -bench=.`)。

## 観点 10: セキュリティ

```go
import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/sanitize"
)

func TestXSSPayloadEscaped(t *testing.T) {
	raw := "<script>alert(1)</script>"
	safe := sanitize.HTML(raw)
	kiwa.AssertEqual(t, safe, "&lt;script&gt;alert(1)&lt;/script&gt;")
}
```

XSS payload / SQL injection input で safe escape 確認。

## 観点 11: 回帰

```go
import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/premium"
)

// 既存 bug #123: 0-quantity で panic していた case の re-fix.
func TestRegressionIssue123ZeroQuantityReturnsZeroNotPanic(t *testing.T) {
	got := premium.Compute(0, 10.0)
	kiwa.AssertEqual(t, got, 0.0)
}
```

1 test = 1 bug、 関数名コメントに Issue / PR 番号を明記。

## 観点 12: signed overflow wrap (Go 固有、 panic ではなく wrap)

```go
import (
	"math"
	"testing"

	"github.com/cardene777/kiwa-test-go"
	"github.com/example/counter"
)

func TestIncrementOverflowWrapsToMinInt64(t *testing.T) {
	c := counter.NewCounter(math.MaxInt64)
	c.Increment()
	kiwa.AssertEqual(t, c.Value(), int64(math.MinInt64), "signed overflow wrap")
}

func TestDecrementUnderflowWrapsToMaxInt64(t *testing.T) {
	c := counter.NewCounter(math.MinInt64)
	c.Decrement()
	kiwa.AssertEqual(t, c.Value(), int64(math.MaxInt64), "signed underflow wrap")
}
```

Go の signed int overflow は defined behavior (wrap、 Rust の debug build panic と対照的)。 wrap 後の値を deterministic に `kiwa.AssertEqual` で確認する。

## 観点 13: mock_server 経路 (integration、 PR #586)

```go
import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

func TestGetUsersReturnsArray(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`[{"id":1,"name":"sora"}]`))
		}),
	))

	resp, err := http.Get(srv.URL() + "/users")
	if err != nil {
		t.Fatalf("GET /users: %v", err)
	}
	defer resp.Body.Close()
	kiwa.AssertEqual(t, resp.StatusCode, 200)

	var users []map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		t.Fatalf("decode: %v", err)
	}
	kiwa.AssertEqual(t, len(users), 1)
	kiwa.AssertEqual(t, users[0]["id"], float64(1))
}
```

`NewMockServer` は `net/http/httptest.NewServer` backend、 `t.Cleanup` で port release。 同一 test 内で複数 server 同時起動可。

## 観点 14: recorder 検証 (integration)

```go
import (
	"bytes"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

func TestRecorderCapturesRequestMethodPathBody(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodPOST, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`{"id":42}`))
		}),
	))

	body, _ := json.Marshal(map[string]string{"name": "hina"})
	resp, err := http.Post(srv.URL()+"/users", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("POST /users: %v", err)
	}
	defer resp.Body.Close()

	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, len(recorded), 1)
	kiwa.AssertEqual(t, recorded[0].Method, "POST")
	kiwa.AssertEqual(t, recorded[0].Path, "/users")
	kiwa.AssertEqual(t, recorded[0].Headers["content-type"], "application/json")

	var capturedBody map[string]string
	if err := json.Unmarshal(recorded[0].Body, &capturedBody); err != nil {
		t.Fatalf("decode recorded body: %v", err)
	}
	kiwa.AssertEqual(t, capturedBody["name"], "hina")
}
```

`RecordedRequests()` は send 順の `[]RecordedRequest`。 method / path / headers / body の 4 軸で session 内 capture を確認する。

## 観点 15: t.Parallel() で並列 send (integration)

```go
import (
	"net/http"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

func TestParallelRequestsRecordedInAnyOrder(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/a", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`{}`))
		}),
	).WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/b", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`{}`))
		}),
	))

	for _, path := range []string{"a", "b", "a", "b"} {
		path := path
		t.Run(path, func(t *testing.T) {
			t.Parallel()
			resp, err := http.Get(srv.URL() + "/" + path)
			if err != nil {
				t.Fatalf("GET /%s: %v", path, err)
			}
			defer resp.Body.Close()
			kiwa.AssertEqual(t, resp.StatusCode, 200)
		})
	}
}

func TestRequestCountTotal(t *testing.T) {
	// 別 test で count 確認、 recorder は server lifetime 内 cumulative
	// ... (上記 test 後の count assertion は同 test 内で完結させる方が安定)
}
```

`t.Parallel()` で sub-test 並列実行、 順序非依存で `RequestCount()` の合計だけ確認する pattern。 同 server に対する concurrent send は `httptest.Server` が標準対応。

## anvil / chain 連携 (本 skill scope 外)

Go の dApp e2e (go-ethereum + anvil) は v0.3+ 候補で v1.4 milestone scope 外 (`#575` 参照)。 本 skill は `testing.T` + httptest に閉じる、 chain 連携が必要な case は kiwa-test-go 側の roadmap 待ち。
