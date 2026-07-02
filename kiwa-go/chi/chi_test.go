package kiwa_chi_test

import (
	"net/http"
	"testing"

	"github.com/go-chi/chi/v5"

	kiwa "github.com/cardene777/kiwa-test-go"
	kiwa_chi "github.com/cardene777/kiwa-test-go/chi"
)

func TestChiBasicGet(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/health", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte("ok")); err != nil {
			t.Fatalf("write: %v", err)
		}
	})

	srv := kiwa_chi.NewTestServer(t, r)
	resp := srv.Request(kiwa.MethodGET, "/health").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusOK)
	kiwa.AssertEqual(t, resp.BodyString(), "ok")
}

func TestChiPostWithJSONBody(t *testing.T) {
	r := chi.NewRouter()
	r.Post("/echo", func(w http.ResponseWriter, req *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		body := make([]byte, req.ContentLength)
		if _, err := req.Body.Read(body); err != nil && err.Error() != "EOF" {
			t.Fatalf("read: %v", err)
		}
		if _, err := w.Write(body); err != nil {
			t.Fatalf("write: %v", err)
		}
	})

	srv := kiwa_chi.NewTestServer(t, r)
	resp := srv.Request(kiwa.MethodPOST, "/echo").
		JSON([]byte(`{"a":1}`)).
		Send()
	kiwa.AssertEqual(t, resp.StatusCode(), http.StatusCreated)
	kiwa.AssertEqual(t, resp.BodyString(), `{"a":1}`)
	kiwa.AssertEqual(t, resp.Headers()["content-type"], "application/json")
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
	kiwa.AssertEqual(t, len(recorded), 2)
	kiwa.AssertEqual(t, recorded[1].Headers["x-tag"], "kiwa")
}

func TestChiPostStopReturnsFatal(t *testing.T) {
	r := chi.NewRouter()
	r.Get("/x", func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	srv := kiwa_chi.NewTestServer(t, r)
	srv.Stop()
	kiwa.AssertEqual(t, srv.IsStopped(), true)

	// send after stop — the t.Fatalf inside Send will fail the SUBTEST
	// but we can wrap it in a mock testing.TB to assert.
	sub := t.Run("post-stop-fails", func(t *testing.T) {
		defer func() {
			if recover() != nil {
				// expected; do nothing
			}
		}()
		mock := &fatalRecorder{TB: t}
		srv2 := kiwa_chi.NewTestServer(mock, r)
		srv2.Stop()
		srv2.Request(kiwa.MethodGET, "/x").Send()
		if !mock.fatal {
			t.Fatalf("expected Fatalf after Stop()")
		}
	})
	_ = sub
}

type fatalRecorder struct {
	testing.TB
	fatal bool
}

func (f *fatalRecorder) Fatalf(format string, args ...any) {
	f.fatal = true
	panic("fatal")
}

func (f *fatalRecorder) Helper() {}
