// Package kiwa is the Go testing.T adapter for the kiwa polyglot test framework.
//
// It mirrors the @kiwa-test/core (TypeScript) and kiwa-test-rs (Rust) contracts:
// a deterministic fixture (SetupUnitEnv) with mode selection (Mock / Live),
// automatic cleanup via testing.T.Cleanup, and diff-aware assertion helpers
// (AssertEqual / AssertClose).
//
// Quick start:
//
//	import (
//	    "testing"
//
//	    "github.com/cardene777/kiwa-test-go"
//	)
//
//	func TestExample(t *testing.T) {
//	    env := kiwa.SetupUnitEnv(t, kiwa.UnitOpts{Mode: kiwa.ModeMock, Seed: kiwa.Seed(42)})
//	    kiwa.AssertEqual(t, env.Mode(), kiwa.ModeMock)
//	}
//
// Cleanup runs automatically when the test function returns; tests cannot
// forget to release fixtures.
package kiwa

// Version is the kiwa-test-go module version, kept in sync with the git tag
// used for pkg.go.dev publish.
const Version = "0.1.0"
