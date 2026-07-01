// Package recorder tests exercise the request-to-Snapshot conversion
// and the Log deep-copy semantics in isolation from the adapter surface.
// These tests are the SSOT for the v1.6-2 (Issue #608) hazards that
// v1.6-5 (Issue #611) factored into this package — see the individual
// test godocs for the exact hazard each one nails down.
package recorder

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"sync"
	"testing"
)

// TestFromServerBodyIsDefensiveCopy exercises the FromServer path
// directly (bypassing MockServer / gin / echo) so a future refactor
// that accidentally returns the io.ReadAll buffer without a copy
// still trips a failing unit test. This is the v1.6-2 (Issue #608)
// minor 3 hazard — the pre-v1.6-5 integration test walked the whole
// httptest.Server round trip and would pass even if the recorder
// stopped copying because io.ReadAll returned a fresh allocation on
// every call. FromServer is the SSOT so exercising it directly is
// the tightest possible coverage.
func TestFromServerBodyIsDefensiveCopy(t *testing.T) {
	buf := []byte("payload-A")
	req, err := http.NewRequest(http.MethodPost, "http://example.test/echo", bytes.NewReader(buf))
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}

	snap := FromServer(req)
	if string(snap.Body) != "payload-A" {
		t.Fatalf("snap.Body = %q, want payload-A", snap.Body)
	}

	// Reading the restored req.Body must return the same bytes — the
	// recorder's contract is that FromServer captures the payload then
	// restores req.Body so downstream handlers can re-read it.
	restored, err := io.ReadAll(req.Body)
	if err != nil {
		t.Fatalf("re-read req.Body: %v", err)
	}
	if string(restored) != "payload-A" {
		t.Fatalf("restored req.Body = %q, want payload-A", restored)
	}

	// Prove Snapshot.Body does not alias the restored req.Body reader by
	// mutating restored in place — the snapshot must not change.
	for i := range restored {
		restored[i] = 'X'
	}
	if string(snap.Body) != "payload-A" {
		t.Fatalf("snap.Body = %q after mutating restored req.Body, want payload-A (aliasing regression)", snap.Body)
	}
}

// TestFromClientBodyIsDefensiveCopy exercises the FromClient path used
// by kiwa/gin and kiwa/echo. Mutating the caller's body slice after
// FromClient returns must not corrupt the snapshot.
func TestFromClientBodyIsDefensiveCopy(t *testing.T) {
	req, err := http.NewRequest(http.MethodPost, "http://example.test/echo", nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	body := []byte("payload-B")

	snap := FromClient(req, body)
	if string(snap.Body) != "payload-B" {
		t.Fatalf("snap.Body = %q, want payload-B", snap.Body)
	}

	for i := range body {
		body[i] = 'Y'
	}
	if string(snap.Body) != "payload-B" {
		t.Fatalf("snap.Body = %q after mutating caller body, want payload-B (aliasing regression)", snap.Body)
	}
}

// TestFromServerPathAndQuery verifies that the Snapshot.Path field
// carries the query string so specs asserting on ?limit=10 style
// requests see the full request target.
func TestFromServerPathAndQuery(t *testing.T) {
	cases := []struct {
		name     string
		rawURL   string
		wantPath string
	}{
		{"no-query", "http://example.test/users", "/users"},
		{"single-query", "http://example.test/users?limit=10", "/users?limit=10"},
		{"multi-query", "http://example.test/users?a=1&b=2", "/users?a=1&b=2"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, tc.rawURL, nil)
			if err != nil {
				t.Fatalf("NewRequest: %v", err)
			}
			snap := FromServer(req)
			if snap.Path != tc.wantPath {
				t.Fatalf("Path = %q, want %q", snap.Path, tc.wantPath)
			}
		})
	}
}

// TestFromServerHeadersAllPreservesOrder verifies that duplicate
// headers on the request round-trip through the multi-value view in
// wire order — the guarantee the Rust recorder gives.
func TestFromServerHeadersAllPreservesOrder(t *testing.T) {
	req, err := http.NewRequest(http.MethodGet, "http://example.test/", nil)
	if err != nil {
		t.Fatalf("NewRequest: %v", err)
	}
	req.Header.Add("X-Trace", "first")
	req.Header.Add("X-Trace", "second")
	req.Header.Add("X-Trace", "third")

	snap := FromServer(req)
	values := snap.HeadersAllValues("x-trace")
	if len(values) != 3 {
		t.Fatalf("HeadersAllValues = %v, want 3 entries", values)
	}
	if values[0] != "first" || values[1] != "second" || values[2] != "third" {
		t.Fatalf("HeadersAllValues = %v, want [first second third]", values)
	}
	// Last-write-wins on the single-value view.
	if got := snap.Headers[strings.ToLower("X-Trace")]; got != "third" {
		t.Fatalf("Headers[x-trace] = %q, want third", got)
	}
}

// TestLogSnapshotDeepCopy exercises the v1.6-2 (Issue #608) hazard 2 —
// Snapshot() must return a deep copy so a caller mutating a returned
// entry's Body cannot retroactively corrupt the recorder log.
func TestLogSnapshotDeepCopy(t *testing.T) {
	log := &Log{}
	log.Append(Snapshot{
		Method:  http.MethodPost,
		Path:    "/first",
		Headers: map[string]string{"content-type": "text/plain"},
		HeadersAll: map[string][]string{
			"content-type": {"text/plain"},
		},
		Body: []byte("first-body"),
	})

	first := log.Snapshot()
	if len(first) != 1 {
		t.Fatalf("Snapshot len = %d, want 1", len(first))
	}

	// Mutate every reference type on the returned Snapshot in place.
	for i := range first[0].Body {
		first[0].Body[i] = 'X'
	}
	first[0].Headers["content-type"] = "application/xml"
	first[0].HeadersAll["content-type"][0] = "application/xml"

	// A fresh Snapshot must still reflect the original payload —
	// otherwise the caller's mutation leaked into the recorder log.
	second := log.Snapshot()
	if string(second[0].Body) != "first-body" {
		t.Fatalf("second Body = %q, want first-body (mutation leaked into recorder log)", second[0].Body)
	}
	if second[0].Headers["content-type"] != "text/plain" {
		t.Fatalf("second Headers[content-type] = %q, want text/plain", second[0].Headers["content-type"])
	}
	if second[0].HeadersAll["content-type"][0] != "text/plain" {
		t.Fatalf("second HeadersAll[content-type][0] = %q, want text/plain", second[0].HeadersAll["content-type"][0])
	}
}

// TestLogAppendIsConcurrentSafe hits the Log with parallel Append
// goroutines to make sure sync.Mutex still guards the log — the
// factor kept the Mutex model unchanged but this is the sole test
// asserting the concurrency contract.
func TestLogAppendIsConcurrentSafe(t *testing.T) {
	log := &Log{}
	const workers = 8
	const perWorker = 100

	var wg sync.WaitGroup
	wg.Add(workers)
	for w := 0; w < workers; w++ {
		go func() {
			defer wg.Done()
			for i := 0; i < perWorker; i++ {
				log.Append(Snapshot{Method: http.MethodGet, Path: "/"})
			}
		}()
	}
	wg.Wait()

	if got := log.Count(); got != workers*perWorker {
		t.Fatalf("Count = %d, want %d", got, workers*perWorker)
	}
	if snap := log.Snapshot(); len(snap) != workers*perWorker {
		t.Fatalf("Snapshot len = %d, want %d", len(snap), workers*perWorker)
	}
}
