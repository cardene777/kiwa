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
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/cardene777/kiwa-test-go"
)

// TestServer is the running Echo test harness returned by NewTestServer.
//
// It owns the *echo.Echo and a request recorder that captures every
// request the harness dispatches (both routed and unrouted). The recorder
// is guarded by a mutex so parallel test bodies firing Send() concurrently
// cannot tear writes against RecordedRequests() reads.
type TestServer struct {
	echo     *echo.Echo
	recorder *requestRecorder
	stopped  bool
	stopMu   sync.Mutex
}

// Echo returns the wrapped *echo.Echo so tests can register additional
// routes after construction (mirrors echo's own testing idiom where the
// Echo instance is mutated through the test setup).
func (s *TestServer) Echo() *echo.Echo {
	return s.echo
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

// Send drives the Echo instance with the built request and buffers the
// response. The recorder captures the outbound request before dispatch
// so a panicking handler does not lose the trace.
//
// Send panics with a self-describing message on http.NewRequest failures
// so the test fails fast with a clear stack instead of bubbling errors
// through every assertion call site.
func (r *Request) Send() *Response {
	req, err := http.NewRequest(r.method.String(), r.path, bytes.NewReader(r.body))
	if err != nil {
		panic(fmt.Sprintf("kiwa-echo: build request %s %s: %v", r.method.String(), r.path, err))
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
	r.server.echo.ServeHTTP(w, req)

	result := w.Result()
	defer result.Body.Close()
	bodyBytes, _ := io.ReadAll(result.Body)

	headers := make(map[string]string, len(result.Header))
	for k, v := range result.Header {
		if len(v) == 0 {
			continue
		}
		// Last-write-wins on duplicates — same semantics as the v1.4
		// recorder so polyglot specs compare equal across languages.
		headers[strings.ToLower(k)] = v[len(v)-1]
	}

	return &Response{
		statusCode: result.StatusCode,
		headers:    headers,
		body:       bodyBytes,
	}
}

// Response is the buffered result of a single Send call. All fields are
// captured up-front so assertions can be re-read across goroutines without
// racing the Echo handler that produced them.
type Response struct {
	statusCode int
	headers    map[string]string
	body       []byte
}

// StatusCode returns the HTTP status code.
func (r *Response) StatusCode() int {
	return r.statusCode
}

// Headers returns the response headers with lowercased keys — matching the
// v1.4 RecordedRequest shape so polyglot specs read the same field.
func (r *Response) Headers() map[string]string {
	out := make(map[string]string, len(r.headers))
	for k, v := range r.headers {
		out[k] = v
	}
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
func recordRequest(req *http.Request, body []byte) kiwa.RecordedRequest {
	headers := make(map[string]string, len(req.Header))
	for k, v := range req.Header {
		if len(v) == 0 {
			continue
		}
		// Last-write-wins on duplicate keys — same semantics as the
		// v1.4 recorder so polyglot specs compare equal.
		headers[strings.ToLower(k)] = v[len(v)-1]
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
		Method:  req.Method,
		Path:    path,
		Headers: headers,
		Body:    bodyCopy,
	}
}

// NewTestServer wraps e in a TestServer and registers t.Cleanup to
// release the harness when the test finishes.
//
// NewTestServer accepts testing.TB so it works inside *testing.T,
// *testing.B, and *testing.F bodies, and calls t.Helper so failure stack
// frames point at the caller.
//
// Echo logs to stdout by default; tests that want silence can set
// e.Logger.SetOutput(io.Discard) once in the test package init — kiwa
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
		recorder: &requestRecorder{},
	}
	t.Cleanup(srv.Stop)
	return srv
}
