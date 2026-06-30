// Package poc is a kiwa-test-go usage example.
//
// The package itself implements two trivial domain helpers (Add, Average)
// that the test file exercises through the kiwa fixture + assertion helpers
// — the goal is to demonstrate the kiwa API, not to ship production code.
package poc

// Add returns a + b. Trivial wrapper used by the poc test to demonstrate
// kiwa.AssertEqual on an integer return.
func Add(a, b int) int {
	return a + b
}

// Average returns the arithmetic mean of xs, or 0.0 for an empty slice.
//
// Used by the poc test to demonstrate kiwa.AssertClose on a float result
// that may include small rounding noise.
func Average(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	var sum float64
	for _, x := range xs {
		sum += x
	}
	return sum / float64(len(xs))
}
