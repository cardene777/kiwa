package kiwa

import (
	"fmt"
	"math"
	"reflect"
	"strings"
	"testing"
)

// AssertEqual fails the test if got and want are not deeply equal.
//
// On failure it emits a diff-friendly message:
//
//	kiwa assert_equal failed
//	  got  = <printed got>
//	  want = <printed want>
//	  hint = <optional hint>
//
// Comparison uses reflect.DeepEqual so structs, slices, maps, and pointer
// targets are all compared by value. Pass an optional hint string as the
// last argument to disambiguate which assertion raised the failure.
//
// AssertEqual accepts testing.TB so it works inside *testing.T, *testing.B,
// and *testing.F bodies, and calls t.Helper so failure stack frames point at
// the caller.
func AssertEqual(t testing.TB, got, want any, hint ...string) {
	t.Helper()
	if reflect.DeepEqual(got, want) {
		return
	}
	t.Fatalf("%s", formatEqualDiff(got, want, hint))
}

// AssertClose fails the test if |got - want| > tol.
//
// On failure it emits:
//
//	kiwa assert_close failed
//	  got   = <got>
//	  want  = <want>
//	  delta = <|got-want|>
//	  tol   = <tol>
//	  hint  = <optional hint>
//
// NaN on either side fails the assertion. Pass an optional hint string as
// the last argument to disambiguate which assertion raised the failure.
//
// AssertClose accepts testing.TB so it works inside *testing.T, *testing.B,
// and *testing.F bodies, and calls t.Helper so failure stack frames point at
// the caller.
func AssertClose(t testing.TB, got, want, tol float64, hint ...string) {
	t.Helper()
	if math.IsNaN(got) || math.IsNaN(want) {
		t.Fatalf("%s", formatCloseDiff(got, want, math.NaN(), tol, hint))
		return
	}
	delta := math.Abs(got - want)
	if delta <= tol {
		return
	}
	t.Fatalf("%s", formatCloseDiff(got, want, delta, tol, hint))
}

// formatEqualDiff builds the assert_equal failure message.
func formatEqualDiff(got, want any, hint []string) string {
	var b strings.Builder
	fmt.Fprintf(&b, "kiwa assert_equal failed\n")
	fmt.Fprintf(&b, "  got  = %+v\n", got)
	fmt.Fprintf(&b, "  want = %+v", want)
	if h := firstHint(hint); h != "" {
		fmt.Fprintf(&b, "\n  hint = %s", h)
	}
	return b.String()
}

// formatCloseDiff builds the assert_close failure message.
func formatCloseDiff(got, want, delta, tol float64, hint []string) string {
	var b strings.Builder
	fmt.Fprintf(&b, "kiwa assert_close failed\n")
	fmt.Fprintf(&b, "  got   = %v\n", got)
	fmt.Fprintf(&b, "  want  = %v\n", want)
	fmt.Fprintf(&b, "  delta = %v\n", delta)
	fmt.Fprintf(&b, "  tol   = %v", tol)
	if h := firstHint(hint); h != "" {
		fmt.Fprintf(&b, "\n  hint  = %s", h)
	}
	return b.String()
}

// firstHint returns the first non-empty hint, or "" if none.
func firstHint(hint []string) string {
	for _, h := range hint {
		if h != "" {
			return h
		}
	}
	return ""
}
