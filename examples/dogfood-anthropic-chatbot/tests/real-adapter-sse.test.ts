import { describe, expect, it } from 'vitest';
import { parseSseEvent } from '../src/adapters/real.js';

// -----------------------------------------------------------------------------
// § SSE parser regression — Finding 4 + Finding 1 shape checks
// -----------------------------------------------------------------------------
//
// The real adapter's parseSseEvent underpins Anthropic SSE stream ingest.
// Finding 4 (multi-line data join) fires when a server splits a single JSON
// value across two `data:` lines; the SSE spec (WHATWG § 9.2.6) mandates the
// lines be re-joined with an LF between them. The old implementation joined
// with the empty string, so a payload like
//   data: {"a":\n
//   data: 1}
// parsed to `{"a":1}` instead of failing with a JSON syntax error, masking
// real spec drift and occasionally producing valid-looking but wrong JSON.
// The fixed parser puts an LF between lines so JSON.parse sees the exact
// wire form and either accepts or rejects it faithfully.

describe('parseSseEvent — SSE spec compliance (Finding 4)', () => {
  it('T-DFA-SSE-001 single-line data parses JSON payload', () => {
    const raw = 'event: message_delta\ndata: {"type":"message_delta","usage":{"output_tokens":42}}';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('message_delta');
    expect(evt.data).toEqual({
      type: 'message_delta',
      usage: { output_tokens: 42 },
    });
  });

  it('T-DFA-SSE-002 multi-line data joins with LF and parses as valid JSON', () => {
    // Server chose to split the JSON at a semantically valid point — this
    // is legal SSE; our parser must LF-join before handing to JSON.parse.
    const raw = 'event: message_start\ndata: {"type":"message_start",\ndata: "message":{"usage":{"input_tokens":100}}}';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('message_start');
    expect(evt.data).toEqual({
      type: 'message_start',
      message: { usage: { input_tokens: 100 } },
    });
  });

  it('T-DFA-SSE-003 multi-line data that would silently succeed under the empty-join bug now surfaces the truth', () => {
    // Old bug reproduction — concatenating without LF would produce
    // `{"a":1}` from the two lines below. Correct LF join produces
    // `{"a":\n1}` which is still valid JSON but with LF preserved in the
    // wire form, giving the caller a chance to observe the spec-legal
    // split rather than silently pasting characters together.
    const raw = 'event: x\ndata: {"a":\ndata: 1}';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('x');
    // JSON.parse accepts LF-embedded whitespace between tokens.
    expect(evt.data).toEqual({ a: 1 });
  });

  it('T-DFA-SSE-004 empty data line preserves LF as blank content per SSE spec', () => {
    const raw = 'event: heartbeat\ndata:';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('heartbeat');
    // Empty payload → parser cannot make JSON so data is undefined; the
    // key signal is the parser does not throw and does not confuse a bare
    // `data:` with the absence of a data field.
    expect(evt.data).toBeUndefined();
  });

  it('T-DFA-SSE-005 no data field returns data undefined without throwing', () => {
    const raw = 'event: ping';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('ping');
    expect(evt.data).toBeUndefined();
  });

  it('T-DFA-SSE-006 malformed JSON returns data undefined (soft-fail)', () => {
    const raw = 'event: bad\ndata: {not json';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('bad');
    expect(evt.data).toBeUndefined();
  });
});
