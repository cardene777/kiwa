// Package kiwa_iris: Iris (kataras/iris/v12) web framework test adapter.
//
// NewTestServer wraps an *iris.Application in a TestServer that drives
// requests in-process by calling app.Build() (compiles the router into
// an http.Handler) and dispatching via httptest.NewRecorder. Same design
// as the v1.5+ gin / echo / fiber adapters.
//
// # Contract
//
//   - NewTestServer(t, app) returns a *TestServer that owns the app and
//     a request recorder; cleanup is wired through t.Cleanup.
//   - srv.Request(method, path) returns a *Request builder with the
//     same chaining API as gin / echo / fiber / chi.
//   - srv.Send returns a *Response with the same helper set.
//
// # Example
//
//	import (
//	    "testing"
//
//	    "github.com/kataras/iris/v12"
//
//	    "github.com/cardene777/kiwa-test-go"
//	    kiwa_iris "github.com/cardene777/kiwa-test-go/iris"
//	)
//
//	func TestHealth(t *testing.T) {
//	    app := iris.New()
//	    app.Get("/health", func(ctx iris.Context) {
//	        ctx.WriteString("ok")
//	    })
//
//	    srv := kiwa_iris.NewTestServer(t, app)
//	    resp := srv.Request(kiwa.MethodGET, "/health").Send()
//	    kiwa.AssertEqual(t, resp.StatusCode(), 200)
//	    kiwa.AssertEqual(t, resp.BodyString(), "ok")
//	}
package kiwa_iris

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/kataras/iris/v12"

	"github.com/cardene777/kiwa-test-go"
	"github.com/cardene777/kiwa-test-go/internal/recorder"
)

type TestServer struct {
	app      *iris.Application
	recorder *recorder.Log
	t        testing.TB
	stopped  bool
	stopMu   sync.Mutex
	buildMu  sync.Mutex
	built    bool
}

func (s *TestServer) App() *iris.Application { return s.app }

func (s *TestServer) RecordedRequests() []kiwa.RecordedRequest {
	return s.recorder.Snapshot()
}

func (s *TestServer) RequestCount() int { return s.recorder.Count() }

func (s *TestServer) IsStopped() bool {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	return s.stopped
}

func (s *TestServer) Stop() {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	if s.stopped {
		return
	}
	s.stopped = true
}

func (s *TestServer) Request(method kiwa.HTTPMethod, path string) *Request {
	return &Request{
		server:  s,
		method:  method,
		path:    path,
		headers: make(map[string]string),
	}
}

// buildOnce lazily builds the iris app so route registrations before the
// first Send() actually land in the router. iris's Build() is idempotent
// per-app but we guard it so parallel Send() bodies do not race.
func (s *TestServer) buildOnce() error {
	s.buildMu.Lock()
	defer s.buildMu.Unlock()
	if s.built {
		return nil
	}
	if err := s.app.Build(); err != nil {
		return err
	}
	s.built = true
	return nil
}

type Request struct {
	server  *TestServer
	method  kiwa.HTTPMethod
	path    string
	headers map[string]string
	body    []byte
}

func (r *Request) Header(key, value string) *Request {
	r.headers[http.CanonicalHeaderKey(key)] = value
	return r
}

func (r *Request) Body(body []byte) *Request {
	r.body = cloneRequestBody(body)
	return r
}

func (r *Request) JSON(body []byte) *Request {
	r.body = cloneRequestBody(body)
	r.headers[http.CanonicalHeaderKey("Content-Type")] = "application/json"
	return r
}

func cloneRequestBody(body []byte) []byte {
	out := make([]byte, len(body))
	copy(out, body)
	return out
}

func (r *Request) Send() *Response {
	if r.server.IsStopped() {
		r.server.t.Helper()
		r.server.t.Fatalf(
			"kiwa-iris: Send() called after Stop() — post-Stop traffic is a bug (request: %s %s)",
			r.method.String(), r.path,
		)
		return nil
	}

	if err := r.server.buildOnce(); err != nil {
		r.server.t.Helper()
		r.server.t.Fatalf("kiwa-iris: app.Build failed: %v", err)
		return nil
	}

	req, err := http.NewRequest(r.method.String(), r.path, bytes.NewReader(r.body))
	if err != nil {
		r.server.t.Helper()
		r.server.t.Fatalf(
			"kiwa-iris: build request %s %s: %v",
			r.method.String(), r.path, err,
		)
		return nil
	}
	for k, v := range r.headers {
		req.Header.Set(k, v)
	}

	recorded := recorder.FromClient(req, r.body)
	r.server.recorder.Append(recorded)

	w := httptest.NewRecorder()
	r.server.app.ServeHTTP(w, req)

	result := w.Result()
	defer result.Body.Close()
	bodyBytes, _ := io.ReadAll(result.Body)
	cookies := result.Cookies()

	headers := make(map[string]string, len(result.Header))
	headersAll := make(map[string][]string, len(result.Header))
	for k, v := range result.Header {
		if len(v) == 0 {
			continue
		}
		lowerKey := strings.ToLower(k)
		headers[lowerKey] = v[len(v)-1]
		valuesCopy := make([]string, len(v))
		copy(valuesCopy, v)
		headersAll[lowerKey] = valuesCopy
	}

	return &Response{
		statusCode: result.StatusCode,
		headers:    headers,
		headersAll: headersAll,
		cookies:    cookies,
		body:       bodyBytes,
	}
}

type Response struct {
	statusCode int
	headers    map[string]string
	headersAll map[string][]string
	cookies    []*http.Cookie
	body       []byte
}

func (r *Response) StatusCode() int { return r.statusCode }

func (r *Response) Headers() map[string]string {
	out := make(map[string]string, len(r.headers))
	for k, v := range r.headers {
		out[k] = v
	}
	return out
}

func (r *Response) HeadersAll() map[string][]string {
	out := make(map[string][]string, len(r.headersAll))
	for k, v := range r.headersAll {
		valuesCopy := make([]string, len(v))
		copy(valuesCopy, v)
		out[k] = valuesCopy
	}
	return out
}

func (r *Response) HeadersAllValues(key string) []string {
	values, ok := r.headersAll[strings.ToLower(key)]
	if !ok {
		return nil
	}
	out := make([]string, len(values))
	copy(out, values)
	return out
}

func (r *Response) Cookies() []*http.Cookie {
	out := make([]*http.Cookie, len(r.cookies))
	copy(out, r.cookies)
	return out
}

func (r *Response) Body() []byte {
	out := make([]byte, len(r.body))
	copy(out, r.body)
	return out
}

func (r *Response) BodyString() string { return string(r.body) }

func (r *Response) JSON(target any) error { return json.Unmarshal(r.body, target) }

func NewTestServer(t testing.TB, app *iris.Application) *TestServer {
	t.Helper()
	if app == nil {
		t.Fatalf("kiwa-iris: NewTestServer requires a non-nil *iris.Application")
	}
	srv := &TestServer{
		app:      app,
		recorder: &recorder.Log{},
		t:        t,
	}
	t.Cleanup(srv.Stop)
	return srv
}
