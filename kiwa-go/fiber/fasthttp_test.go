package kiwa_fiber_test

import (
	"bytes"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"

	"github.com/cardene777/kiwa-test-go"
	kiwa_fiber "github.com/cardene777/kiwa-test-go/fiber"
)

// TestNormalizeRequest_MethodPathHeadersBody verifies that
// NormalizeRequest emits a kiwa.RecordedRequest whose method / path /
// header case-folding / body semantics all match the shape produced by
// the fiber TestServer builder (internal/recorder SSOT). Callers using
// fasthttp direct API (fasthttp.Request built by hand, no *fiber.App
// on the write side) must produce structurally identical snapshots so
// polyglot Layer 1 specs compare equal across languages and adapters.
func TestNormalizeRequest_MethodPathHeadersBody(t *testing.T) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	req.Header.SetMethod("POST")
	req.SetRequestURI("/users?limit=10")
	// Mixed case header set — RequestHeader normalizes to canonical
	// on write, but NormalizeRequest is responsible for lowercasing
	// keys at snapshot time so consumers get the same shape as gin /
	// echo / mock_server recorders (recorder.extractHeaders, v1.6-5).
	req.Header.Set("X-Test-Tag", "kiwa-poc")
	req.Header.Set("Content-Type", "application/json")
	req.SetBody([]byte(`{"name":"sora"}`))

	snap := kiwa_fiber.NormalizeRequest(req)

	if snap.Method != "POST" {
		t.Fatalf("Method = %q, want POST", snap.Method)
	}
	if snap.Path != "/users?limit=10" {
		t.Fatalf("Path = %q, want /users?limit=10", snap.Path)
	}
	if got := snap.Headers["x-test-tag"]; got != "kiwa-poc" {
		t.Fatalf("Headers[x-test-tag] = %q, want kiwa-poc", got)
	}
	if got := snap.Headers["content-type"]; got != "application/json" {
		t.Fatalf("Headers[content-type] = %q, want application/json", got)
	}
	if got := string(snap.Body); got != `{"name":"sora"}` {
		t.Fatalf("Body = %q, want %q", got, `{"name":"sora"}`)
	}
	if got := snap.BodyString(); got != `{"name":"sora"}` {
		t.Fatalf("BodyString = %q, want %q", got, `{"name":"sora"}`)
	}
}

// TestNormalizeRequest_NoQueryString covers the URI-path branch where
// no ?query is present so callers get the bare path (matches the v1.4
// mock_server recorder shape — path stays "/users" not "/users?").
func TestNormalizeRequest_NoQueryString(t *testing.T) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	req.Header.SetMethod("GET")
	req.SetRequestURI("/health")

	snap := kiwa_fiber.NormalizeRequest(req)

	if snap.Path != "/health" {
		t.Fatalf("Path = %q, want /health (no trailing ?)", snap.Path)
	}
	if snap.Method != "GET" {
		t.Fatalf("Method = %q, want GET", snap.Method)
	}
}

// TestNormalizeRequest_BodyDefensiveCopy locks the v1.6-2 hazard 2
// contract — mutating the returned Body slice must not corrupt any
// subsequent NormalizeRequest call over the same fasthttp.Request.
// Symmetrical to internal/recorder.deepCopySnapshot which every other
// adapter already provides on RecordedRequests().
func TestNormalizeRequest_BodyDefensiveCopy(t *testing.T) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	req.Header.SetMethod("POST")
	req.SetRequestURI("/echo")
	original := []byte("hello kiwa")
	req.SetBody(original)

	snap1 := kiwa_fiber.NormalizeRequest(req)
	// Mutating the caller-visible body slice must not touch the recorder's
	// captured bytes on any subsequent snapshot.
	for i := range snap1.Body {
		snap1.Body[i] = 'X'
	}

	snap2 := kiwa_fiber.NormalizeRequest(req)
	if got := string(snap2.Body); got != "hello kiwa" {
		t.Fatalf("second snapshot Body corrupted by first mutation: got %q, want %q", got, "hello kiwa")
	}
	if !bytes.Equal(snap2.Body, []byte("hello kiwa")) {
		t.Fatalf("second snapshot Body bytes mismatch: got %q", snap2.Body)
	}
}

// TestNormalizeRequest_MultiValueHeaders verifies that multiple values
// for the same header key survive the round trip via HeadersAll. Fiber's
// underlying fasthttp.RequestHeader supports multi-value via Add — the
// Normalize path must preserve every value in wire order so multi-value
// assertions (Cookie / Accept / Forwarded / Via) stay authored consistently
// with the v1.6-1 multi-value adapter surface.
func TestNormalizeRequest_MultiValueHeaders(t *testing.T) {
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)

	req.Header.SetMethod("GET")
	req.SetRequestURI("/multi")
	req.Header.Add("X-Trace", "one")
	req.Header.Add("X-Trace", "two")
	req.Header.Add("X-Trace", "three")

	snap := kiwa_fiber.NormalizeRequest(req)

	got := snap.HeadersAllValues("X-Trace")
	if len(got) != 3 {
		t.Fatalf("HeadersAllValues len = %d, want 3 (values=%v)", len(got), got)
	}
	// Wire order must be preserved so assertions can lock the exact
	// sequence servers emit (matches internal/recorder wire-order contract).
	want := []string{"one", "two", "three"}
	for i, v := range want {
		if got[i] != v {
			t.Fatalf("HeadersAllValues[%d] = %q, want %q (full=%v)", i, got[i], v, got)
		}
	}
	// Single-value view is last-write-wins on the canonical lowercased key
	// so it matches internal/recorder.extractHeaders across all adapters.
	if snap.Headers["x-trace"] != "three" {
		t.Fatalf("Headers[x-trace] = %q, want three (last-write-wins)", snap.Headers["x-trace"])
	}
}

// TestNormalizeRequest_NilRequestReturnsEmpty covers the defensive
// zero-value branch so callers building a fasthttp.Request lazily do
// not panic on a nil-dispatched Normalize.
func TestNormalizeRequest_NilRequestReturnsEmpty(t *testing.T) {
	snap := kiwa_fiber.NormalizeRequest(nil)
	if snap.Method != "" {
		t.Fatalf("Method = %q, want empty on nil input", snap.Method)
	}
	if snap.Path != "" {
		t.Fatalf("Path = %q, want empty on nil input", snap.Path)
	}
	if len(snap.Body) != 0 {
		t.Fatalf("Body len = %d, want 0 on nil input", len(snap.Body))
	}
}

// TestNormalizeResponse_StatusHeadersBody covers the response side.
// The kiwa_fiber.Response returned by NormalizeResponse must match the
// shape *TestServer.Send returns so integration between fasthttp-direct
// tests and the fiber TestServer path is bidirectional.
func TestNormalizeResponse_StatusHeadersBody(t *testing.T) {
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	resp.SetStatusCode(fasthttp.StatusCreated)
	resp.Header.Set("Content-Type", "application/json")
	resp.Header.Set("X-Route", "created")
	resp.SetBody([]byte(`{"id":1}`))

	got := kiwa_fiber.NormalizeResponse(resp)

	if got.StatusCode() != 201 {
		t.Fatalf("StatusCode = %d, want 201", got.StatusCode())
	}
	if got.Headers()["content-type"] != "application/json" {
		t.Fatalf("Headers[content-type] = %q, want application/json", got.Headers()["content-type"])
	}
	if got.Headers()["x-route"] != "created" {
		t.Fatalf("Headers[x-route] = %q, want created", got.Headers()["x-route"])
	}
	if body := got.BodyString(); body != `{"id":1}` {
		t.Fatalf("BodyString = %q, want %q", body, `{"id":1}`)
	}
}

// TestNormalizeResponse_MultiValueSetCookie verifies that multiple
// Set-Cookie lines survive the round trip via HeadersAll — the same
// v1.6-1 multi-value contract *TestServer.Send buffers off the http.Header.
// fasthttp stores cookies as a private structure but VisitAll emits every
// Set-Cookie as a separate f() call so the normalize path must accumulate
// them into HeadersAll["set-cookie"] in wire order.
func TestNormalizeResponse_MultiValueSetCookie(t *testing.T) {
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	resp.SetStatusCode(200)
	// fasthttp stores cookies via response.Header.SetCookie — VisitAll
	// still emits every one as a separate Set-Cookie call so a rigorous
	// multi-value assertion locks the whole ordered sequence.
	c1 := fasthttp.AcquireCookie()
	defer fasthttp.ReleaseCookie(c1)
	c1.SetKey("session")
	c1.SetValue("abc")
	resp.Header.SetCookie(c1)

	c2 := fasthttp.AcquireCookie()
	defer fasthttp.ReleaseCookie(c2)
	c2.SetKey("csrf")
	c2.SetValue("xyz")
	resp.Header.SetCookie(c2)

	got := kiwa_fiber.NormalizeResponse(resp)

	cookies := got.HeadersAllValues("Set-Cookie")
	if len(cookies) != 2 {
		t.Fatalf("Set-Cookie count = %d, want 2 (got=%v)", len(cookies), cookies)
	}
	// Order-preserving check — Set-Cookie order is semantically
	// meaningful and must match the wire. Use substring match rather
	// than exact so fasthttp cookie-attribute defaults (Path / Domain
	// / Expires) do not couple the assertion to library-version drift.
	if !strings.Contains(cookies[0], "session=abc") {
		t.Fatalf("cookies[0] = %q, want session=abc substring", cookies[0])
	}
	if !strings.Contains(cookies[1], "csrf=xyz") {
		t.Fatalf("cookies[1] = %q, want csrf=xyz substring", cookies[1])
	}
}

// TestNormalizeResponse_BodyDefensiveCopy locks the ingress-copy
// contract for the response body so callers mutating the returned Body
// slice cannot retroactively corrupt subsequent NormalizeResponse calls
// on the same fasthttp.Response — parity with kiwa-rs Vec<u8>::clone
// (v1.6-2 hazard 2).
func TestNormalizeResponse_BodyDefensiveCopy(t *testing.T) {
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	resp.SetStatusCode(200)
	resp.SetBody([]byte("hello"))

	first := kiwa_fiber.NormalizeResponse(resp)
	firstBody := first.Body()
	for i := range firstBody {
		firstBody[i] = 'X'
	}

	second := kiwa_fiber.NormalizeResponse(resp)
	if got := second.BodyString(); got != "hello" {
		t.Fatalf("second NormalizeResponse Body corrupted by first mutation: got %q, want hello", got)
	}
}

// TestNormalizeResponse_NilResponseReturnsEmpty covers the nil-guard
// so callers do not panic when a fasthttp.Response has not been built yet.
func TestNormalizeResponse_NilResponseReturnsEmpty(t *testing.T) {
	got := kiwa_fiber.NormalizeResponse(nil)
	if got == nil {
		t.Fatal("NormalizeResponse(nil) = nil, want non-nil empty Response")
	}
	if got.StatusCode() != 0 {
		t.Fatalf("StatusCode = %d, want 0 on nil input", got.StatusCode())
	}
	if len(got.Body()) != 0 {
		t.Fatalf("Body len = %d, want 0 on nil input", len(got.Body()))
	}
}

// TestNormalizeRequestResponse_ParityWithTestServerRecording is the
// AC guardrail — a request/response synthesised via fasthttp-direct
// must produce the same-shape RecordedRequest / Response as the
// TestServer builder path so hybrid tests (fasthttp middleware under
// test + fiber TestServer for the app layer) do not diverge on
// header keys, path shape, or body semantics.
func TestNormalizeRequestResponse_ParityWithTestServerRecording(t *testing.T) {
	// Build a fasthttp-direct request/response pair.
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)
	req.Header.SetMethod("PUT")
	req.SetRequestURI("/items/1?commit=true")
	req.Header.Set("X-Kiwa-Parity", "v1")
	req.Header.Set("Content-Type", "application/json")
	req.SetBody([]byte(`{"updated":true}`))

	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)
	resp.SetStatusCode(200)
	resp.Header.Set("Content-Type", "application/json")
	resp.SetBody([]byte(`{"ok":true}`))

	directSnap := kiwa_fiber.NormalizeRequest(req)
	directResp := kiwa_fiber.NormalizeResponse(resp)

	// Run the same shape through the TestServer path so we can compare
	// header case-folding, path composition, and body semantics field-by-
	// field. The app echoes the incoming JSON body back with 200 so the
	// response side has non-trivial content to compare too.
	app := newApp()
	app.Put("/items/1", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "application/json")
		return c.Status(200).SendString(`{"ok":true}`)
	})

	srv := kiwa_fiber.NewTestServer(t, app)
	got := srv.Request(kiwa.MethodPUT, "/items/1?commit=true").
		Header("X-Kiwa-Parity", "v1").
		JSON([]byte(`{"updated":true}`)).
		Send()

	// Parity on the response shape (status / content-type).
	if got.StatusCode() != directResp.StatusCode() {
		t.Fatalf("StatusCode parity broken: server=%d direct=%d", got.StatusCode(), directResp.StatusCode())
	}
	if got.Headers()["content-type"] != directResp.Headers()["content-type"] {
		t.Fatalf("Content-Type parity broken: server=%q direct=%q",
			got.Headers()["content-type"], directResp.Headers()["content-type"])
	}

	// Parity on the request-recorder shape (method / path / lowercased headers / body).
	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if recorded[0].Method != directSnap.Method {
		t.Fatalf("Method parity broken: server=%q direct=%q", recorded[0].Method, directSnap.Method)
	}
	if recorded[0].Path != directSnap.Path {
		t.Fatalf("Path parity broken: server=%q direct=%q", recorded[0].Path, directSnap.Path)
	}
	if recorded[0].Headers["x-kiwa-parity"] != directSnap.Headers["x-kiwa-parity"] {
		t.Fatalf("Header case-fold parity broken: server=%q direct=%q",
			recorded[0].Headers["x-kiwa-parity"], directSnap.Headers["x-kiwa-parity"])
	}
	if recorded[0].Headers["content-type"] != directSnap.Headers["content-type"] {
		t.Fatalf("Content-Type header parity broken: server=%q direct=%q",
			recorded[0].Headers["content-type"], directSnap.Headers["content-type"])
	}
	if string(recorded[0].Body) != string(directSnap.Body) {
		t.Fatalf("Body parity broken: server=%q direct=%q",
			string(recorded[0].Body), string(directSnap.Body))
	}
}
