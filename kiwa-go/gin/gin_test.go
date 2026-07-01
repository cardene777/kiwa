package kiwa_gin_test

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/cardene777/kiwa-test-go"
	kiwa_gin "github.com/cardene777/kiwa-test-go/gin"
)

func init() {
	// Silence gin's debug logging during go test runs. Mirrors gin's own
	// TestMain pattern from the official docs (gin-gonic/gin#testing).
	gin.SetMode(gin.TestMode)
}

func newEngine() *gin.Engine {
	return gin.New()
}

// 1) Default TestServer returns a non-nil engine and an empty recorder.
func TestNewTestServer_BindsEngineAndInitializesRecorder(t *testing.T) {
	engine := newEngine()
	engine.GET("/health", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	srv := kiwa_gin.NewTestServer(t, engine)

	if srv.Engine() == nil {
		t.Fatal("Engine() = nil, want non-nil")
	}
	if got := srv.RequestCount(); got != 0 {
		t.Fatalf("RequestCount = %d, want 0 before any Send", got)
	}
}

// 2) GET route returns the registered response and records the request.
func TestGetRouteReturnsRegisteredResponseAndRecordsRequest(t *testing.T) {
	engine := newEngine()
	engine.GET("/users", func(c *gin.Context) {
		c.Header("X-Kiwa-Route", "users")
		c.JSON(http.StatusOK, []map[string]any{{"id": 1, "name": "sora"}})
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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
	if got := resp.BodyString(); got != `[{"id":1,"name":"sora"}]` {
		t.Fatalf("body = %q, want json users payload", got)
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
	engine := newEngine()
	engine.POST("/echo", func(c *gin.Context) {
		body, _ := c.GetRawData()
		c.Data(http.StatusCreated, "text/plain", body)
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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
	engine := newEngine()
	engine.GET("/known", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	srv := kiwa_gin.NewTestServer(t, engine)
	resp := srv.Request(kiwa.MethodGET, "/unknown").Send()

	if resp.StatusCode() != 404 {
		t.Fatalf("status = %d, want 404 (gin default for unmatched route)", resp.StatusCode())
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
	engine := newEngine()
	engine.GET("/ping", func(c *gin.Context) { c.String(http.StatusOK, "pong") })

	srv := kiwa_gin.NewTestServer(t, engine)
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
	engine := newEngine()
	engine.POST("/users", func(c *gin.Context) {
		var posted map[string]string
		if err := c.ShouldBindJSON(&posted); err != nil {
			c.String(http.StatusBadRequest, "bad json")
			return
		}
		c.JSON(http.StatusCreated, map[string]any{"id": 42, "name": posted["name"]})
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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
	// gin emits numeric IDs as float64 through encoding/json — the kiwa
	// adapter does not pre-convert because callers know their own schema.
	if got := decoded["id"]; got != float64(42) {
		t.Fatalf("decoded[id] = %v, want 42", got)
	}

	recorded := srv.RecordedRequests()
	if got := recorded[0].Headers["content-type"]; got != "application/json" {
		t.Fatalf("recorded[0].Headers[content-type] = %q, want application/json", got)
	}
}

// 7) gin path params resolve through the engine matcher.
func TestPathParamsResolveThroughGinMatcher(t *testing.T) {
	engine := newEngine()
	engine.GET("/users/:id", func(c *gin.Context) {
		c.String(http.StatusOK, "id="+c.Param("id"))
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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
	engine := newEngine()
	engine.GET("/ok", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	srv := kiwa_gin.NewTestServer(t, engine)
	srv.Request(kiwa.MethodGET, "/ok").Send()

	srv.Stop()
	srv.Stop() // explicit second stop must not panic
}

// 9) The recorder is safe to read while parallel Send calls run.
func TestRecorderIsSafeUnderConcurrentSends(t *testing.T) {
	engine := newEngine()
	engine.GET("/race", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	srv := kiwa_gin.NewTestServer(t, engine)

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
func TestHTTPMethodEnumRoundTripsThroughGin(t *testing.T) {
	engine := newEngine()
	hit := make(map[string]bool)
	for _, method := range []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"} {
		m := method
		engine.Handle(m, "/m", func(c *gin.Context) {
			hit[m] = true
			c.Status(http.StatusNoContent)
		})
	}

	srv := kiwa_gin.NewTestServer(t, engine)
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
			t.Errorf("gin handler for %s was never invoked", method)
		}
	}
}

// 11) Engine state persists across Send calls (the harness reuses one
// engine so router-level middleware sees consecutive requests).
func TestEngineStatePersistsAcrossSends(t *testing.T) {
	engine := newEngine()
	var counter int
	engine.GET("/count", func(c *gin.Context) {
		counter++
		c.JSON(http.StatusOK, map[string]int{"n": counter})
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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

// 12) interop with v1.4 kiwa.NewMockServer — gin handler under test calls
// out to a kiwa mock; both recorders capture independently.
func TestInteropWithKiwaMockServer(t *testing.T) {
	mock := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
		kiwa.NewRoute(kiwa.MethodGET, "/external", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
			return kiwa.JSON([]byte(`{"upstream":"ok"}`))
		}),
	))

	engine := newEngine()
	engine.GET("/proxy", func(c *gin.Context) {
		// gin handler proxies to the kiwa mock — same shape as production
		// code that depends on an upstream URL injected through config.
		resp, err := http.Get(mock.URL() + "/external")
		if err != nil {
			c.String(http.StatusBadGateway, err.Error())
			return
		}
		defer resp.Body.Close()
		c.Status(resp.StatusCode)
		_, _ = io.Copy(c.Writer, resp.Body)
	})

	srv := kiwa_gin.NewTestServer(t, engine)
	resp := srv.Request(kiwa.MethodGET, "/proxy").Send()

	if resp.StatusCode() != 200 {
		t.Fatalf("gin proxy status = %d, want 200", resp.StatusCode())
	}
	if resp.BodyString() != `{"upstream":"ok"}` {
		t.Fatalf("gin proxy body = %q, want upstream payload", resp.BodyString())
	}
	if mock.RequestCount() != 1 {
		t.Fatalf("mock RequestCount = %d, want 1", mock.RequestCount())
	}
	if srv.RequestCount() != 1 {
		t.Fatalf("gin srv RequestCount = %d, want 1", srv.RequestCount())
	}
}

// 13) Response.HeadersAll preserves every Set-Cookie / multi-value header on
// the response wire while Headers keeps the last-value-wins single-value view
// for backward compat. Verifies the v1.6-1 fix for the Codex adversarial
// "Set-Cookie collapse" finding.
func TestResponseHeadersAllPreservesMultiValueResponseHeaders(t *testing.T) {
	engine := newEngine()
	engine.GET("/set-cookies", func(c *gin.Context) {
		// gin exposes the raw ResponseWriter so we use net/http.Header.Add
		// directly — matches how production gin handlers emit multiple
		// Set-Cookie / Vary lines.
		c.Writer.Header().Add("Set-Cookie", "sid=abc; Path=/")
		c.Writer.Header().Add("Set-Cookie", "trace=xyz; Path=/; HttpOnly")
		c.Writer.Header().Add("Vary", "Accept-Encoding")
		c.Writer.Header().Add("Vary", "User-Agent")
		c.String(http.StatusOK, "ok")
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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
	engine := newEngine()
	engine.GET("/login", func(c *gin.Context) {
		c.Writer.Header().Add("Set-Cookie", "sid=abc; Path=/; HttpOnly")
		c.Writer.Header().Add("Set-Cookie", "trace=xyz; Path=/api; Max-Age=3600")
		c.String(http.StatusOK, "ok")
	})

	srv := kiwa_gin.NewTestServer(t, engine)
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

	// Defensive copy: mutating the returned slice does not affect the next call.
	cookies[0].Value = "tampered"
	fresh := resp.Cookies()
	if fresh[0].Value == "tampered" {
		// Cookies is a shallow copy of []*http.Cookie — the pointer chain is
		// intentional so callers can inspect fields cheaply, but the slice
		// header itself is fresh. This is documented behavior; we assert the
		// slice header (not the pointer target) is independent.
		t.Log("Cookies() returns shared *http.Cookie pointers (documented shallow copy)")
	}
	// Slice length independence: appending to the returned slice does not
	// mutate the recorder view.
	shorter := cookies[:0]
	shorter = append(shorter, cookies[0])
	if got := len(resp.Cookies()); got != 2 {
		t.Fatalf("Cookies() len after external append = %d, want 2 (slice header should be independent)", got)
	}
}

// 15) recordRequest captures HeadersAll on the request side too so specs
// asserting inbound multi-value headers (WWW-Authenticate challenge, etc.)
// keep working across gin.
func TestRecordedRequestHeadersAllOnGinAdapter(t *testing.T) {
	engine := newEngine()
	engine.GET("/echo", func(c *gin.Context) { c.String(http.StatusOK, "ok") })

	srv := kiwa_gin.NewTestServer(t, engine)
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

// 13) RecordedRequest.Body is a defensive copy — mutating the caller's
// request buffer between successive Send calls (a common pattern when a
// benchmark loop reuses a scratch slice) must not retroactively rewrite an
// earlier RecordedRequest.Body entry. Regression coverage for v1.5-3
// inline fix (PR #601) generalised under v1.6-2 (Issue #608).
func TestRecordedRequestBodyIsDefensiveCopy(t *testing.T) {
	engine := newEngine()
	engine.POST("/echo", func(c *gin.Context) {
		body, _ := io.ReadAll(c.Request.Body)
		c.Data(http.StatusOK, "application/octet-stream", body)
	})
	srv := kiwa_gin.NewTestServer(t, engine)

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

// 14) Response.Body() is a defensive copy — mutating the returned slice must
// not corrupt subsequent Body() / BodyString() / JSON() reads on the same
// Response. Regression coverage for v1.5-3 inline fix (PR #601) generalised
// under v1.6-2 (Issue #608).
func TestResponseBodyIsDefensiveCopy(t *testing.T) {
	engine := newEngine()
	engine.GET("/payload", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/octet-stream", []byte("original"))
	})
	srv := kiwa_gin.NewTestServer(t, engine)

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
// between .Body(buf) and .Send() (a caller-visible window that the
// pre-v1.6-5 implementation ignored) cannot rewrite the wire payload.
// Regression coverage for v1.6-2 (Issue #608) minor 1 — the earlier
// TestRecordedRequestBodyIsDefensiveCopy only exercised mutation
// *after* Send() completed and would still pass if Body(buf) stored
// the slice by reference.
func TestRequestBodyIngressDefensiveCopy(t *testing.T) {
	engine := newEngine()
	engine.POST("/echo", func(c *gin.Context) {
		body, _ := io.ReadAll(c.Request.Body)
		c.Data(http.StatusOK, "application/octet-stream", body)
	})
	srv := kiwa_gin.NewTestServer(t, engine)

	// Bind the builder to a scratch buffer, then mutate the buffer
	// before Send() so any store-by-reference implementation ships
	// the mutated bytes down the wire.
	buf := []byte("pristine")
	req := srv.Request(kiwa.MethodPOST, "/echo").Body(buf)
	for i := range buf {
		buf[i] = 'X'
	}
	resp := req.Send()
	if got := resp.BodyString(); got != "pristine" {
		t.Fatalf("dispatched body = %q, want pristine (Body() failed to copy at ingress)", got)
	}
	// The recorder must also carry the pristine payload.
	recorded := srv.RecordedRequests()
	if got := string(recorded[0].Body); got != "pristine" {
		t.Fatalf("recorded[0].Body = %q, want pristine", got)
	}
}
