package kiwa_echo_test

// Lifecycle tests (v1.6-3 Stop() activation).
//
// Post-Stop Send() is a lifecycle contract violation and the echo adapter
// reports it through the captured testing.TB Fatalf handle so tests see a
// diagnostic failure instead of silently hitting the retired Echo
// instance. Directly asserting t.Fatalf inside a real *testing.T would
// abort the enclosing subtest, so these tests use a spy testing.TB that
// captures the Fatalf call and hands control back to the outer test for
// assertion — same trick the standard library uses in
// testing/internal/testdeps.

import (
	"fmt"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/labstack/echo/v4"

	"github.com/cardene777/kiwa-test-go"
	kiwa_echo "github.com/cardene777/kiwa-test-go/echo"
)

// spyTB is a minimal testing.TB implementation that captures Fatalf so
// tests can assert on it. Fatalf mirrors *testing.T.Fatalf's control-flow
// by calling runtime.Goexit on the calling goroutine — callers must run
// the harness call site inside runInGoroutine so the outer test survives.
type spyTB struct {
	testing.TB
	fatal   atomic.Bool
	fatalMu sync.Mutex
	fatals  []string
}

func (s *spyTB) Helper() {}

func (s *spyTB) Cleanup(fn func()) {
	// Discard cleanup registrations so the spy does not depend on a real
	// *testing.T. The echo harness always runs its own Stop on the spy at
	// teardown when the outer test cleans up its resources.
	_ = fn
}

func (s *spyTB) Fatalf(format string, args ...any) {
	s.fatalMu.Lock()
	s.fatals = append(s.fatals, fmt.Sprintf(format, args...))
	s.fatalMu.Unlock()
	s.fatal.Store(true)
	runtime.Goexit()
}

func (s *spyTB) FailNow() {
	s.fatal.Store(true)
	runtime.Goexit()
}

func (s *spyTB) DidFatal() bool { return s.fatal.Load() }

func (s *spyTB) LastFatal() string {
	s.fatalMu.Lock()
	defer s.fatalMu.Unlock()
	if len(s.fatals) == 0 {
		return ""
	}
	return s.fatals[len(s.fatals)-1]
}

// runInGoroutine runs fn on a separate goroutine so a runtime.Goexit call
// from Fatalf inside fn does not tear down the enclosing test goroutine.
// Returns after fn has returned or Goexited.
func runInGoroutine(fn func()) {
	done := make(chan struct{})
	go func() {
		defer close(done)
		fn()
	}()
	<-done
}

//  1. After srv.Stop() an explicit Send() reports the lifecycle violation
//     through t.Fatalf (captured via the spy TB).
func TestSendAfterStopReportsThroughFatalf_Echo(t *testing.T) {
	e := newEcho()
	e.GET("/ok", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	spy := &spyTB{TB: t}
	srv := kiwa_echo.NewTestServer(spy, e)

	// Warm exercise — pre-Stop call must go through so we know Send() is
	// only rejecting the post-Stop path.
	srv.Request(kiwa.MethodGET, "/ok").Send()
	if spy.DidFatal() {
		t.Fatalf("pre-Stop Send should not Fatalf, got: %s", spy.LastFatal())
	}

	srv.Stop()
	if !srv.IsStopped() {
		t.Fatalf("IsStopped after Stop = false, want true")
	}

	// Post-Stop Send must Fatalf. Run on a helper goroutine so the spy's
	// runtime.Goexit() does not tear down this test.
	runInGoroutine(func() {
		srv.Request(kiwa.MethodGET, "/ok").Send()
	})

	if !spy.DidFatal() {
		t.Fatalf("post-Stop Send() did not call Fatalf on the captured TB")
	}
	msg := spy.LastFatal()
	if !strings.Contains(msg, "Send() called after Stop()") {
		t.Fatalf("Fatalf message = %q, want it to mention post-Stop lifecycle", msg)
	}
	if !strings.Contains(msg, "GET") || !strings.Contains(msg, "/ok") {
		t.Fatalf("Fatalf message = %q, want request coordinates GET /ok", msg)
	}
}

//  2. RequestCount does not advance across a post-Stop Send() attempt —
//     the recorder must not observe traffic that Send() rejected.
func TestRequestCountFrozenAfterStop_Echo(t *testing.T) {
	e := newEcho()
	e.GET("/ok", func(c echo.Context) error { return c.String(http.StatusOK, "ok") })

	spy := &spyTB{TB: t}
	srv := kiwa_echo.NewTestServer(spy, e)

	srv.Request(kiwa.MethodGET, "/ok").Send()
	srv.Request(kiwa.MethodGET, "/ok").Send()
	before := srv.RequestCount()
	if before != 2 {
		t.Fatalf("pre-Stop RequestCount = %d, want 2", before)
	}

	srv.Stop()
	runInGoroutine(func() {
		srv.Request(kiwa.MethodGET, "/ok").Send()
	})

	after := srv.RequestCount()
	if after != before {
		t.Fatalf("post-Stop RequestCount = %d, want %d (recorder must not advance across rejected Send)", after, before)
	}
}

//  3. Send() reports http.NewRequest failures through the captured
//     testing.TB Fatalf handle instead of panicking, so a malformed path
//     surfaces as a diagnostic test failure with request coordinates.
//     A control character in the path is the minimum reproducible trigger
//     for http.NewRequest to fail (net/url rejects control chars before
//     the request is constructed).
func TestSendReportsNewRequestFailureThroughFatalf_Echo(t *testing.T) {
	e := newEcho()

	spy := &spyTB{TB: t}
	srv := kiwa_echo.NewTestServer(spy, e)

	// Control character in path — url.Parse rejects it so http.NewRequest
	// returns an error before we ever call into echo.
	badPath := "/ok\x7f"

	runInGoroutine(func() {
		srv.Request(kiwa.MethodGET, badPath).Send()
	})

	if !spy.DidFatal() {
		t.Fatalf("Send() with malformed path did not call Fatalf on the captured TB")
	}
	msg := spy.LastFatal()
	if !strings.Contains(msg, "kiwa-echo: build request") {
		t.Fatalf("Fatalf message = %q, want it to mention build request", msg)
	}
	if !strings.Contains(msg, "GET") {
		t.Fatalf("Fatalf message = %q, want request method GET", msg)
	}
	if !strings.Contains(msg, "invalid control character") {
		t.Fatalf("Fatalf message = %q, want net/url error mention", msg)
	}
}

//  4. On http.NewRequest failure the recorder does not observe the
//     rejected request — the recorder captures dispatch, not build failure.
func TestRecorderFrozenAfterNewRequestFailure_Echo(t *testing.T) {
	e := newEcho()

	spy := &spyTB{TB: t}
	srv := kiwa_echo.NewTestServer(spy, e)

	before := srv.RequestCount()
	runInGoroutine(func() {
		srv.Request(kiwa.MethodGET, "/ok\x7f").Send()
	})

	after := srv.RequestCount()
	if after != before {
		t.Fatalf("post-failure RequestCount = %d, want %d (recorder must not advance across rejected Send)", after, before)
	}
}

//  5. IsStopped starts false, flips true after Stop, and stays true across
//     repeated Stop calls (idempotency).
func TestIsStoppedReflectsLifecycle_Echo(t *testing.T) {
	e := newEcho()

	spy := &spyTB{TB: t}
	srv := kiwa_echo.NewTestServer(spy, e)

	if srv.IsStopped() {
		t.Fatalf("IsStopped before Stop = true, want false")
	}
	srv.Stop()
	if !srv.IsStopped() {
		t.Fatalf("IsStopped after Stop = false, want true")
	}
	srv.Stop() // idempotent
	srv.Stop()
	if !srv.IsStopped() {
		t.Fatalf("IsStopped after triple Stop = false, want true")
	}
}
