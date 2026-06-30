package kiwa_test

import (
	"sync"
	"testing"

	"github.com/cardene777/kiwa-test-go"
)

func TestSetupUnitEnv_ReturnsEnvWithDefaultModeMock(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})

	if env.Mode() != kiwa.ModeMock {
		t.Fatalf("default mode = %s, want Mock", env.Mode())
	}
	if env.Seed() != nil {
		t.Fatalf("default seed = %v, want nil", *env.Seed())
	}
	if env.Label() != "" {
		t.Fatalf("default label = %q, want empty", env.Label())
	}
	if env.IsStopped() {
		t.Fatalf("default IsStopped = true, want false")
	}
}

func TestSetupUnitEnv_ReturnsEnvWithExplicitLiveModeAndSeed(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{
		Mode:  kiwa.ModeLive,
		Seed:  kiwa.Seed(7),
		Label: "integration-a",
	})

	if env.Mode() != kiwa.ModeLive {
		t.Fatalf("mode = %s, want Live", env.Mode())
	}
	if env.Seed() == nil || *env.Seed() != 7 {
		t.Fatalf("seed = %v, want 7", env.Seed())
	}
	if env.Label() != "integration-a" {
		t.Fatalf("label = %q, want integration-a", env.Label())
	}
}

func TestFixtureIDsAreMonotonicWithinSameProcess(t *testing.T) {
	envA := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
	envB := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
	envC := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})

	if envB.ID() <= envA.ID() {
		t.Fatalf("envB.ID(%d) not > envA.ID(%d)", envB.ID(), envA.ID())
	}
	if envC.ID() <= envB.ID() {
		t.Fatalf("envC.ID(%d) not > envB.ID(%d)", envC.ID(), envB.ID())
	}
}

func TestManualStopMarksFixtureStopped(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
	if env.IsStopped() {
		t.Fatalf("IsStopped before Stop = true, want false")
	}
	env.Stop()
	if !env.IsStopped() {
		t.Fatalf("IsStopped after Stop = false, want true")
	}
}

func TestManualStopIsIdempotent(t *testing.T) {
	env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
	env.Stop()
	env.Stop()
	env.Stop()
	if !env.IsStopped() {
		t.Fatalf("IsStopped after triple Stop = false, want true")
	}
}

func TestCleanupRunsStopAutomatically(t *testing.T) {
	// Run SetupUnitEnv inside a subtest so t.Cleanup fires before the parent
	// test inspects the captured env.
	var captured *kiwa.UnitEnv
	t.Run("subtest", func(t *testing.T) {
		captured = kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
		if captured.IsStopped() {
			t.Fatalf("captured.IsStopped inside subtest = true, want false")
		}
	})
	// Subtest has returned -> t.Cleanup handlers have run.
	if !captured.IsStopped() {
		t.Fatalf("captured.IsStopped after subtest = false, want true")
	}
}

func TestCleanupAfterManualStopDoesNotPanic(t *testing.T) {
	// Both paths (manual stop + cleanup, cleanup-only) must be safe; this
	// exercises the manual-stop-then-cleanup path. The test passes if the
	// runtime does not panic when the subtest cleanup fires Stop() a second
	// time.
	t.Run("manual-stop-then-cleanup", func(t *testing.T) {
		env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
		env.Stop()
	})
}

func TestSeedHelperReturnsPointerToValue(t *testing.T) {
	got := kiwa.Seed(42)
	if got == nil {
		t.Fatal("Seed returned nil")
	}
	if *got != 42 {
		t.Fatalf("*Seed(42) = %d, want 42", *got)
	}
}

func TestModeStringLabels(t *testing.T) {
	cases := []struct {
		mode kiwa.Mode
		want string
	}{
		{kiwa.ModeMock, "Mock"},
		{kiwa.ModeLive, "Live"},
		{kiwa.Mode(99), "Unknown"},
	}
	for _, tc := range cases {
		if got := tc.mode.String(); got != tc.want {
			t.Errorf("Mode(%d).String() = %q, want %q", tc.mode, got, tc.want)
		}
	}
}

func TestConcurrentSetupGeneratesDistinctIDs(t *testing.T) {
	// Concurrency observation: fixtures created from parallel goroutines must
	// still receive unique IDs (atomic.Uint64 contract).
	const n = 50
	ids := make([]uint64, n)
	var wg sync.WaitGroup
	wg.Add(n)
	for i := 0; i < n; i++ {
		i := i
		go func() {
			defer wg.Done()
			env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{})
			ids[i] = env.ID()
		}()
	}
	wg.Wait()

	seen := make(map[uint64]struct{}, n)
	for _, id := range ids {
		if _, dup := seen[id]; dup {
			t.Fatalf("duplicate fixture id %d in concurrent setup", id)
		}
		seen[id] = struct{}{}
	}
}
