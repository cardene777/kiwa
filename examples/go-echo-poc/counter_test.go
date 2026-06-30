package counter_test

import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	kiwa_echo "github.com/cardene777/kiwa-test-go/echo"

	counter "github.com/cardene777/kiwa/examples/go-echo-poc"
)

func setup(t *testing.T) (*counter.Counter, *kiwa_echo.TestServer) {
	t.Helper()
	c := counter.NewCounter()
	e := counter.NewEcho(c)
	return c, kiwa_echo.NewTestServer(t, e)
}

// 1) GET /healthz returns 200 "ok" — sanity check for the Echo wiring.
func TestHealthzReturnsOK(t *testing.T) {
	_, srv := setup(t)
	resp := srv.Request(kiwa.MethodGET, "/healthz").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), 200)
	kiwa.AssertEqual(t, resp.BodyString(), "ok")
}

// 2) GET /count starts at zero.
func TestCountStartsAtZero(t *testing.T) {
	_, srv := setup(t)
	resp := srv.Request(kiwa.MethodGET, "/count").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), 200)

	var decoded map[string]int
	if err := resp.JSON(&decoded); err != nil {
		t.Fatalf("decode: %v", err)
	}
	kiwa.AssertEqual(t, decoded["count"], 0)
}

// 3) POST /count/incr increments the counter and the next GET reflects it.
func TestIncrementUpdatesCount(t *testing.T) {
	c, srv := setup(t)
	for i := 1; i <= 3; i++ {
		resp := srv.Request(kiwa.MethodPOST, "/count/incr").Send()
		kiwa.AssertEqual(t, resp.StatusCode(), 200)

		var decoded map[string]int
		if err := resp.JSON(&decoded); err != nil {
			t.Fatalf("decode incr #%d: %v", i, err)
		}
		kiwa.AssertEqual(t, decoded["count"], i)
	}
	kiwa.AssertEqual(t, c.Value(), 3)
}

// 4) POST /count/reset sets the value to the requested target.
func TestResetSetsCounterToRequestedValue(t *testing.T) {
	c, srv := setup(t)
	resp := srv.Request(kiwa.MethodPOST, "/count/reset").
		JSON([]byte(`{"to":42}`)).
		Send()
	kiwa.AssertEqual(t, resp.StatusCode(), 200)
	kiwa.AssertEqual(t, c.Value(), 42)
}

// 5) POST /count/reset surfaces a 400 for malformed JSON.
func TestResetRejectsMalformedJSON(t *testing.T) {
	_, srv := setup(t)
	resp := srv.Request(kiwa.MethodPOST, "/count/reset").
		Body([]byte("not json")).
		Header("Content-Type", "application/json").
		Send()
	kiwa.AssertEqual(t, resp.StatusCode(), 400)

	var decoded map[string]string
	if err := resp.JSON(&decoded); err != nil {
		t.Fatalf("decode: %v", err)
	}
	kiwa.AssertEqual(t, decoded["error"], "bad json")
}

// 6) Unknown route returns echo's default 404.
func TestUnknownRouteReturns404(t *testing.T) {
	_, srv := setup(t)
	resp := srv.Request(kiwa.MethodGET, "/missing").Send()
	kiwa.AssertEqual(t, resp.StatusCode(), 404)
}

// 7) Recorder captures every dispatched request including the failing one.
func TestRecorderCapturesEveryCounterCall(t *testing.T) {
	_, srv := setup(t)

	srv.Request(kiwa.MethodGET, "/healthz").Send()
	srv.Request(kiwa.MethodPOST, "/count/incr").Send()
	srv.Request(kiwa.MethodGET, "/count").Send()
	srv.Request(kiwa.MethodGET, "/nope").Send()

	kiwa.AssertEqual(t, srv.RequestCount(), 4)
	recorded := srv.RecordedRequests()
	kiwa.AssertEqual(t, recorded[0].Path, "/healthz")
	kiwa.AssertEqual(t, recorded[1].Path, "/count/incr")
	kiwa.AssertEqual(t, recorded[2].Path, "/count")
	kiwa.AssertEqual(t, recorded[3].Path, "/nope")
}

// 8) Each TestServer isolates its own Counter — parallel runs do not bleed.
func TestEachTestServerIsolatesItsOwnCounter(t *testing.T) {
	cA, srvA := setup(t)
	cB, srvB := setup(t)

	srvA.Request(kiwa.MethodPOST, "/count/incr").Send()
	srvA.Request(kiwa.MethodPOST, "/count/incr").Send()
	srvB.Request(kiwa.MethodPOST, "/count/incr").Send()

	kiwa.AssertEqual(t, cA.Value(), 2)
	kiwa.AssertEqual(t, cB.Value(), 1)
}
