// Package kiwa is the Go testing.T adapter for the kiwa polyglot test framework.
//
// It mirrors the @kiwa-test/core (TypeScript) and kiwa-test-rs (Rust) contracts:
//   - SetupUnitEnv — a deterministic fixture with mode selection (Mock / Live),
//     automatic cleanup via testing.T.Cleanup, and diff-aware assertion helpers
//     (AssertEqual / AssertClose).
//   - NewMockServer — an integration test helper that wraps net/http/httptest
//     with a route table and a request recorder, releasing the bound port via
//     t.Cleanup so http.Client tests stay leak-free.
//
// Quick start (unit):
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
// Quick start (integration):
//
//	func TestUsers(t *testing.T) {
//	    srv := kiwa.NewMockServer(t, kiwa.MockServerOpts{}.WithRoute(
//	        kiwa.NewRoute(kiwa.MethodGET, "/users", func(_ kiwa.RecordedRequest) kiwa.MockResponse {
//	            return kiwa.JSON([]byte("[]"))
//	        }),
//	    ))
//	    // ... point an http.Client at srv.URL(), then assert on srv.RecordedRequests() ...
//	}
//
// Cleanup runs automatically when the test function returns; tests cannot
// forget to release fixtures or ports.
package kiwa

// Version is the kiwa-test-go module version, kept in sync with the git tag
// used for pkg.go.dev publish.
const Version = "0.2.0"
