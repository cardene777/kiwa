// Package kiwa_echo: Echo web framework test adapter.
//
// NewTestServer wraps a *echo.Echo in a TestServer that drives requests
// in-process through echo's http.Handler interface (httptest.NewRecorder +
// e.ServeHTTP), so tests stay free of real port binding, TIME_WAIT
// flakiness, and parallel go test port clashes — the same trade-off Echo's
// own testing docs use for handler-level integration tests
// (https://echo.labstack.com/docs/testing).
//
// # Contract
//
//   - NewTestServer(t, e) returns a *TestServer that owns the *echo.Echo
//     and a request recorder; cleanup is wired through t.Cleanup so tests
//     cannot leak fixtures.
//   - srv.Request(method, path) builds a *Request that chains
//     .Header(k, v) / .Body(b) / .JSON(b) / .Send() — mirroring the v1.4
//     kiwa.NewMockServer ergonomics and the v0.2 Gin adapter (typed method
//     enum + Route-style API) so polyglot Layer 1 specs read the same
//     shape across languages.
//   - srv.Send returns a *Response with StatusCode() / Headers() / Body()
//     / BodyString() / JSON() — buffered up front so assertions cannot
//     race the handler goroutine.
//   - srv.RecordedRequests() returns []kiwa.RecordedRequest (the v1.4
//     shape, re-exported so callers do not import two packages just to
//     read a recorded request).
//
// # Why in-process (no real port)
//
// Driving the Echo instance through ServeHTTP keeps tests free of
// TIME_WAIT flakiness, port-clash on parallel go test runs, and the extra
// HTTP framing round-trip — the same trade-off the official Echo testing
// docs use for handler unit tests. When a test needs a real network
// endpoint (e.g. the production code under test resolves the URL through
// a config flag) reach for v1.4 kiwa.NewMockServer or compose both
// adapters in the same test body (the recorder shapes match).
//
// # Example
//
//	import (
//	    "net/http"
//	    "testing"
//
//	    "github.com/labstack/echo/v4"
//
//	    "github.com/cardene777/kiwa-test-go"
//	    kiwa_echo "github.com/cardene777/kiwa-test-go/echo"
//	)
//
//	func TestHealth(t *testing.T) {
//	    e := echo.New()
//	    e.GET("/health", func(c echo.Context) error {
//	        return c.String(http.StatusOK, "ok")
//	    })
//
//	    srv := kiwa_echo.NewTestServer(t, e)
//	    resp := srv.Request(kiwa.MethodGET, "/health").Send()
//	    kiwa.AssertEqual(t, resp.StatusCode(), 200)
//	    kiwa.AssertEqual(t, resp.BodyString(), "ok")
//	}
package kiwa_echo

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/cardene777/kiwa-test-go"
	"github.com/cardene777/kiwa-test-go/internal/recorder"
)

// TestServer is the running Echo test harness returned by NewTestServer.
//
// It owns the *echo.Echo and a request recorder that captures every
// request the harness dispatches (both routed and unrouted). The recorder
// is guarded by a mutex so parallel test bodies firing Send() concurrently
// cannot tear writes against RecordedRequests() reads.
//
// # Lifecycle
//
// The kiwa fixture contract is build → exercise → Stop (mirrors v1.4
// kiwa.NewMockServer). Callers can either call Stop explicitly or rely on
// the t.Cleanup handler registered by NewTestServer. Stop is idempotent.
// Once Stop has run subsequent Send() calls report the lifecycle
// violation through t.Fatalf so post-Stop traffic surfaces as a diagnostic
// test failure instead of silently hitting the retired Echo instance —
// matching the v1.4 mock_server contract where post-Stop traffic hits a
// closed port and fails at the transport layer.
type TestServer struct {
	echo     *echo.Echo
	recorder *recorder.Log
	// t is the testing.TB handle captured at NewTestServer so Send() can
	// route post-Stop lifecycle violations through t.Fatalf. Storing it
	// on the server (rather than passing it through the RequestBuilder)
	// keeps the fluent .Request(...).Send() call chain unchanged while
	// still giving Send() a way to fail the test with a full stack.
	t       testing.TB
	stopped bool
	stopMu  sync.Mutex
}

// Echo returns the wrapped *echo.Echo so tests can register additional
// routes after construction (mirrors echo's own testing idiom where the
// Echo instance is mutated through the test setup).
func (s *TestServer) Echo() *echo.Echo {
	return s.echo
}

// RecordedRequests returns a snapshot of every request the harness has
// dispatched so far. The slice is freshly allocated and every Body /
// HeadersAll value is deep-copied so callers may iterate and mutate
// without racing concurrent Send() calls or corrupting the recorder
// log (parity with kiwa-rs Vec<u8>::clone, v1.6-2 hazard 2).
func (s *TestServer) RecordedRequests() []kiwa.RecordedRequest {
	return s.recorder.Snapshot()
}

// RequestCount reports how many requests the harness has dispatched.
func (s *TestServer) RequestCount() int {
	return s.recorder.Count()
}

// IsStopped reports whether Stop has run (either explicitly or through
// the t.Cleanup handler registered by NewTestServer). Test bodies rarely
// need this — it exists so specs that exercise the lifecycle contract
// explicitly do not have to trap the post-Stop t.Fatalf inside Send() to
// observe stopped state.
func (s *TestServer) IsStopped() bool {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	return s.stopped
}

// Stop releases the harness. Idempotent — t.Cleanup invokes this too, so
// an explicit Stop followed by cleanup is safe. v0.2 has no real port to
// release; Stop is kept on the surface so the lifecycle matches v1.4
// kiwa.NewMockServer (build → exercise → Stop) and future versions can
// add resources without breaking the contract.
//
// Once Stop has run subsequent Send() calls fail the test with
// t.Fatalf so post-Stop traffic surfaces as a diagnostic failure — see
// the TestServer godoc "Lifecycle" section.
func (s *TestServer) Stop() {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	if s.stopped {
		return
	}
	s.stopped = true
}

// Request starts building an in-process request against the wrapped Echo
// instance. Path must start with "/" — Echo's matcher only accepts
// absolute paths and we surface that constraint at the kiwa layer so
// test failures stay readable.
func (s *TestServer) Request(method kiwa.HTTPMethod, path string) *Request {
	return &Request{
		server:  s,
		method:  method,
		path:    path,
		headers: make(map[string]string),
	}
}

// Request is a builder for a single in-process Echo request. Chain
// .Header / .Body / .JSON then call .Send.
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
//
// The body slice is defensively copied at ingress so callers reusing the
// underlying buffer between .Body(buf) and .Send() (or across multiple
// Send() calls) cannot retroactively mutate the wire payload the
// recorder captured. v1.6-2 (Issue #608) hazard 3.
func (r *Request) Body(body []byte) *Request {
	r.body = cloneRequestBody(body)
	return r
}

// JSON sets the request body to a pre-serialised JSON payload and adds the
// Content-Type header. Callers serialise the value themselves with
// encoding/json so the adapter stays dependency-light.
//
// Same ingress defensive copy discipline as Body — see the Body godoc.
func (r *Request) JSON(body []byte) *Request {
	r.body = cloneRequestBody(body)
	r.headers[http.CanonicalHeaderKey("Content-Type")] = "application/json"
	return r
}

// cloneRequestBody defensively copies the caller's request body slice at
// builder ingress so buffer reuse between .Body/.JSON and .Send cannot
// retroactively mutate the wire payload (v1.6-2 hazard 3).
func cloneRequestBody(body []byte) []byte {
	out := make([]byte, len(body))
	copy(out, body)
	return out
}

// Send drives the Echo instance with the built request and buffers the
// response. The recorder captures the outbound request before dispatch
// so a panicking handler does not lose the trace.
//
// If the wrapping TestServer has already been stopped (either via an
// explicit srv.Stop() call or through the t.Cleanup handler registered by
// NewTestServer) Send() reports the lifecycle violation through
// t.Fatalf — post-Stop traffic is a bug in the test and surfacing it as a
// diagnostic failure matches the v1.4 mock_server contract where
// post-Stop traffic hits a closed port and fails at the transport layer.
// Send returns nil in that path so any accidental chained assertion on the
// returned *Response fails loudly with a nil-pointer stack instead of
// silently reading the retired engine.
//
// Send routes http.NewRequest failures (malformed method / path, unparseable
// URL, etc.) through the captured testing.TB Fatalf handle so the failure
// surfaces as a diagnostic test result with a clean stack — matching the
// v1.6-3 post-Stop path and v1.4 NewMockServer failure ergonomics. Panic
// escapes go test's per-test isolation and prints a runtime stack rather
// than a test failure; t.Fatalf gives the developer the file:line of the
// offending Send call and lets the harness report through the standard
// test-failure channel. Send returns nil in that path so any accidental
// chained assertion on the returned *Response fails loudly with a
// nil-pointer stack instead of continuing with a half-built request.
func (r *Request) Send() *Response {
	if r.server.IsStopped() {
		r.server.t.Helper()
		r.server.t.Fatalf(
			"kiwa-echo: Send() called after Stop() — lifecycle contract requires build → exercise → Stop, post-Stop traffic is a bug (request: %s %s)",
			r.method.String(), r.path,
		)
		return nil
	}

	req, err := http.NewRequest(r.method.String(), r.path, bytes.NewReader(r.body))
	if err != nil {
		r.server.t.Helper()
		r.server.t.Fatalf(
			"kiwa-echo: build request %s %s: %v",
			r.method.String(), r.path, err,
		)
		return nil
	}
	for k, v := range r.headers {
		req.Header.Set(k, v)
	}

	// Record the request before dispatch so the recorder reflects observed
	// traffic even if the handler panics. Request-to-Snapshot conversion
	// is delegated to internal/recorder.FromClient — the single SSOT
	// shared with kiwa root and kiwa/gin (v1.6-5, Issue #611).
	recorded := recorder.FromClient(req, r.body)
	r.server.recorder.Append(recorded)

	w := httptest.NewRecorder()
	r.server.echo.ServeHTTP(w, req)

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
// racing the Echo handler that produced them.
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

// NewTestServer wraps e in a TestServer and registers t.Cleanup to
// release the harness when the test finishes.
//
// NewTestServer accepts testing.TB so it works inside *testing.T,
// *testing.B, and *testing.F bodies, and calls t.Helper so failure stack
// frames point at the caller.
//
// Echo logs to stdout by default; tests that want silence can call
// e.Logger.SetOutput(io.Discard) per Echo instance (typically inside the
// test helper that builds each *echo.Echo). Unlike gin.SetMode, echo has
// no global-mode toggle, so silencing must happen per instance — kiwa
// does not touch echo's logger so production behaviour stays untouched.
//
// # Example
//
//	e := echo.New()
//	e.GET("/users", listUsersHandler)
//
//	srv := kiwa_echo.NewTestServer(t, e)
//	resp := srv.Request(kiwa.MethodGET, "/users?limit=10").
//	    Header("X-Tag", "kiwa-poc").
//	    Send()
//	kiwa.AssertEqual(t, resp.StatusCode(), 200)
func NewTestServer(t testing.TB, e *echo.Echo) *TestServer {
	t.Helper()
	if e == nil {
		t.Fatalf("kiwa-echo: NewTestServer requires a non-nil *echo.Echo")
	}

	srv := &TestServer{
		echo:     e,
		recorder: &recorder.Log{},
		t:        t,
	}
	t.Cleanup(srv.Stop)
	return srv
}
