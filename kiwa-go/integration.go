// Package kiwa: integration test helper.
//
// MockServer wraps net/http/httptest.Server with the kiwa fixture contract:
// route table evaluated in registration order, a request recorder that
// captures every request the server sees (matched or not), and automatic
// shutdown via testing.TB.Cleanup so tests cannot forget to release the
// underlying TCP port.
//
// It mirrors the kiwa-test-rs integration::mock_server API 1:1 — same Route
// builder, same MockResponse shape, same recorder semantics — so a multi-
// language Layer 1 spec compiles to either ecosystem without diverging.
//
// # Differentiation vs raw net/http/httptest
//
// httptest.NewServer is already a thin and correct wrapper; kiwa.MockServer
// does not try to hide it. The value added is purely contract:
//
//   - Route table (method + exact path → handler) so a test reads as data
//     rather than as a switch-case wired into a single http.HandlerFunc.
//   - Recorder snapshot — RecordedRequests returns the request log as
//     []RecordedRequest with method / path / headers / body fully captured,
//     including for unmatched routes (which httptest leaves to the caller).
//   - testing.TB.Cleanup integration so port release matches the unit
//     fixture lifecycle (SetupUnitEnv) — one mental model for both layers.
//
// For request matchers richer than "exact method + exact path" (regex, JSON
// path, response sequencing) reach for github.com/h2non/gock or
// github.com/jarcoal/httpmock — both coexist with kiwa fixtures.
package kiwa

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

// HTTPMethod is a Route's HTTP method, expressed as a kiwa-owned enum so test
// code does not have to import net/http just to pick GET vs POST.
type HTTPMethod int

const (
	// MethodGET matches GET requests.
	MethodGET HTTPMethod = iota
	// MethodPOST matches POST requests.
	MethodPOST
	// MethodPUT matches PUT requests.
	MethodPUT
	// MethodPATCH matches PATCH requests.
	MethodPATCH
	// MethodDELETE matches DELETE requests.
	MethodDELETE
	// MethodHEAD matches HEAD requests.
	MethodHEAD
	// MethodOPTIONS matches OPTIONS requests.
	MethodOPTIONS
)

// String returns the canonical HTTP method label (e.g. "GET").
func (m HTTPMethod) String() string {
	switch m {
	case MethodGET:
		return http.MethodGet
	case MethodPOST:
		return http.MethodPost
	case MethodPUT:
		return http.MethodPut
	case MethodPATCH:
		return http.MethodPatch
	case MethodDELETE:
		return http.MethodDelete
	case MethodHEAD:
		return http.MethodHead
	case MethodOPTIONS:
		return http.MethodOptions
	default:
		return "UNKNOWN"
	}
}

// matches reports whether this method enum equals the wire-level HTTP method
// string carried on an *http.Request.
func (m HTTPMethod) matches(wireMethod string) bool {
	return m.String() == wireMethod
}

// RecordedRequest is a snapshot of a single inbound HTTP request observed by
// the mock server.
//
// Headers keys are lowercased (last-write-wins on duplicates) to mirror the
// Rust kiwa-test-rs RecordedRequest shape so a polyglot Layer 1 spec can
// assert identical fields across languages.
type RecordedRequest struct {
	// Method is the wire HTTP method (e.g. "GET").
	Method string
	// Path is the request path including query string (e.g. "/users?id=1").
	Path string
	// Headers are the request headers, keys lowercased.
	Headers map[string]string
	// Body is the raw request body bytes (empty slice if the client sent
	// no body).
	Body []byte
}

// BodyString returns Body interpreted as UTF-8.
func (r RecordedRequest) BodyString() string {
	return string(r.Body)
}

// MockResponse is the response a Route handler returns.
//
// The zero value is a 200 OK with no headers and an empty body — matching
// httptest defaults so callers only spell out the fields they care about.
type MockResponse struct {
	// Status is the HTTP status code. Zero is treated as 200.
	Status int
	// Headers are the response headers (mixed-case keys preserved; net/http
	// normalises them on the wire).
	Headers map[string]string
	// Body is the raw response body bytes.
	Body []byte
}

// OK builds a 200 OK response with the given body.
func OK(body []byte) MockResponse {
	return MockResponse{Status: http.StatusOK, Body: body}
}

// JSON builds a 200 OK response with Content-Type: application/json. The
// caller serialises the value; we merely set the header.
func JSON(body []byte) MockResponse {
	return MockResponse{
		Status:  http.StatusOK,
		Headers: map[string]string{"Content-Type": "application/json"},
		Body:    body,
	}
}

// WithStatus returns a copy of r with the status overridden.
func (r MockResponse) WithStatus(status int) MockResponse {
	r.Status = status
	return r
}

// WithHeader returns a copy of r with header (key, value) inserted. The
// existing Headers map is cloned so callers can safely chain.
func (r MockResponse) WithHeader(key, value string) MockResponse {
	cloned := make(map[string]string, len(r.Headers)+1)
	for k, v := range r.Headers {
		cloned[k] = v
	}
	cloned[key] = value
	r.Headers = cloned
	return r
}

// RouteHandler is the closure type a Route invokes when its (method, path)
// matches an incoming request. The handler receives the recorded snapshot
// (already appended to the recorder before the handler runs) so it can
// inspect headers / body without re-reading the request.
type RouteHandler func(req RecordedRequest) MockResponse

// Route binds (method, path) to a RouteHandler.
//
// Path matching is exact for v0.1 (no glob, no regex); the route table is
// scanned in registration order and the first match wins. This keeps the
// matcher dead-simple and easy to reason about — promotion to richer
// matchers is a v0.2 candidate behind an opt-in builder method.
type Route struct {
	Method  HTTPMethod
	Path    string
	Handler RouteHandler
}

// NewRoute builds a Route from (method, path, handler).
func NewRoute(method HTTPMethod, path string, handler RouteHandler) Route {
	return Route{Method: method, Path: path, Handler: handler}
}

// MockServerOpts configures MockServer.
//
// The zero value is a server with no routes registered — every request 404s
// but is still recorded, which is the right default for tests that only care
// about whether the production code under test fired any HTTP traffic at all.
type MockServerOpts struct {
	// Routes is the route table evaluated in registration order.
	Routes []Route
}

// WithRoute appends route and returns the updated opts (chainable builder
// for call-site readability).
func (o MockServerOpts) WithRoute(route Route) MockServerOpts {
	o.Routes = append(o.Routes, route)
	return o
}

// MockServer is the running mock server handle returned by NewMockServer.
//
// Both Stop and the recorder are safe for concurrent use — Stop guards the
// underlying httptest.Server.Close with a mutex so manual Stop + t.Cleanup
// + parallel test bodies never race, and the recorder protects the
// captured-request log so the server goroutines dispatching incoming
// requests cannot tear writes against RecordedRequests / RequestCount
// reads from the test goroutine.
type MockServer struct {
	server   *httptest.Server
	recorder *requestRecorder
	stopped  bool
	stopMu   sync.Mutex
}

// URL returns the base URL clients should target (e.g. "http://127.0.0.1:54321").
func (s *MockServer) URL() string {
	return s.server.URL
}

// RecordedRequests returns a snapshot of every request the server has seen
// so far. The slice is freshly allocated so callers may iterate without
// racing the server goroutines that own the underlying log.
func (s *MockServer) RecordedRequests() []RecordedRequest {
	return s.recorder.snapshot()
}

// RequestCount reports how many requests the server has received.
func (s *MockServer) RequestCount() int {
	return s.recorder.count()
}

// Stop releases the underlying httptest.Server. Idempotent — t.Cleanup
// invokes this too, so an explicit Stop followed by cleanup is safe.
func (s *MockServer) Stop() {
	s.stopMu.Lock()
	defer s.stopMu.Unlock()
	if s.stopped {
		return
	}
	s.stopped = true
	s.server.Close()
}

// requestRecorder owns the captured-request log behind a sync.Mutex so
// concurrent inbound requests cannot tear writes.
type requestRecorder struct {
	mu       sync.Mutex
	captured []RecordedRequest
}

func (r *requestRecorder) append(req RecordedRequest) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.captured = append(r.captured, req)
}

func (r *requestRecorder) snapshot() []RecordedRequest {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]RecordedRequest, len(r.captured))
	copy(out, r.captured)
	return out
}

func (r *requestRecorder) count() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.captured)
}

// NewMockServer spins up an httptest.Server bound to a fresh ephemeral port
// and registers t.Cleanup to release the port when t finishes.
//
// NewMockServer accepts testing.TB so it works inside *testing.T,
// *testing.B, and *testing.F bodies, and calls t.Helper so failure stack
// frames point at the caller.
//
// # Example
//
//	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
//	    kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
//	        return kiwa.JSON([]byte(`[{"id":1,"name":"sora"}]`))
//	    }),
//	))
//
//	resp, _ := http.Get(srv.URL() + "/users")
//	// ... assert on resp / srv.RecordedRequests() ...
func NewMockServer(t testing.TB, opts MockServerOpts) *MockServer {
	t.Helper()

	recorder := &requestRecorder{}
	// Clone the route table so caller-side mutation of opts.Routes after
	// NewMockServer returns does not affect server behaviour.
	routes := make([]Route, len(opts.Routes))
	copy(routes, opts.Routes)

	handler := buildHandler(recorder, routes)
	server := httptest.NewServer(handler)

	mock := &MockServer{server: server, recorder: recorder}
	t.Cleanup(mock.Stop)
	return mock
}

// buildHandler wires the recorder + route table into a single http.Handler.
// Factored out so unit tests can exercise the dispatcher without binding a
// real port (currently only end-to-end tests exercise it; the factoring
// keeps the option open).
func buildHandler(recorder *requestRecorder, routes []Route) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		// Capture the request before invoking the handler so the recorder
		// reflects observed traffic even if the handler panics or 404s.
		recorded := recordRequest(req)
		recorder.append(recorded)

		for _, route := range routes {
			if route.Method.matches(req.Method) && route.Path == req.URL.Path {
				writeResponse(w, route.Handler(recorded))
				return
			}
		}

		// No route matched — surface a self-describing 404 so accidental
		// rogue requests fail the test rather than hang the caller.
		body := fmt.Sprintf("kiwa mock_server: no route matched %s %s", req.Method, req.URL.Path)
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		_, _ = io.WriteString(w, body)
	})
}

// recordRequest converts an *http.Request into a RecordedRequest. The body
// is fully read; net/http closes the body after the handler returns, so the
// recorder must capture it before that happens.
func recordRequest(req *http.Request) RecordedRequest {
	headers := make(map[string]string, len(req.Header))
	for k, v := range req.Header {
		if len(v) == 0 {
			continue
		}
		// Last-write-wins on duplicate keys — same semantics as the Rust
		// recorder so polyglot specs compare equal.
		headers[strings.ToLower(k)] = v[len(v)-1]
	}

	var body []byte
	if req.Body != nil {
		// Reading the body fully is safe: httptest gives us the raw body
		// reader and the handler is the last consumer.
		buf, err := io.ReadAll(req.Body)
		if err == nil {
			body = buf
		}
		// Restore the body so downstream handlers (currently none, but the
		// recorder may be reused) can re-read it without surprises.
		req.Body = io.NopCloser(bytes.NewReader(body))
	}

	path := req.URL.Path
	if raw := req.URL.RawQuery; raw != "" {
		path = path + "?" + raw
	}

	return RecordedRequest{
		Method:  req.Method,
		Path:    path,
		Headers: headers,
		Body:    body,
	}
}

// writeResponse serialises a MockResponse onto the http.ResponseWriter.
// Headers must be written before WriteHeader; body comes last.
func writeResponse(w http.ResponseWriter, resp MockResponse) {
	for k, v := range resp.Headers {
		w.Header().Set(k, v)
	}
	status := resp.Status
	if status == 0 {
		status = http.StatusOK
	}
	w.WriteHeader(status)
	if len(resp.Body) > 0 {
		_, _ = w.Write(resp.Body)
	}
}
