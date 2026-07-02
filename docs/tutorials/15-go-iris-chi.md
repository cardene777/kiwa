# kiwa-test-go v0.5 — Iris + Chi in-process test

## What you'll build

Two Go test files that exercise **Iris** and **go-chi** through the same `TestServer` contract kiwa's `gin` / `echo` / `fiber` subpackages already provide. In-process `ServeHTTP` dispatch — no port binding, no TIME_WAIT, no parallel test port clashes.

## Prerequisites

- Go ≥ 1.25
- An empty module directory

## Step-by-step build

```bash
mkdir kiwa-go-iris-chi && cd kiwa-go-iris-chi
go mod init example.com/kiwa-go-iris-chi
go get github.com/cardene777/kiwa-test-go@v0.5
go get github.com/kataras/iris/v12
go get github.com/go-chi/chi/v5
```

## Test 1 — Iris

`iris_test.go`:

```go
package main

import (
	"net/http"
	"testing"

	"github.com/kataras/iris/v12"

	kiwa "github.com/cardene777/kiwa-test-go"
	kiwa_iris "github.com/cardene777/kiwa-test-go/iris"
)

func TestIrisHealth(t *testing.T) {
	app := iris.New()
	app.Get("/health", func(ctx iris.Context) {
		ctx.StatusCode(http.StatusOK)
		ctx.WriteString("ok")
	})

	srv := kiwa_iris.NewTestServer(t, app)
	resp := srv.Request(kiwa.MethodGET, "/health").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusOK)
	kiwa.AssertEqual(t, resp.BodyString(), "ok")
}

func TestIrisPostJSON(t *testing.T) {
	app := iris.New()
	app.Post("/echo", func(ctx iris.Context) {
		ctx.ContentType("application/json")
		ctx.StatusCode(http.StatusCreated)
		body, _ := ctx.GetBody()
		ctx.Write(body)
	})

	srv := kiwa_iris.NewTestServer(t, app)
	resp := srv.Request(kiwa.MethodPOST, "/echo").
		JSON([]byte(`{"a":1}`)).
		Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusCreated)
	kiwa.AssertEqual(t, resp.BodyString(), `{"a":1}`)
}
```

## Test 2 — Chi

`chi_test.go`:

```go
package main

import (
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"

	kiwa "github.com/cardene777/kiwa-test-go"
	kiwa_chi "github.com/cardene777/kiwa-test-go/chi"
)

func TestChiHealth(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	srv := kiwa_chi.NewTestServer(t, r)
	resp := srv.Request(kiwa.MethodGET, "/health").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusOK)
	kiwa.AssertEqual(t, resp.BodyString(), "ok")
}

func TestChiRecordedRequests(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/x", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})

	srv := kiwa_chi.NewTestServer(t, r)
	srv.Request(kiwa.MethodGET, "/x").Send()
	srv.Request(kiwa.MethodGET, "/x").Header("X-Tag", "kiwa").Send()

	kiwa.AssertEqual(t, srv.RequestCount(), 2)
	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, recorded[1].Headers["x-tag"], "kiwa")
}
```

Run both:

```bash
go test ./...
```

## 5 Go frameworks now covered

`kiwa-test-go` v0.5 covers **all five** major Go web frameworks under one `TestServer` contract:

| framework | driver | subpackage |
|---|---|---|
| Gin | `engine.ServeHTTP` | `kiwa-test-go/gin` |
| Echo | `echo.ServeHTTP` | `kiwa-test-go/echo` |
| Fiber | `app.Test` (fasthttp) | `kiwa-test-go/fiber` |
| **Iris** (new) | `app.ServeHTTP` + lazy `app.Build()` | `kiwa-test-go/iris` |
| **Chi** (new) | `r.ServeHTTP` (raw http.Handler) | `kiwa-test-go/chi` |

Migrating a service from one framework to another? The test suite stays intact — only the `NewTestServer` line changes.

## Related

- [`kiwa-test-go` on pkg.go.dev](https://pkg.go.dev/github.com/cardene777/kiwa-test-go)
- [Migration guide v1.13 → v1.14](../migrations/v1.13-to-v1.14)
