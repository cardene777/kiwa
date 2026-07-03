import { describe, expect, it } from 'vitest';
import { parseSseEvent } from '../src/adapters/real.js';

// -----------------------------------------------------------------------------
// § SSE parser regression — Finding 4 (dogfood cross-cutting fix)
// -----------------------------------------------------------------------------
//
// Multimodal chat streams vision-completion tokens through the same
// Anthropic Messages SSE channel as the sibling chatbot. Regression tests
// for parseSseEvent stand alongside the chatbot suite so a spec drift in
// one file is caught even if only one app runs its test job.

describe('parseSseEvent — SSE spec compliance (Finding 4)', () => {
  it('T-DFM-SSE-001 single-line data parses JSON payload', () => {
    const raw = 'event: message_delta\ndata: {"type":"message_delta","usage":{"output_tokens":7}}';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('message_delta');
    expect(evt.data).toEqual({
      type: 'message_delta',
      usage: { output_tokens: 7 },
    });
  });

  it('T-DFM-SSE-002 multi-line data joins with LF and parses as valid JSON', () => {
    const raw = 'event: message_start\ndata: {"type":"message_start",\ndata: "message":{"usage":{"input_tokens":250}}}';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('message_start');
    expect(evt.data).toEqual({
      type: 'message_start',
      message: { usage: { input_tokens: 250 } },
    });
  });

  it('T-DFM-SSE-003 spec-legal split JSON preserves numeric parse', () => {
    const raw = 'event: x\ndata: {"a":\ndata: 1}';
    const evt = parseSseEvent(raw);
    expect(evt.data).toEqual({ a: 1 });
  });

  it('T-DFM-SSE-004 empty data field returns undefined data without throw', () => {
    const raw = 'event: heartbeat\ndata:';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('heartbeat');
    expect(evt.data).toBeUndefined();
  });

  it('T-DFM-SSE-005 malformed JSON returns undefined data', () => {
    const raw = 'event: bad\ndata: {not json';
    const evt = parseSseEvent(raw);
    expect(evt.type).toBe('bad');
    expect(evt.data).toBeUndefined();
  });
});
