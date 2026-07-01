package kiwa_echo_test

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"sync"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/cardene777/kiwa-test-go"
	kiwa_echo "github.com/cardene777/kiwa-test-go/echo"
)

// newEcho returns a fresh *echo.Echo with default routing and the access /
// error logger silenced so go test output stays diff-friendly. We do not
// touch any echo global state — echo has no global-mode toggle equivalent
// to gin.SetMode, so silencing per-instance keeps production behaviour
// untouched.
func newEcho() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Logger.SetOutput(io.Discard)
	return e
}

// 1) Default TestServer returns a non-nil Echo and an empty recorder.
func TestNewTestServer_BindsEchoAndInitializesRecorder(t *testing.T) {
	e := newEcho()
	e.GET("/health", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	srv := kiwa_echo.NewTestServer(t, e)

	if srv.Echo() == nil {
		t.Fatal("Echo() = nil, want non-nil")
	}
	if got := srv.RequestCount(); got != 0 {
		t.Fatalf("RequestCount = %d, want 0 before any Send", got)
	}
}

// 2) GET route returns the registered response and records the request.
func TestGetRouteReturnsRegisteredResponseAndRecordsRequest(t *testing.T) {
	e := newEcho()
	e.GET("/users", func(c echo.Context) error {
		c.Response().Header().Set("X-Kiwa-Route", "users")
		return c.JSON(http.StatusOK, []map[string]any{{"id": 1, "name": "sora"}})
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/users?limit=10").
		Header("X-Test-Tag", "kiwa-poc").
		Send()

	if resp.StatusCode() != 200 {
		t.Fatalf("status = %d, want 200", resp.StatusCode())
	}
	if got := resp.Headers()["content-type"]; got == "" {
		t.Fatalf("Content-Type header missing")
	}
	if got := resp.Headers()["x-kiwa-route"]; got != "users" {
		t.Fatalf("X-Kiwa-Route = %q, want users", got)
	}
	// echo.JSON appends a trailing newline; assert on the structural payload.
	var decoded []map[string]any
	if err := resp.JSON(&decoded); err != nil {
		t.Fatalf("decode body: %v (raw=%q)", err, resp.BodyString())
	}
	if len(decoded) != 1 || decoded[0]["name"] != "sora" {
		t.Fatalf("decoded = %+v, want [{id:1,name:sora}]", decoded)
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
	e := newEcho()
	e.POST("/echo", func(c echo.Context) error {
		body, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return c.String(http.StatusBadRequest, "read body")
		}
		return c.Blob(http.StatusCreated, "text/plain", body)
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodPOST, "/echo").
		Body([]byte("hello kiwa")).
		Send()

	if resp.StatusCode() != 201 {
		t.Fatalf("status = %d, want 201", resp.StatusCode())
	}
	if resp.BodyString() != "hello kiwa" {
		t.Fatalf("body = %q, want hello kiwa", resp.BodyString())
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
	e := newEcho()
	e.GET("/known", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/unknown").Send()

	if resp.StatusCode() != 404 {
		t.Fatalf("status = %d, want 404 (echo default for unmatched route)", resp.StatusCode())
	}

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if recorded[0].Method != "GET" || recorded[0].Path != "/unknown" {
		t.Fatalf("recorded[0] = %+v, want GET /unknown", recorded[0])
	}
}

// 5) The recorder captures every request in dispatch order.
func TestRecorderCapturesEveryRequestInOrder(t *testing.T) {
	e := newEcho()
	e.GET("/ping", func(c echo.Context) error { return c.String(http.StatusOK, "pong") })

	srv := kiwa_echo.NewTestServer(t, e)
	for i := 0; i < 3; i++ {
		srv.Request(kiwa.MethodGET, "/ping?n="+strconv.Itoa(i)).Send()
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

// 6) JSON builder sets Content-Type and the handler decodes the payload.
func TestJSONBuilderSetsContentTypeAndHandlerDecodes(t *testing.T) {
	e := newEcho()
	e.POST("/users", func(c echo.Context) error {
		var posted map[string]string
		if err := c.Bind(&posted); err != nil {
			return c.String(http.StatusBadRequest, "bad json")
		}
		return c.JSON(http.StatusCreated, map[string]any{"id": 42, "name": posted["name"]})
	})

	srv := kiwa_echo.NewTestServer(t, e)
	payload, _ := json.Marshal(map[string]string{"name": "hina"})
	resp := srv.Request(kiwa.MethodPOST, "/users").JSON(payload).Send()

	if resp.StatusCode() != 201 {
		t.Fatalf("status = %d, want 201", resp.StatusCode())
	}

	var decoded map[string]any
	if err := resp.JSON(&decoded); err != nil {
		t.Fatalf("Response.JSON: %v", err)
	}
	if got := decoded["name"]; got != "hina" {
		t.Fatalf("decoded[name] = %v, want hina", got)
	}
	// echo emits numeric IDs as float64 through encoding/json — the kiwa
	// adapter does not pre-convert because callers know their own schema.
	if got := decoded["id"]; got != float64(42) {
		t.Fatalf("decoded[id] = %v, want 42", got)
	}

	recorded := srv.RecordedRequests()
	if got := recorded[0].Headers["content-type"]; got != "application/json" {
		t.Fatalf("recorded[0].Headers[content-type] = %q, want application/json", got)
	}
}

// 7) echo path params resolve through the engine matcher.
func TestPathParamsResolveThroughEchoMatcher(t *testing.T) {
	e := newEcho()
	e.GET("/users/:id", func(c echo.Context) error {
		return c.String(http.StatusOK, "id="+c.Param("id"))
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/users/42").Send()

	if resp.StatusCode() != 200 {
		t.Fatalf("status = %d, want 200", resp.StatusCode())
	}
	if got := resp.BodyString(); got != "id=42" {
		t.Fatalf("body = %q, want id=42", got)
	}
}

// 8) Stop is idempotent; t.Cleanup runs Stop a second time without panicking.
func TestExplicitStopThenCleanupIsSafe(t *testing.T) {
	e := newEcho()
	e.GET("/ok", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	srv := kiwa_echo.NewTestServer(t, e)
	srv.Request(kiwa.MethodGET, "/ok").Send()

	srv.Stop()
	srv.Stop() // explicit second stop must not panic
}

// 9) The recorder is safe to read while parallel Send calls run.
func TestRecorderIsSafeUnderConcurrentSends(t *testing.T) {
	e := newEcho()
	e.GET("/race", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	srv := kiwa_echo.NewTestServer(t, e)

	const n = 50
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		go func() {
			defer wg.Done()
			srv.Request(kiwa.MethodGET, "/race").Send()
		}()
	}
	wg.Wait()

	if srv.RequestCount() != n {
		t.Fatalf("RequestCount = %d, want %d", srv.RequestCount(), n)
	}
}

// 10) HTTPMethod values cover the v1.4 MockServer surface so polyglot
// specs read the same shape across languages.
func TestHTTPMethodEnumRoundTripsThroughEcho(t *testing.T) {
	e := newEcho()
	hit := make(map[string]bool)
	// Register one route per kiwa HTTPMethod. echo exposes typed verb
	// helpers; we use the matching method per verb so the matcher mirrors
	// production-shaped routing instead of relying on a generic Any.
	register := func(method string, h echo.HandlerFunc) {
		switch method {
		case "GET":
			e.GET("/m", h)
		case "POST":
			e.POST("/m", h)
		case "PUT":
			e.PUT("/m", h)
		case "PATCH":
			e.PATCH("/m", h)
		case "DELETE":
			e.DELETE("/m", h)
		case "HEAD":
			e.HEAD("/m", h)
		case "OPTIONS":
			e.OPTIONS("/m", h)
		}
	}
	for _, method := range []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"} {
		m := method
		register(m, func(c echo.Context) error {
			hit[m] = true
			return c.NoContent(http.StatusNoContent)
		})
	}

	srv := kiwa_echo.NewTestServer(t, e)
	cases := []kiwa.HTTPMethod{
		kiwa.MethodGET, kiwa.MethodPOST, kiwa.MethodPUT, kiwa.MethodPATCH,
		kiwa.MethodDELETE, kiwa.MethodHEAD, kiwa.MethodOPTIONS,
	}
	for _, m := range cases {
		resp := srv.Request(m, "/m").Send()
		if resp.StatusCode() != http.StatusNoContent {
			t.Fatalf("method %s: status = %d, want 204", m.String(), resp.StatusCode())
		}
	}
	for _, method := range []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"} {
		if !hit[method] {
			t.Errorf("echo handler for %s was never invoked", method)
		}
	}
}

// 11) Echo state persists across Send calls (the harness reuses one
// instance so router-level middleware sees consecutive requests).
func TestEchoStatePersistsAcrossSends(t *testing.T) {
	e := newEcho()
	var counter int
	e.GET("/count", func(c echo.Context) error {
		counter++
		return c.JSON(http.StatusOK, map[string]int{"n": counter})
	})

	srv := kiwa_echo.NewTestServer(t, e)
	for i := 1; i <= 3; i++ {
		resp := srv.Request(kiwa.MethodGET, "/count").Send()
		var decoded map[string]int
		if err := resp.JSON(&decoded); err != nil {
			t.Fatalf("decode #%d: %v", i, err)
		}
		if decoded["n"] != i {
			t.Fatalf("decoded[n] = %d, want %d", decoded["n"], i)
		}
	}
	if counter != 3 {
		t.Fatalf("counter = %d, want 3", counter)
	}
}

// 12) interop with v1.4 kiwa.NewMockServer — echo handler under test calls
// out to a kiwa mock; both recorders capture independently.
func TestInteropWithKiwaMockServer(t *testing.T) {
	mock := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/external", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`{"upstream":"ok"}`))
		}),
	))

	e := newEcho()
	e.GET("/proxy", func(c echo.Context) error {
		// echo handler proxies to the kiwa mock — same shape as production
		// code that depends on an upstream URL injected through config.
		resp, err := http.Get(mock.URL() + "/external")
		if err != nil {
			return c.String(http.StatusBadGateway, err.Error())
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), body)
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/proxy").Send()

	if resp.StatusCode() != 200 {
		t.Fatalf("echo proxy status = %d, want 200", resp.StatusCode())
	}
	if resp.BodyString() != `{"upstream":"ok"}` {
		t.Fatalf("echo proxy body = %q, want upstream payload", resp.BodyString())
	}
	if mock.RequestCount() != 1 {
		t.Fatalf("mock RequestCount = %d, want 1", mock.RequestCount())
	}
	if srv.RequestCount() != 1 {
		t.Fatalf("echo srv RequestCount = %d, want 1", srv.RequestCount())
	}
}

// 13) Response.HeadersAll preserves every Set-Cookie / multi-value header on
// the response wire while Headers keeps the last-value-wins single-value view
// for backward compat. Verifies the v1.6-1 fix for the Codex adversarial
// "Set-Cookie collapse" finding.
func TestResponseHeadersAllPreservesMultiValueResponseHeaders(t *testing.T) {
	e := newEcho()
	e.GET("/set-cookies", func(c echo.Context) error {
		// Echo exposes the raw ResponseWriter via c.Response().Header so we
		// use net/http.Header.Add directly — matches how production Echo
		// handlers emit multiple Set-Cookie / Vary lines.
		c.Response().Header().Add("Set-Cookie", "sid=abc; Path=/")
		c.Response().Header().Add("Set-Cookie", "trace=xyz; Path=/; HttpOnly")
		c.Response().Header().Add("Vary", "Accept-Encoding")
		c.Response().Header().Add("Vary", "User-Agent")
		return c.String(http.StatusOK, "ok")
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/set-cookies").Send()

	// Backward compat: Headers still exposes a single value per key.
	if resp.Headers()["vary"] == "" {
		t.Fatal("Headers[vary] empty, want last-value-wins single value")
	}

	// HeadersAll preserves every value in wire order.
	setCookies := resp.HeadersAllValues("Set-Cookie")
	if len(setCookies) != 2 {
		t.Fatalf("HeadersAllValues(Set-Cookie) count = %d, want 2 (%v)", len(setCookies), setCookies)
	}
	if setCookies[0] != "sid=abc; Path=/" || setCookies[1] != "trace=xyz; Path=/; HttpOnly" {
		t.Fatalf("HeadersAllValues(Set-Cookie) = %v, want [sid=abc; ...; trace=xyz; ...]", setCookies)
	}

	vary := resp.HeadersAllValues("Vary")
	if len(vary) != 2 || vary[0] != "Accept-Encoding" || vary[1] != "User-Agent" {
		t.Fatalf("HeadersAllValues(Vary) = %v, want [Accept-Encoding User-Agent]", vary)
	}

	// Full snapshot round-trip via HeadersAll() must contain the same lists.
	all := resp.HeadersAll()
	if len(all["set-cookie"]) != 2 || len(all["vary"]) != 2 {
		t.Fatalf("HeadersAll() = %v, want set-cookie/vary populated", all)
	}

	// Case-insensitive lookup on the accessor.
	if len(resp.HeadersAllValues("set-cookie")) != 2 {
		t.Fatal("case-insensitive lookup lost Set-Cookie values")
	}

	// Absent header returns nil (not empty slice).
	if got := resp.HeadersAllValues("X-Absent"); got != nil {
		t.Fatalf("HeadersAllValues(X-Absent) = %v, want nil", got)
	}
}

// 14) Response.Cookies returns every Set-Cookie parsed via net/http so tests
// can assert on cookie Name / Value / attributes without re-parsing header
// strings. Backs the Response.Cookies() AC line.
func TestResponseCookiesParsesEverySetCookieLine(t *testing.T) {
	e := newEcho()
	e.GET("/login", func(c echo.Context) error {
		c.Response().Header().Add("Set-Cookie", "sid=abc; Path=/; HttpOnly")
		c.Response().Header().Add("Set-Cookie", "trace=xyz; Path=/api; Max-Age=3600")
		return c.String(http.StatusOK, "ok")
	})

	srv := kiwa_echo.NewTestServer(t, e)
	resp := srv.Request(kiwa.MethodGET, "/login").Send()

	cookies := resp.Cookies()
	if len(cookies) != 2 {
		t.Fatalf("Cookies() count = %d, want 2", len(cookies))
	}
	if cookies[0].Name != "sid" || cookies[0].Value != "abc" || !cookies[0].HttpOnly {
		t.Fatalf("Cookies()[0] = %+v, want sid=abc HttpOnly", cookies[0])
	}
	if cookies[1].Name != "trace" || cookies[1].Path != "/api" || cookies[1].MaxAge != 3600 {
		t.Fatalf("Cookies()[1] = %+v, want trace Path=/api MaxAge=3600", cookies[1])
	}
}

// 15) recordRequest captures HeadersAll on the request side too so specs
// asserting inbound multi-value headers (WWW-Authenticate challenge, etc.)
// keep working across Echo.
func TestRecordedRequestHeadersAllOnEchoAdapter(t *testing.T) {
	e := newEcho()
	e.GET("/echo", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	srv := kiwa_echo.NewTestServer(t, e)
	srv.Request(kiwa.MethodGET, "/echo").
		Header("X-Multi", "a").
		Send()

	recorded := srv.RecordedRequests()
	if len(recorded) != 1 {
		t.Fatalf("recorded len = %d, want 1", len(recorded))
	}
	if got := recorded[0].HeadersAllValues("x-multi"); len(got) != 1 || got[0] != "a" {
		t.Fatalf("HeadersAllValues(x-multi) = %v, want [a]", got)
	}
	// Backward compat: Headers is still populated.
	if got := recorded[0].Headers["x-multi"]; got != "a" {
		t.Fatalf("Headers[x-multi] = %q, want a", got)
	}
}

// 16) RecordedRequest.Body is a defensive copy — mutating the caller's
// request buffer between successive Send calls (a common pattern when a
// benchmark loop reuses a scratch slice) must not retroactively rewrite an
// earlier RecordedRequest.Body entry. Regression coverage for v1.5-4
// inline fix generalised under v1.6-2 (Issue #608).
func TestRecordedRequestBodyIsDefensiveCopy(t *testing.T) {
	e := newEcho()
	e.POST("/echo", func(c echo.Context) error {
		body, _ := io.ReadAll(c.Request().Body)
		return c.Blob(http.StatusOK, "application/octet-stream", body)
	})
	srv := kiwa_echo.NewTestServer(t, e)

	// Reuse one 10-byte scratch slice across two Sends.
	buf := []byte("first-body")
	srv.Request(kiwa.MethodPOST, "/echo").Body(buf).Send()

	// Overwrite the caller's buffer in-place — the recorder's snapshot of
	// the first request must have already been captured via bodyCopy so
	// this mutation cannot leak into recorded[0].Body.
	for i := range buf {
		buf[i] = 'X'
	}

	// Second request with a distinct payload — the recorder log must have
	// two entries with the exact bodies dispatched.
	srv.Request(kiwa.MethodPOST, "/echo").Body([]byte("second-body")).Send()

	recorded := srv.RecordedRequests()
	if len(recorded) != 2 {
		t.Fatalf("recorded len = %d, want 2", len(recorded))
	}
	if got := string(recorded[0].Body); got != "first-body" {
		t.Fatalf("recorded[0].Body = %q, want first-body (caller buffer reuse leaked into recorder)", got)
	}
	if got := string(recorded[1].Body); got != "second-body" {
		t.Fatalf("recorded[1].Body = %q, want second-body", got)
	}
}

// 17) Response.Body() is a defensive copy — mutating the returned slice must
// not corrupt subsequent Body() / BodyString() / JSON() reads on the same
// Response. Regression coverage for v1.5-4 inline fix generalised under
// v1.6-2 (Issue #608).
func TestResponseBodyIsDefensiveCopy(t *testing.T) {
	e := newEcho()
	e.GET("/payload", func(c echo.Context) error {
		return c.Blob(http.StatusOK, "application/octet-stream", []byte("original"))
	})
	srv := kiwa_echo.NewTestServer(t, e)

	resp := srv.Request(kiwa.MethodGET, "/payload").Send()

	body := resp.Body()
	if string(body) != "original" {
		t.Fatalf("Body() = %q, want original", string(body))
	}
	// Mutate the returned slice in place.
	for i := range body {
		body[i] = 'X'
	}
	// Fresh Body() call must observe the un-mutated payload.
	if got := string(resp.Body()); got != "original" {
		t.Fatalf("Body() after caller mutation = %q, want original", got)
	}
	if got := resp.BodyString(); got != "original" {
		t.Fatalf("BodyString() after caller mutation = %q, want original", got)
	}
}

// 16) Body(buf) captures a defensive copy at ingress so mutating buf
// between .Body(buf) and .Send() cannot rewrite the wire payload.
// Regression coverage for v1.6-2 (Issue #608) minor 1.
func TestRequestBodyIngressDefensiveCopy(t *testing.T) {
	e := newEcho()
	e.POST("/echo", func(c echo.Context) error {
		body, _ := io.ReadAll(c.Request().Body)
		return c.Blob(http.StatusOK, "application/octet-stream", body)
	})
	srv := kiwa_echo.NewTestServer(t, e)

	buf := []byte("pristine")
	req := srv.Request(kiwa.MethodPOST, "/echo").Body(buf)
	for i := range buf {
		buf[i] = 'X'
	}
	resp := req.Send()
	if got := resp.BodyString(); got != "pristine" {
		t.Fatalf("dispatched body = %q, want pristine (Body() failed to copy at ingress)", got)
	}
	recorded := srv.RecordedRequests()
	if got := string(recorded[0].Body); got != "pristine" {
		t.Fatalf("recorded[0].Body = %q, want pristine", got)
	}
}
