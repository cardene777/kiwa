// Package recorder is the internal SSOT for kiwa's HTTP request recorder.
//
// v1.6-5 (Issue #611) factors the previously-duplicated recordRequest /
// requestRecorder / Snapshot definitions from the top-level kiwa,
// kiwa/gin, and kiwa/echo packages into a single implementation so all
// three adapters share:
//
//   - The same request → Snapshot conversion (header case-folding,
//     multi-value header preservation, defensive body copy).
//   - The same append / snapshot / count contract on the recorder log,
//     with deep-copy semantics on snapshot so a caller mutating a
//     returned Snapshot.Body slice cannot retroactively corrupt the
//     recorder log (parity with kiwa-rs Vec<u8>::clone, v1.6-2 hazard 2).
//
// # Why an internal package (not an exported one)
//
// The recorder log is an implementation detail of each adapter — the
// exported surface is kiwa.RecordedRequest (a type alias to Snapshot
// defined below) plus the adapter's RecordedRequests() / RequestCount()
// methods. Keeping the log itself internal lets us iterate on the
// concurrency model (Mutex today, sync.Map / lock-free tomorrow) without
// a public API break.
package recorder

import (
	"bytes"
	"io"
	"net/http"
	"strings"
	"sync"
)

// Snapshot is a snapshot of a single inbound HTTP request captured by an
// adapter's recorder log.
//
// The kiwa root package re-exports this as kiwa.RecordedRequest via a
// type alias so callers keep the pre-v1.6-5 name, while the code that
// builds and stores snapshots lives here as the single SSOT.
//
// Headers keys are lowercased. Two views are exposed so multi-value
// headers (Set-Cookie, WWW-Authenticate, Vary, Link, ...) survive the
// round trip while ergonomic single-value access stays cheap:
//
//   - Headers ... last-write-wins map[string]string, kept for backward
//     compatibility with pre-v1.6 assertions.
//   - HeadersAll ... map[string][]string that preserves every recorded
//     value in wire order. Empty header slots are still elided.
type Snapshot struct {
	// Method is the wire HTTP method (e.g. "GET").
	Method string
	// Path is the request path including query string (e.g. "/users?id=1").
	Path string
	// Headers are the request headers, keys lowercased, last-write-wins on
	// duplicates. Retained for backward compatibility — new assertions
	// that need multi-value semantics should read HeadersAll instead.
	Headers map[string]string
	// HeadersAll are the request headers, keys lowercased, preserving
	// every value in wire order. Populated alongside Headers so callers
	// can pick the shape that fits without paying a second recorder pass.
	HeadersAll map[string][]string
	// Body is the raw request body bytes (empty slice if the client sent
	// no body). Always a defensive copy — the recorder guarantees the
	// slice never aliases the caller's request buffer or the underlying
	// io.ReadAll allocation, and snapshot() clones it again on read so
	// callers cannot corrupt the recorder log after the fact.
	Body []byte
}

// BodyString returns Body interpreted as UTF-8.
func (s Snapshot) BodyString() string {
	return string(s.Body)
}

// HeadersAllValues returns every recorded value for key (lowercased
// match) in wire order. Returns nil (not an empty slice) when the
// header was not observed so callers can distinguish "absent" from
// "present but empty".
func (s Snapshot) HeadersAllValues(key string) []string {
	if s.HeadersAll == nil {
		return nil
	}
	values, ok := s.HeadersAll[strings.ToLower(key)]
	if !ok {
		return nil
	}
	out := make([]string, len(values))
	copy(out, values)
	return out
}

// FromServer converts an *http.Request received by an httptest.Server
// handler into a Snapshot. The body is fully read (net/http closes it
// after the handler returns) and defensively copied before storage.
//
// FromServer restores req.Body to a fresh io.NopCloser wrapping the
// captured bytes so downstream handlers can re-read it without
// surprises. The returned Snapshot.Body never aliases the restored
// req.Body reader — the two views own independent copies.
func FromServer(req *http.Request) Snapshot {
	headers, headersAll := extractHeaders(req.Header)

	var body []byte
	if req.Body != nil {
		if buf, err := io.ReadAll(req.Body); err == nil {
			body = buf
		}
		// Restore the body so downstream handlers (currently none, but
		// the recorder may be reused) can re-read it without surprises.
		req.Body = io.NopCloser(bytes.NewReader(body))
	}

	return Snapshot{
		Method:     req.Method,
		Path:       pathWithQuery(req),
		Headers:    headers,
		HeadersAll: headersAll,
		Body:       cloneBytes(body),
	}
}

// FromClient converts an *http.Request built by an in-process test
// adapter (kiwa/gin, kiwa/echo) plus the raw body bytes the caller
// dispatched into a Snapshot.
//
// The body is taken from the caller-provided slice (not re-read from
// req.Body) so the recorder captures the exact bytes dispatched even
// when the request body reader is single-shot. A defensive copy is
// still made so callers reusing the underlying buffer across Send
// calls cannot retroactively mutate already-captured entries.
func FromClient(req *http.Request, body []byte) Snapshot {
	headers, headersAll := extractHeaders(req.Header)

	return Snapshot{
		Method:     req.Method,
		Path:       pathWithQuery(req),
		Headers:    headers,
		HeadersAll: headersAll,
		Body:       cloneBytes(body),
	}
}

// Log owns the captured-request log behind a sync.Mutex so concurrent
// inbound requests cannot tear writes.
//
// snapshot returns a deep copy — the outer slice is freshly allocated
// and every Snapshot.Body is cloned again so a caller mutating a
// returned entry cannot corrupt the recorder log (parity with kiwa-rs
// Vec<u8>::clone, v1.6-2 hazard 2).
type Log struct {
	mu       sync.Mutex
	captured []Snapshot
}

// Append records snap under the recorder log lock.
func (l *Log) Append(snap Snapshot) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.captured = append(l.captured, snap)
}

// Snapshot returns a deep copy of the recorder log. Every Body slice
// and HeadersAll slice is cloned so callers can iterate and mutate
// without racing writers or corrupting the log.
func (l *Log) Snapshot() []Snapshot {
	l.mu.Lock()
	defer l.mu.Unlock()
	out := make([]Snapshot, len(l.captured))
	for i, s := range l.captured {
		out[i] = deepCopySnapshot(s)
	}
	return out
}

// Count reports how many requests the recorder has captured.
func (l *Log) Count() int {
	l.mu.Lock()
	defer l.mu.Unlock()
	return len(l.captured)
}

// extractHeaders builds the (single-value, multi-value) header view
// pair from http.Header. Keys are lowercased. Single-value view is
// last-write-wins on duplicates — matches the Rust recorder so
// polyglot specs compare equal across languages.
func extractHeaders(h http.Header) (map[string]string, map[string][]string) {
	headers := make(map[string]string, len(h))
	headersAll := make(map[string][]string, len(h))
	for k, v := range h {
		if len(v) == 0 {
			continue
		}
		lowerKey := strings.ToLower(k)
		headers[lowerKey] = v[len(v)-1]
		valuesCopy := make([]string, len(v))
		copy(valuesCopy, v)
		headersAll[lowerKey] = valuesCopy
	}
	return headers, headersAll
}

// pathWithQuery returns req.URL.Path with the raw query appended (if
// any) — same shape as RecordedRequest.Path across all adapters.
func pathWithQuery(req *http.Request) string {
	path := req.URL.Path
	if raw := req.URL.RawQuery; raw != "" {
		return path + "?" + raw
	}
	return path
}

// cloneBytes returns a defensive copy of b. Always returns an empty
// (non-nil) slice for a nil input so downstream code can treat the
// result as a valid []byte without a nil check.
func cloneBytes(b []byte) []byte {
	out := make([]byte, len(b))
	copy(out, b)
	return out
}

// deepCopySnapshot returns a Snapshot with its Body and HeadersAll
// values cloned. Headers is copied by-map (values are strings so no
// deeper alias is possible). Used by Log.Snapshot so a caller mutating
// a returned entry cannot mutate the recorder log.
func deepCopySnapshot(s Snapshot) Snapshot {
	out := Snapshot{
		Method: s.Method,
		Path:   s.Path,
		Body:   cloneBytes(s.Body),
	}
	if s.Headers != nil {
		out.Headers = make(map[string]string, len(s.Headers))
		for k, v := range s.Headers {
			out.Headers[k] = v
		}
	}
	if s.HeadersAll != nil {
		out.HeadersAll = make(map[string][]string, len(s.HeadersAll))
		for k, v := range s.HeadersAll {
			valuesCopy := make([]string, len(v))
			copy(valuesCopy, v)
			out.HeadersAll[k] = valuesCopy
		}
	}
	return out
}
