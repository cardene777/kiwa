package kiwa_iris_test

import (
	"net/http"
	"testing"

	"github.com/kataras/iris/v12"

	kiwa "github.com/cardene777/kiwa-test-go"
	kiwa_iris "github.com/cardene777/kiwa-test-go/iris"
)

func TestIrisBasicGet(t *testing.T) {
	app := iris.New()
	app.Get("/health", func(ctx iris.Context) {
		ctx.StatusCode(http.StatusOK)
		if _, err := ctx.WriteString("ok"); err != nil {
			t.Fatalf("write: %v", err)
		}
	})

	srv := kiwa_iris.NewTestServer(t, app)
	resp := srv.Request(kiwa.MethodGET, "/health").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusOK)
	kiwa.AssertEqual(t, resp.BodyString(), "ok")
}

func TestIrisPostWithJSONBody(t *testing.T) {
	app := iris.New()
	app.Post("/echo", func(ctx iris.Context) {
		ctx.ContentType("application/json")
		ctx.StatusCode(http.StatusCreated)
		body, err := ctx.GetBody()
		if err != nil {
			t.Fatalf("read: %v", err)
		}
		if _, err := ctx.Write(body); err != nil {
			t.Fatalf("write: %v", err)
		}
	})

	srv := kiwa_iris.NewTestServer(t, app)
	resp := srv.Request(kiwa.MethodPOST, "/echo").
		JSON([]byte(`{"a":1}`)).
		Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusCreated)
	kiwa.AssertEqual(t, resp.BodyString(), `{"a":1}`)
}

func TestIrisRecordedRequests(t *testing.T) {
	app := iris.New()
	app.Get("/x", func(ctx iris.Context) {
		ctx.StatusCode(http.StatusNoContent)
	})

	srv := kiwa_iris.NewTestServer(t, app)
	srv.Request(kiwa.MethodGET, "/x").Send()
	srv.Request(kiwa.MethodGET, "/x").Header("X-Tag", "kiwa").Send()

	kiwa.AssertEqual(t, srv.RequestCount(), 2)
	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, len(recorded), 2)
	kiwa.AssertEqual(t, recorded[1].Headers["x-tag"], "kiwa")
}
