package poc_test

import (
	"testing"

	"github.com/cardene777/kiwa-test-go"
	poc "github.com/cardene777/kiwa/examples/go-testing-poc"
)

// 1) SetupUnitEnv default mode is Mock with auto-cleanup via t.Cleanup.
func TestKiwaFixtureDefaultModeIsMock(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})

	kiwa.AssertEqual(t, env.Mode(), kiwa.ModeMock)
	kiwa.AssertEqual(t, env.IsStopped(), false)
}

// 2) SetupUnitEnv with explicit seed + label round-trips the options.
func TestKiwaFixtureWithSeedAndLabel(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
		Mode:  kiwa.ModeLive,
		Seed:  kiwa.Seed(123),
		Label: "poc-fixture",
	})

	kiwa.AssertEqual(t, env.Mode(), kiwa.ModeLive)
	kiwa.AssertEqual(t, *env.Seed(), uint64(123))
	kiwa.AssertEqual(t, env.Label(), "poc-fixture")
}

// 3) AssertEqual on domain Add (integer return).
func TestAddViaKiwaAssertEqual(t *testing.T) {
	kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Seed: kiwa.Seed(1)})

	kiwa.AssertEqual(t, poc.Add(2, 3), 5)
	kiwa.AssertEqual(t, poc.Add(-1, 1), 0)
}

// 4) AssertClose on domain Average (float result with rounding noise).
func TestAverageViaKiwaAssertClose(t *testing.T) {
	kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Seed: kiwa.Seed(2)})

	// 0.1 + 0.2 + 0.3 / 3 has IEEE-754 rounding error; AssertClose absorbs it.
	kiwa.AssertClose(t, poc.Average([]float64{0.1, 0.2, 0.3}), 0.2, 1e-9)
	kiwa.AssertClose(t, poc.Average(nil), 0.0, 0.0)
}

// 5) Cleanup runs Stop automatically across nested subtests.
func TestNestedSubtestsRunCleanupIndependently(t *testing.T) {
	var captured *kiwa.UnitEnv
	t.Run("nested", func(t *testing.T) {
		captured = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Label: "nested"})
		kiwa.AssertEqual(t, captured.IsStopped(), false)
	})
	// After the subtest returns, the captured fixture must be stopped.
	kiwa.AssertEqual(t, captured.IsStopped(), true, "subtest cleanup ran")
}
