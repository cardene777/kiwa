package kiwa

import (
	"sync/atomic"
	"testing"
)

// Mode is the kiwa fixture execution mode passed to SetupUnitEnv.
//
// ModeMock builds a fully deterministic in-process fixture (no network, no
// filesystem). ModeLive opts into real-resource setup; adapters layered on
// top interpret the flag.
type Mode int

const (
	// ModeMock is the default deterministic in-process fixture mode.
	ModeMock Mode = iota
	// ModeLive opts into real-resource fixtures (network / filesystem).
	ModeLive
)

// String returns a human-readable mode label used in diagnostics.
func (m Mode) String() string {
	switch m {
	case ModeMock:
		return "Mock"
	case ModeLive:
		return "Live"
	default:
		return "Unknown"
	}
}

// UnitOpts configures SetupUnitEnv.
//
// All fields are optional. The zero value selects ModeMock with no seed and
// no label, matching the TypeScript / Rust sibling defaults.
type UnitOpts struct {
	// Mode selects deterministic Mock (default) or Live fixtures.
	Mode Mode
	// Seed is an optional deterministic seed forwarded to downstream adapters.
	// Use the Seed helper to construct one inline.
	Seed *uint64
	// Label is an optional fixture label surfaced in assertion failure
	// messages so multi-fixture tests can disambiguate which env raised the
	// failure.
	Label string
}

// Seed returns a pointer to v, suitable for UnitOpts.Seed.
//
// Go does not allow taking the address of a literal directly, so this helper
// keeps the call site readable:
//
//	kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Seed: kiwa.Seed(42)})
func Seed(v uint64) *uint64 {
	return &v
}

// UnitEnv is the fixture handle returned by SetupUnitEnv.
//
// It is intentionally not safe for concurrent use across goroutines —
// fixtures are scoped to the test goroutine that created them. Cleanup runs
// via t.Cleanup so tests cannot leak state across cases.
type UnitEnv struct {
	id      uint64
	mode    Mode
	seed    *uint64
	label   string
	stopped atomic.Bool
}

// nextID is a monotonic id generator so multiple concurrent fixtures stay
// distinguishable in log output.
var nextID atomic.Uint64

// ID returns the monotonic per-process fixture id.
func (e *UnitEnv) ID() uint64 {
	return e.id
}

// Mode returns the configured fixture mode.
func (e *UnitEnv) Mode() Mode {
	return e.mode
}

// Seed returns the configured deterministic seed, or nil if unset.
func (e *UnitEnv) Seed() *uint64 {
	return e.seed
}

// Label returns the configured fixture label, or "" if unset.
func (e *UnitEnv) Label() string {
	return e.label
}

// IsStopped reports whether Stop has run (either explicitly or via the
// t.Cleanup handler registered by SetupUnitEnv).
func (e *UnitEnv) IsStopped() bool {
	return e.stopped.Load()
}

// Stop releases fixture resources. Idempotent — re-invocations are no-ops so
// the t.Cleanup handler can safely call Stop after a manual Stop().
func (e *UnitEnv) Stop() {
	e.stopped.Store(true)
}

// SetupUnitEnv builds a kiwa unit test fixture bound to t.
//
// It mirrors the @kiwa-test/core setupEnv contract and the Rust setup_env
// contract. The returned *UnitEnv is automatically stopped when t finishes
// via a t.Cleanup handler — tests cannot forget cleanup.
//
// SetupUnitEnv accepts testing.TB so it works inside *testing.T,
// *testing.B, and *testing.F bodies, and calls t.Helper so failure stack
// frames point at the caller.
func SetupUnitEnv(t testing.TB, opts UnitOpts) *UnitEnv {
	t.Helper()
	env := &UnitEnv{
		id:    nextID.Add(1),
		mode:  opts.Mode,
		seed:  opts.Seed,
		label: opts.Label,
	}
	t.Cleanup(env.Stop)
	return env
}
