package kiwa_test

import (
	"math"
	"strings"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

// recordedT captures the message passed to t.Fatalf so failure-path tests can
// inspect it without aborting the surrounding test. It implements just enough
// of testing.TB for AssertEqual / AssertClose to use.
type recordedT struct {
	testing.TB
	failed bool
	msg    string
}

func (r *recordedT) Helper() {}
func (r *recordedT) Fatalf(format string, args ...any) {
	r.failed = true
	// Mimic testing.T.Fatalf by formatting via fmt rules; here we only need
	// the first format arg (assertion helpers always pass a single "%s").
	if len(args) == 1 {
		if s, ok := args[0].(string); ok {
			r.msg = s
			return
		}
	}
	r.msg = format
}

func TestAssertEqual_PassesOnEqualValues(t *testing.T) {
	kiwa.AssertEqual(t, 2+2, 4)
	kiwa.AssertEqual(t, "foo", "foo")
	kiwa.AssertEqual(t, []int{1, 2, 3}, []int{1, 2, 3})
	kiwa.AssertEqual(t, map[string]int{"a": 1}, map[string]int{"a": 1})
}

func TestAssertEqual_FailsOnMismatch(t *testing.T) {
	rec := &recordedT{}
	// Defer panic recovery so the helper can call Fatalf -> our recorded
	// stub without the test exploding.
	kiwa.AssertEqual(rec, 1, 2)
	if !rec.failed {
		t.Fatal("AssertEqual did not fail on mismatch")
	}
	if !strings.Contains(rec.msg, "kiwa assert_equal failed") {
		t.Fatalf("failure message missing header, got: %s", rec.msg)
	}
	if !strings.Contains(rec.msg, "got  = 1") {
		t.Fatalf("failure message missing got line, got: %s", rec.msg)
	}
	if !strings.Contains(rec.msg, "want = 2") {
		t.Fatalf("failure message missing want line, got: %s", rec.msg)
	}
}

func TestAssertEqual_HintAppearsInFailureMessage(t *testing.T) {
	rec := &recordedT{}
	kiwa.AssertEqual(rec, []int{1}, []int{1, 2}, "sequence diverged")
	if !rec.failed {
		t.Fatal("AssertEqual did not fail")
	}
	if !strings.Contains(rec.msg, "hint = sequence diverged") {
		t.Fatalf("failure message missing hint, got: %s", rec.msg)
	}
}

func TestAssertClose_PassesWithinTolerance(t *testing.T) {
	kiwa.AssertClose(t, 1.0, 1.0+1e-9, 1e-6)
	kiwa.AssertClose(t, 0.0, 0.0, 0.0)
	kiwa.AssertClose(t, -1.5, -1.5+1e-12, 1e-6)
}

func TestAssertClose_FailsOutsideTolerance(t *testing.T) {
	rec := &recordedT{}
	kiwa.AssertClose(rec, 1.0, 2.0, 1e-6)
	if !rec.failed {
		t.Fatal("AssertClose did not fail outside tolerance")
	}
	if !strings.Contains(rec.msg, "kiwa assert_close failed") {
		t.Fatalf("failure message missing header, got: %s", rec.msg)
	}
	if !strings.Contains(rec.msg, "delta = 1") {
		t.Fatalf("failure message missing delta, got: %s", rec.msg)
	}
}

func TestAssertClose_HintAppearsInFailureMessage(t *testing.T) {
	rec := &recordedT{}
	kiwa.AssertClose(rec, 1.0, 2.0, 1e-6, "floating drift")
	if !rec.failed {
		t.Fatal("AssertClose did not fail")
	}
	if !strings.Contains(rec.msg, "hint  = floating drift") {
		t.Fatalf("failure message missing hint, got: %s", rec.msg)
	}
}

func TestAssertClose_NaNAlwaysFails(t *testing.T) {
	rec := &recordedT{}
	kiwa.AssertClose(rec, math.NaN(), 1.0, 1.0)
	if !rec.failed {
		t.Fatal("AssertClose(NaN, ...) did not fail")
	}

	rec2 := &recordedT{}
	kiwa.AssertClose(rec2, 1.0, math.NaN(), 1.0)
	if !rec2.failed {
		t.Fatal("AssertClose(..., NaN) did not fail")
	}
}
