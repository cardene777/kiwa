/**
 * Canonical W3C Trace Context headers for the dogfood app.
 *
 * The W3C Trace Context spec fixes 4 fields — `version` (2 hex chars),
 * `traceId` (32 hex chars), `spanId` (16 hex chars), `flags` (2 hex
 * chars) — joined by `-`. The tracestate header is optional and carries
 * vendor-specific key/value pairs.
 *
 * The dogfood app exercises the traceparent extractor with 3 canonical
 * combinations so the fidelity harness covers every valid form the
 * OpenTelemetry Collector encounters in production.
 */

/** Sampled traceparent (flags = 01) — the request should be recorded. */
export const W3C_SAMPLED_TRACEPARENT =
  '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';

/** Not-sampled traceparent (flags = 00) — the request is not recorded. */
export const W3C_NOT_SAMPLED_TRACEPARENT =
  '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00';

/** Sampled traceparent + vendor tracestate. */
export const W3C_TRACEPARENT_WITH_STATE = {
  traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
  tracestate: 'cardene=abcd1234,vendor2=xyz',
};

/** All 3 canonical W3C headers — used by the fidelity harness. */
export const ALL_W3C_HEADERS: readonly (
  | { traceparent: string; tracestate?: string }
)[] = [
  { traceparent: W3C_SAMPLED_TRACEPARENT },
  { traceparent: W3C_NOT_SAMPLED_TRACEPARENT },
  W3C_TRACEPARENT_WITH_STATE,
];
