// Fiber runs on fasthttp rather than net/http, so hybrid tests that
// exercise fasthttp middleware directly (fasthttp.Request /
// fasthttp.Response built by hand, no *fiber.App on the write side)
// cannot go through the *fiber.App.Test path used by the TestServer
// builder. NormalizeRequest / NormalizeResponse close that gap by
// converting a raw fasthttp value into the same kiwa contract
// (kiwa.RecordedRequest / kiwa_fiber.Response) that TestServer emits,
// so a Layer 1 spec authored against the TestServer builder reads the
// same shape when the test drops down to the fasthttp layer for
// middleware-under-test coverage.
//
// # Contract parity with the TestServer path
//
// The two conversion sites (this file for fasthttp-direct, fiber.go
// Send for the TestServer path) share the following invariants so
// snapshots produced by either compare equal field-by-field:
//
//   - Header keys are lowercased on both single-value and multi-value
//     views. Single-value view is last-write-wins on the canonical
//     lowercased key — matches internal/recorder.extractHeaders which
//     the gin / echo / mock_server adapters already use (v1.6-5).
//   - Multi-value view preserves every recorded value in wire order,
//     so multi-value headers (Set-Cookie, Cookie, Accept, Forwarded,
//     Via) survive the round trip verbatim — parity with v1.6-1.
//   - Body slices are defensively copied at ingress so caller-side
//     buffer reuse cannot retroactively mutate the captured bytes —
//     parity with v1.6-2 hazard 2 (kiwa-rs Vec<u8>::clone equivalent).
//   - Path composition is URI.Path with URI.QueryString appended
//     via "?" if present, matching internal/recorder.pathWithQuery so
//     "/users?limit=10" reads identically across all adapters.
//   - nil inputs return a zero-value snapshot (or empty *Response) so
//     callers building fasthttp values lazily do not panic.
//
// # Example
//
//	req := fasthttp.AcquireRequest()
//	defer fasthttp.ReleaseRequest(req)
//	req.Header.SetMethod("POST")
//	req.SetRequestURI("/users?limit=10")
//	req.Header.Set("Content-Type", "application/json")
//	req.SetBody([]byte(`{"name":"sora"}`))
//
//	snap := kiwa_fiber.NormalizeRequest(req)
//	kiwa.AssertEqual(t, snap.Method, "POST")
//	kiwa.AssertEqual(t, snap.Headers["content-type"], "application/json")
//
// The returned snapshot is safe to store / mutate — the Body slice and
// HeadersAll slices are independent copies.
package kiwa_fiber

import (
	"strings"

	"github.com/valyala/fasthttp"

	"github.com/cardene777/kiwa-test-go"
)

// NormalizeRequest converts a raw fasthttp.Request into a
// kiwa.RecordedRequest with the same shape the TestServer builder
// records (see the "Contract parity" section on the package godoc).
//
// The path is composed as URI.Path + "?" + URI.QueryString if a
// query string is present, matching internal/recorder.pathWithQuery
// so "/users?limit=10" reads identically across all adapters.
//
// Header keys are lowercased. Single-value Headers is last-write-wins
// on the canonical lowercased key so the shape matches
// internal/recorder.extractHeaders (v1.6-5 SSOT). HeadersAll preserves
// every recorded value in wire order so multi-value headers survive.
//
// The Body slice is defensively copied so callers mutating the
// returned bytes cannot retroactively corrupt subsequent
// NormalizeRequest calls on the same fasthttp.Request (v1.6-2 hazard 2).
//
// nil input returns a zero-value RecordedRequest so callers building
// requests lazily do not panic on the Normalize call.
func NormalizeRequest(req *fasthttp.Request) kiwa.RecordedRequest {
	if req == nil {
		return kiwa.RecordedRequest{}
	}

	headers, headersAll := collectHeaders(req.Header.VisitAll)

	return kiwa.RecordedRequest{
		Method:     string(req.Header.Method()),
		Path:       requestPathWithQuery(req),
		Headers:    headers,
		HeadersAll: headersAll,
		Body:       cloneBytes(req.Body()),
	}
}

// NormalizeResponse converts a raw fasthttp.Response into the same
// *Response shape *TestServer.Send returns (statusCode / headers /
// headersAll / body). The buffered result is safe to store and share
// across goroutines — every mutable field is deep-copied at build
// time and the accessors (Body / Headers / HeadersAll) return
// independent copies on read.
//
// nil input returns a non-nil zero-value *Response so callers can
// chain the standard accessors without a nil check (matching the
// v1.4 mock_server ergonomics).
func NormalizeResponse(resp *fasthttp.Response) *Response {
	if resp == nil {
		return &Response{
			headers:    map[string]string{},
			headersAll: map[string][]string{},
		}
	}

	headers, headersAll := collectHeaders(resp.Header.VisitAll)

	return &Response{
		statusCode: resp.StatusCode(),
		headers:    headers,
		headersAll: headersAll,
		body:       cloneBytes(resp.Body()),
	}
}

// requestPathWithQuery returns URI.Path with URI.QueryString appended
// via "?" if a query string was set. Matches internal/recorder.pathWithQuery
// so "/users" (no query) and "/users?limit=10" (with query) read the
// same way across the gin / echo / mock_server / fiber adapters.
func requestPathWithQuery(req *fasthttp.Request) string {
	uri := req.URI()
	path := string(uri.Path())
	if query := uri.QueryString(); len(query) > 0 {
		return path + "?" + string(query)
	}
	return path
}

// collectHeaders builds the (single-value, multi-value) header view
// pair from any fasthttp VisitAll-shaped walker. Passing the VisitAll
// method value directly means the same accumulator serves both
// fasthttp.RequestHeader and fasthttp.ResponseHeader — they share the
// same walker signature but no parent type, so a method-value shim is
// the smallest bridge.
//
// Both views lowercase the key. Single-value view is last-write-wins
// on the canonical lowercased key, matching internal/recorder.extractHeaders
// so shapes compare equal across the kiwa-go adapters (v1.6-5 SSOT).
// Multi-value view preserves every recorded value in wire order, so
// multi-line headers (Set-Cookie in particular — ResponseHeader.VisitAll
// emits every cookie as a separate f() call) survive verbatim (v1.6-1).
func collectHeaders(visitAll func(func(key, value []byte))) (map[string]string, map[string][]string) {
	headers := map[string]string{}
	headersAll := map[string][]string{}

	visitAll(func(key, value []byte) {
		lowerKey := strings.ToLower(string(key))
		v := string(value)
		headers[lowerKey] = v
		headersAll[lowerKey] = append(headersAll[lowerKey], v)
	})

	return headers, headersAll
}

// cloneBytes returns a defensive copy of b. Always returns a fresh
// (non-nil) slice even for a nil input so downstream serialisation
// code can iterate without a nil check — matching
// internal/recorder.cloneBytes so behaviour stays identical to the
// gin / echo / mock_server recorder path.
func cloneBytes(b []byte) []byte {
	out := make([]byte, len(b))
	copy(out, b)
	return out
}
