package kiwa_test

import (
	"bytes"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

// 1) Default MockServer binds to a real local port and the URL is reachable.
func TestNewMockServer_BindsLocalPort(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{})

	url := srv.URL()
	if !strings.HasPrefix(url, "http://127.0.0.1:") {
		t.Fatalf("URL = %q, want http://127.0.0.1:<port> prefix", url)
	}
}

// 2) GET route returns the registered MockResponse and records the request.
func TestRouteReturnsRegisteredResponseAndRecordsRequest(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`[{"id":1,"name":"sora"}]`)).WithHeader("X-Kiwa-Route", "users")
		}),
	))

	req, err := http.NewRequest(http.MethodGet, srv.URL()+"/users?limit=10", nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Set("X-Test-Tag", "kiwa-poc")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", resp.StatusCode)
	}
	if got := resp.Header.Get("Content-Type"); got != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", got)
	}
	if got := resp.Header.Get("X-Kiwa-Route"); got != "users" {
		t.Fatalf("X-Kiwa-Route = %q, want users", got)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	if string(body) != `[{"id":1,"name":"sora"}]` {
		t.Fatalf("body = %q, want json users payload", string(body))
	}

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if recorded[0].Method != "GET" {
		t.Fatalf("recorded[0].Method = %q, want GET", recorded[0].Method)
	}
	if recorded[0].Path != "/users?limit=10" {
		t.Fatalf("recorded[0].Path = %q, want /users?limit=10", recorded[0].Path)
	}
	if got := recorded[0].Headers["x-test-tag"]; got != "kiwa-poc" {
		t.Fatalf("recorded[0].Headers[x-test-tag] = %q, want kiwa-poc", got)
	}
}

// 3) POST route handler observes the request body; recorder captures it.
func TestPostRouteHandlerObservesBodyAndRecorderCapturesIt(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodPOST, "/echo", func(req kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK(req.Body).WithStatus(201)
		}),
	))

	resp, err := http.Post(srv.URL()+"/echo", "text/plain", bytes.NewBufferString("hello kiwa"))
	if err != nil {
		t.Fatalf("Post: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		t.Fatalf("status = %d, want 201", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if string(body) != "hello kiwa" {
		t.Fatalf("body = %q, want hello kiwa", string(body))
	}

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if recorded[0].Method != "POST" {
		t.Fatalf("recorded[0].Method = %q, want POST", recorded[0].Method)
	}
	if recorded[0].Path != "/echo" {
		t.Fatalf("recorded[0].Path = %q, want /echo", recorded[0].Path)
	}
	if recorded[0].BodyString() != "hello kiwa" {
		t.Fatalf("recorded[0].BodyString = %q, want hello kiwa", recorded[0].BodyString())
	}
}

// 4) An unmatched route returns 404 and the request is still recorded.
func TestUnmatchedRouteReturns404AndIsStillRecorded(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/known", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok"))
		}),
	))

	resp, err := http.Get(srv.URL() + "/unknown")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", resp.StatusCode)
	}
	body, _ := io.ReadAll(resp.Body)
	if !strings.Contains(string(body), "no route matched GET /unknown") {
		t.Fatalf("404 body missing self-describing text, got %q", string(body))
	}

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if recorded[0].Method != "GET" || recorded[0].Path != "/unknown" {
		t.Fatalf("recorded[0] = %+v, want GET /unknown", recorded[0])
	}
}

// 5) The recorder captures every request in registration order.
func TestRecorderCapturesEveryRequestInOrder(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/ping", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("pong"))
		}),
	))

	for i := 0; i < 3; i++ {
		resp, err := http.Get(srv.URL() + "/ping?n=" + strconv.Itoa(i))
		if err != nil {
			t.Fatalf("Get %d: %v", i, err)
		}
		_ = resp.Body.Close()
	}

	if srv.RequestCount() != 3 {
		t.Fatalf("RequestCount = %d, want 3", srv.RequestCount())
	}
	recorded := srv.RecordedRequests()
	for i := 0; i < 3; i++ {
		want := "/ping?n=" + strconv.Itoa(i)
		if recorded[i].Path != want {
			t.Fatalf("recorded[%d].Path = %q, want %q", i, recorded[i].Path, want)
		}
	}
}

// 6) When multiple routes share (method, path), the first registered wins.
func TestMultipleRoutesMatchFirstRegistered(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.
		WithRoute(kiwa.NewRoute(kiwa.MethodGET, "/multi", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("first"))
		})).
		WithRoute(kiwa.NewRoute(kiwa.MethodGET, "/multi", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("second"))
		})).
		WithRoute(kiwa.NewRoute(kiwa.MethodPOST, "/multi", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("posted"))
		})),
	)

	resp, err := http.Get(srv.URL() + "/multi")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	body, _ := io.ReadAll(resp.Body)
	_ = resp.Body.Close()
	if string(body) != "first" {
		t.Fatalf("GET body = %q, want first", string(body))
	}

	resp2, err := http.Post(srv.URL()+"/multi", "text/plain", nil)
	if err != nil {
		t.Fatalf("Post: %v", err)
	}
	body2, _ := io.ReadAll(resp2.Body)
	_ = resp2.Body.Close()
	if string(body2) != "posted" {
		t.Fatalf("POST body = %q, want posted", string(body2))
	}
}

// 7) Stop is idempotent; t.Cleanup runs Stop a second time without panicking.
func TestExplicitStopThenCleanupIsSafe(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/stop-test", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok"))
		}),
	))

	resp, err := http.Get(srv.URL() + "/stop-test")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	_ = resp.Body.Close()

	srv.Stop()
	srv.Stop() // explicit second stop must not panic
	// t.Cleanup's Stop will run after the test returns; we cannot assert
	// "did not panic" directly but a panic would surface as a test failure.
}

// 8) Each server isolates its own recorder and binds a distinct port.
func TestEachServerIsolatesItsOwnRecorder(t *testing.T) {
	a := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte("[]"))
		}),
	))
	b := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte("[]"))
		}),
	))

	if a.URL() == b.URL() {
		t.Fatalf("URLs collide: %q == %q", a.URL(), b.URL())
	}

	respA, _ := http.Get(a.URL() + "/users")
	_ = respA.Body.Close()
	respB, _ := http.Get(b.URL() + "/users")
	_ = respB.Body.Close()

	if a.RequestCount() != 1 {
		t.Fatalf("a.RequestCount = %d, want 1", a.RequestCount())
	}
	if b.RequestCount() != 1 {
		t.Fatalf("b.RequestCount = %d, want 1", b.RequestCount())
	}
}

// 9) The recorder is safe to read while the server services parallel clients.
func TestRecorderIsSafeUnderConcurrentClients(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/race", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok"))
		}),
	))

	const n = 50
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			resp, err := http.Get(srv.URL() + "/race")
			if err != nil {
				return
			}
			_ = resp.Body.Close()
		}()
	}
	wg.Wait()

	if srv.RequestCount() != n {
		t.Fatalf("RequestCount = %d, want %d", srv.RequestCount(), n)
	}
}

// 10) MockResponse zero value defaults to 200 OK on the wire.
func TestMockResponseZeroValueDefaultsTo200(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/zero", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.MockResponse{} // Status == 0 must promote to 200
		}),
	))

	resp, err := http.Get(srv.URL() + "/zero")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("status = %d, want 200 (zero -> 200 promotion)", resp.StatusCode)
	}
}

// 11a) RecordedRequest.HeadersAll preserves every value in wire order while
// Headers keeps the last-write-wins single-value view for backward compat.
// Motivated by v1.6-1 Codex adversarial review (Set-Cookie collapse).
func TestRecordedRequestHeadersAllPreservesMultiValue(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/echo-headers", func(req kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok"))
		}),
	))

	req, err := http.NewRequest(http.MethodGet, srv.URL()+"/echo-headers", nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	// net/http canonicalises the key, so both Add calls hit the same slot
	// and produce a multi-value header on the wire.
	req.Header.Add("X-Multi", "a")
	req.Header.Add("X-Multi", "b")
	req.Header.Add("X-Multi", "c")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Do: %v", err)
	}
	defer resp.Body.Close()

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}

	// Backward compat: Headers still exposes the last value.
	if got := recorded[0].Headers["x-multi"]; got != "c" {
		t.Fatalf("Headers[x-multi] = %q, want c (last-write-wins)", got)
	}

	// New: HeadersAll preserves every value in wire order.
	all := recorded[0].HeadersAllValues("X-Multi")
	if len(all) != 3 || all[0] != "a" || all[1] != "b" || all[2] != "c" {
		t.Fatalf("HeadersAllValues(X-Multi) = %v, want [a b c]", all)
	}

	// Case-insensitive lookup on the accessor.
	if got := recorded[0].HeadersAllValues("x-multi"); len(got) != 3 {
		t.Fatalf("case-insensitive lookup lost values: %v", got)
	}

	// Absent header returns nil (not empty slice) so callers can distinguish.
	if got := recorded[0].HeadersAllValues("X-Absent"); got != nil {
		t.Fatalf("HeadersAllValues(X-Absent) = %v, want nil", got)
	}
}

// 11b) MockResponse.HeadersAll emits every value on the wire so callers can
// return multiple Set-Cookie / WWW-Authenticate / Vary / Link lines from a
// route handler. Backward compat: Headers (single-value) still wins on
// overlap with HeadersAll so pre-v1.6 callers see no behavior change.
func TestMockResponseHeadersAllEmitsMultiValueOnWire(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/set-cookies", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok")).
				WithHeaderValues("Set-Cookie", "sid=abc; Path=/", "trace=xyz; Path=/; HttpOnly").
				WithHeaderValues("Vary", "Accept-Encoding").
				WithHeaderValues("Vary", "User-Agent")
		}),
	))

	resp, err := http.Get(srv.URL() + "/set-cookies")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	defer resp.Body.Close()

	// Two Set-Cookie header lines survive the round trip.
	cookies := resp.Header.Values("Set-Cookie")
	if len(cookies) != 2 {
		t.Fatalf("Set-Cookie count = %d, want 2 (values=%v)", len(cookies), cookies)
	}
	if !strings.Contains(cookies[0], "sid=abc") || !strings.Contains(cookies[1], "trace=xyz") {
		t.Fatalf("Set-Cookie values in wrong order: %v", cookies)
	}

	// Vary was populated across two WithHeaderValues chained calls; each
	// call appends without overwriting the previous line.
	vary := resp.Header.Values("Vary")
	if len(vary) != 2 || vary[0] != "Accept-Encoding" || vary[1] != "User-Agent" {
		t.Fatalf("Vary values = %v, want [Accept-Encoding User-Agent]", vary)
	}

	// net/http parses Set-Cookie via *http.Cookie so downstream assertions
	// can read cookie name / value / attributes without re-parsing.
	parsedCookies := resp.Cookies()
	if len(parsedCookies) != 2 {
		t.Fatalf("parsed cookies = %d, want 2", len(parsedCookies))
	}
	if parsedCookies[0].Name != "sid" || parsedCookies[0].Value != "abc" {
		t.Fatalf("cookie[0] = %+v, want sid=abc", parsedCookies[0])
	}
	if !parsedCookies[1].HttpOnly {
		t.Fatalf("cookie[1] HttpOnly not preserved: %+v", parsedCookies[1])
	}
}

// 11c) MockResponse.Headers overrides HeadersAll for the same key so callers
// who only fill Headers keep the pre-v1.6 last-write-wins behaviour on the
// wire — verified by populating both and asserting Headers wins.
func TestMockResponseHeadersOverridesHeadersAllOnSameKey(t *testing.T) {
	srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/override", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.OK([]byte("ok")).
				WithHeaderValues("X-Precedence", "from-headersAll-a", "from-headersAll-b").
				WithHeader("X-Precedence", "from-headers")
		}),
	))

	resp, err := http.Get(srv.URL() + "/override")
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	defer resp.Body.Close()

	// Only one value survives — Headers.Set replaced whatever HeadersAll
	// wrote for the same key.
	values := resp.Header.Values("X-Precedence")
	if len(values) != 1 || values[0] != "from-headers" {
		t.Fatalf("X-Precedence values = %v, want [from-headers]", values)
	}
}

// 11) HTTPMethod String labels match net/http canonical names.
func TestHTTPMethodStringLabels(t *testing.T) {
	cases := []struct {
		m    kiwa.HTTPMethod
		want string
	}{
		{kiwa.MethodGET, "GET"},
		{kiwa.MethodPOST, "POST"},
		{kiwa.MethodPUT, "PUT"},
		{kiwa.MethodPATCH, "PATCH"},
		{kiwa.MethodDELETE, "DELETE"},
		{kiwa.MethodHEAD, "HEAD"},
		{kiwa.MethodOPTIONS, "OPTIONS"},
		{kiwa.HTTPMethod(99), "UNKNOWN"},
	}
	for _, tc := range cases {
		if got := tc.m.String(); got != tc.want {
			t.Errorf("HTTPMethod(%d).String() = %q, want %q", tc.m, got, tc.want)
		}
	}
}
