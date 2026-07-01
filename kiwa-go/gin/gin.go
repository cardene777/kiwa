// Package kiwa_gin: Gin web framework test adapter.
//
// NewTestServer wraps a *gin.Engine in a TestServer that drives requests
// in-process through gin's http.Handler interface (httptest.NewRecorder +
// engine.ServeHTTP), so tests stay free of real port binding, TIME_WAIT
// flakiness, and parallel go test port clashes — the same trade-off gin's
// own testing docs use for handler-level integration tests.
//
// # Contract
//
//   - NewTestServer(t, engine) returns a *TestServer that owns the engine
//     and a request recorder; cleanup is wired through t.Cleanup so tests
//     cannot leak fixtures.
//   - srv.Request(method, path) builds a *Request that chains
//     .Header(k, v) / .Body(b) / .JSON(b) / .Send() — mirroring the v1.4
//     kiwa.NewMockServer ergonomics (typed method enum + Route-style API)
//     so polyglot Layer 1 specs read the same shape across languages.
//   - srv.Send returns a *Response with StatusCode() / Headers() / Body()
//     / BodyString() / JSON() — buffered up front so assertions cannot
//     race the handler goroutine.
//   - srv.RecordedRequests() returns []kiwa.RecordedRequest (the v1.4
//     shape, re-exported so callers do not import two packages just to
//     read a recorded request).
//
// # Why in-process (no real port)
//
// Driving the engine through ServeHTTP keeps tests free of TIME_WAIT
// flakiness, port-clash on parallel go test runs, and the extra HTTP
// framing round-trip — the same trade-off the official gin docs use for
// handler unit tests. When a test needs a real network endpoint (e.g.
// the production code under test resolves the URL through a config flag)
// reach for v1.4 kiwa.NewMockServer or compose both adapters in the same
// test body (the recorder shapes match).
//
// # Example
//
//	import (
//	    "net/http"
//	    "testing"
//
//	    "github.com/gin-gonic/gin"
//
//	    "github.com/cardene777/kiwa-test-go"
//	    kiwa_gin "github.com/cardene777/kiwa-test-go/gin"
//	)
//
//	func TestHealth(t *testing.T) {
//	    gin.SetMode(gin.TestMode)
//	    engine := gin.New()
//	    engine.GET("/health", func(c *gin.Context) {
//	        c.String(http.StatusOK, "ok")
//	    })
//
//	    srv := kiwa_gin.NewTestServer(t, engine)
//	    resp := srv.Request(kiwa.MethodGET, "/health").Send()
//	    kiwa.AssertEqual(t, resp.StatusCode(), 200)
//	    kiwa.AssertEqual(t, resp.BodyString(), "ok")
//	}
package kiwa_gin

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/cardene777/kiwa-test-go"
)

// TestServer is the running gin test harness returned by NewTestServer.
//
// It owns the *gin.Engine and a request recorder that captures every
// request the harness dispatches (both routed and unrouted). The recorder
// is guarded by a mutex so parallel test bodies firing Send() concurrently
// cannot tear writes against RecordedRequests() reads.
type TestServer struct {
	engine   *gin.Engine
	recorder *requestRecorder
	stopped  bool
	stopMu   sync.Mutex
}

// Engine returns the wrapped *gin.Engine so tests can register additional
// routes after construction (mirrors gin's own testing idiom where the
// engine is mutated through the test setup).
func (s *TestServer) Engine() *gin.Engine {
	return s.engine
}

// RecordedRequests returns a snapshot of every request the harness has
// dispatched so far. The slice is freshly allocated so callers may iterate
// without racing concurrent Send() calls.
func (s *TestServer) RecordedRequests() []kiwa.RecordedRequest {
	return s.recorder.snapshot()
}

// RequestCount reports how many requests the harness has dispatched.
func (s *TestServer) RequestCount() int {
	return s.recorder.count()
}

// Stop releases the harness. Idempotent — t.Cleanup invokes this too, so
// an explicit Stop followed by cleanup is safe. v0.2 has no real port to
// release; Stop is kept on the surface so the lifecycle matches v1.4
// kiwa.NewMockServer (build → exercise → Stop) and future versions can
// add resources without breaking the contract.
func (s *TestServer) Stop() {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	if s.stopped {
		return
	}
	s.stopped = true
}

// Request starts building an in-process request against the wrapped
// engine. Path must start with "/" — gin's matcher only accepts absolute
// paths and we surface that constraint at the kiwa layer so test failures
// stay readable.
func (s *TestServer) Request(method kiwa.HTTPMethod, path string) *Request {
	return &Request{
		server:  s,
		method:  method,
		path:    path,
		headers: make(map[string]string),
	}
}

// Request is a builder for a single in-process gin request. Chain .Header
// / .Body / .JSON then call .Send.
type Request struct {
	server  *TestServer
	method  kiwa.HTTPMethod
	path    string
	headers map[string]string
	body    []byte
}

// Header sets a request header. Keys are canonicalized via
// http.CanonicalHeaderKey so .Header("content-type", ...) and
// .Header("Content-Type", ...) collide on the same slot, preventing
// non-deterministic last-write-wins between mixed-case duplicates.
// Last-write-wins on the canonical key matches v1.4 recorder semantics.
func (r *Request) Header(key, value string) *Request {
	r.headers[http.CanonicalHeaderKey(key)] = value
	return r
}

// Body sets the request body from raw bytes.
func (r *Request) Body(body []byte) *Request {
	r.body = body
	return r
}

// JSON sets the request body to a pre-serialised JSON payload and adds the
// Content-Type header. Callers serialise the value themselves with
// encoding/json so the adapter stays dependency-light.
func (r *Request) JSON(body []byte) *Request {
	r.body = body
	r.headers[http.CanonicalHeaderKey("Content-Type")] = "application/json"
	return r
}

// Send drives the engine with the built request and buffers the response.
// The recorder captures the outbound request before dispatch so a panicking
// handler does not lose the trace.
//
// Send panics with a self-describing message on http.NewRequest failures
// so the test fails fast with a clear stack instead of bubbling errors
// through every assertion call site.
func (r *Request) Send() *Response {
	req, err := http.NewRequest(r.method.String(), r.path, bytes.NewReader(r.body))
	if err != nil {
		panic(fmt.Sprintf("kiwa-gin: build request %s %s: %v", r.method.String(), r.path, err))
	}
	for k, v := range r.headers {
		req.Header.Set(k, v)
	}

	// Record the request before dispatch so the recorder reflects observed
	// traffic even if the handler panics. We capture from the freshly built
	// *http.Request to mirror the v1.4 server-side recorder shape.
	recorded := recordRequest(req, r.body)
	r.server.recorder.append(recorded)

	w := httptest.NewRecorder()
	r.server.engine.ServeHTTP(w, req)

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
		// Last-write-wins on duplicates — same semantics as the v1.4
		// recorder so polyglot specs compare equal across languages.
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

// Response is the buffered result of a single Send call. All fields are
// captured up-front so assertions can be re-read across goroutines without
// racing the gin handler that produced them.
//
// Two header views coexist: Headers is a single-value map[string]string kept
// for backward compatibility with pre-v1.6 assertions, HeadersAll is a
// map[string][]string that preserves every recorded value in wire order so
// multi-value headers (Set-Cookie, WWW-Authenticate, Vary, Link, ...) can be
// asserted verbatim. Cookies is parsed from the Set-Cookie lines via
// net/http/httptest.ResultRecorder.Cookies so callers can assert on cookie
// attributes without re-parsing the header string.
type Response struct {
	statusCode int
	headers    map[string]string
	headersAll map[string][]string
	cookies    []*http.Cookie
	body       []byte
}

// StatusCode returns the HTTP status code.
func (r *Response) StatusCode() int {
	return r.statusCode
}

// Headers returns the response headers with lowercased keys, last-write-wins
// on duplicates — matches the v1.4 RecordedRequest shape so polyglot specs
// read the same field. For multi-value headers (Set-Cookie in particular)
// use HeadersAll or Cookies.
func (r *Response) Headers() map[string]string {
	out := make(map[string]string, len(r.headers))
	for k, v := range r.headers {
		out[k] = v
	}
	return out
}

// HeadersAll returns every recorded header value in wire order, keys
// lowercased. Returns a fresh map + slices so callers can mutate the result
// without corrupting the recorder view of the same Response.
func (r *Response) HeadersAll() map[string][]string {
	out := make(map[string][]string, len(r.headersAll))
	for k, v := range r.headersAll {
		valuesCopy := make([]string, len(v))
		copy(valuesCopy, v)
		out[k] = valuesCopy
	}
	return out
}

// HeadersAllValues returns every recorded value for key (case-insensitive
// match) in wire order. Returns nil (not an empty slice) when the header was
// not observed so callers can distinguish "absent" from "present but empty".
func (r *Response) HeadersAllValues(key string) []string {
	values, ok := r.headersAll[strings.ToLower(key)]
	if !ok {
		return nil
	}
	out := make([]string, len(values))
	copy(out, values)
	return out
}

// Cookies returns every Set-Cookie value on the response parsed via
// net/http Response.Cookies, so callers can assert on cookie name / value /
// Path / Domain / attributes without re-parsing the raw header string. The
// returned slice is a fresh copy so callers can mutate it safely.
func (r *Response) Cookies() []*http.Cookie {
	out := make([]*http.Cookie, len(r.cookies))
	copy(out, r.cookies)
	return out
}

// Body returns a defensive copy of the response body bytes so callers
// can mutate the returned slice without corrupting later BodyString/JSON
// reads or the recorder's view of the same Response.
func (r *Response) Body() []byte {
	out := make([]byte, len(r.body))
	copy(out, r.body)
	return out
}

// BodyString returns Body interpreted as UTF-8.
func (r *Response) BodyString() string {
	return string(r.body)
}

// JSON decodes the response body into target. Returns the underlying
// json.Unmarshal error so test bodies can assert on it with t.Fatalf.
func (r *Response) JSON(target any) error {
	return json.Unmarshal(r.body, target)
}

// requestRecorder owns the dispatched-request log behind a sync.Mutex so
// concurrent Send calls cannot tear writes.
type requestRecorder struct {
	mu       sync.Mutex
	captured []kiwa.RecordedRequest
}

func (r *requestRecorder) append(req kiwa.RecordedRequest) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.captured = append(r.captured, req)
}

func (r *requestRecorder) snapshot() []kiwa.RecordedRequest {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]kiwa.RecordedRequest, len(r.captured))
	copy(out, r.captured)
	return out
}

func (r *requestRecorder) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.captured)
}

// recordRequest converts an *http.Request + raw body bytes into a
// kiwa.RecordedRequest. The body is taken from the caller-provided slice
// (not re-read from req.Body) so the recorder captures the exact bytes
// dispatched even when the request body reader is single-shot.
//
// Headers is a single-value view (last-write-wins on duplicates); HeadersAll
// preserves every value in wire order so multi-value headers survive the
// recording round trip.
func recordRequest(req *http.Request, body []byte) kiwa.RecordedRequest {
	headers := make(map[string]string, len(req.Header))
	headersAll := make(map[string][]string, len(req.Header))
	for k, v := range req.Header {
		if len(v) == 0 {
			continue
		}
		lowerKey := strings.ToLower(k)
		// Last-write-wins on duplicate keys — same semantics as the
		// v1.4 recorder so polyglot specs compare equal.
		headers[lowerKey] = v[len(v)-1]
		valuesCopy := make([]string, len(v))
		copy(valuesCopy, v)
		headersAll[lowerKey] = valuesCopy
	}

	path := req.URL.Path
	if raw := req.URL.RawQuery; raw != "" {
		path = path + "?" + raw
	}

	// Defensive copy of the body so callers reusing the underlying buffer
	// across Send calls cannot retroactively mutate already-captured
	// RecordedRequest.Body entries.
	bodyCopy := make([]byte, len(body))
	copy(bodyCopy, body)

	return kiwa.RecordedRequest{
		Method:     req.Method,
		Path:       path,
		Headers:    headers,
		HeadersAll: headersAll,
		Body:       bodyCopy,
	}
}

// NewTestServer wraps engine in a TestServer and registers t.Cleanup to
// release the harness when the test finishes.
//
// NewTestServer accepts testing.TB so it works inside *testing.T,
// *testing.B, and *testing.F bodies, and calls t.Helper so failure stack
// frames point at the caller.
//
// gin.SetMode(gin.TestMode) should be called once per test package init
// to silence gin's debug logging during go test runs — kiwa does not
// touch gin's global mode setting so production behaviour is not
// affected.
//
// # Example
//
//	gin.SetMode(gin.TestMode)
//	engine := gin.New()
//	engine.GET("/users", listUsersHandler)
//
//	srv := kiwa_gin.NewTestServer(t, engine)
//	resp := srv.Request(kiwa.MethodGET, "/users?limit=10").
//	    Header("X-Tag", "kiwa-poc").
//	    Send()
//	kiwa.AssertEqual(t, resp.StatusCode(), 200)
func NewTestServer(t testing.TB, engine *gin.Engine) *TestServer {
	t.Helper()
	if engine == nil {
		t.Fatalf("kiwa-gin: NewTestServer requires a non-nil *gin.Engine")
	}

	srv := &TestServer{
		engine:   engine,
		recorder: &requestRecorder{},
	}
	t.Cleanup(srv.Stop)
	return srv
}
