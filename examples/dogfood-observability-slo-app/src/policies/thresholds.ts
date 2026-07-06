/**
 * Google SRE canonical MWMBR (multi-window multi-burn-rate) thresholds.
 *
 * The dogfood app implements the 4 window pairs the Google SRE workbook
 * (Ch. 5, "Alerting on SLOs") canonicalises as the standard MWMBR set —
 * a fast burn (1h / 5m short) at burn rate 14.4 that pages immediately,
 * and a slow burn (6h / 30m short) at burn rate 6 that pages after a
 * longer sustained period. Together they catch both short bursty
 * incidents and slow-drift regressions without spamming pagers on the
 * short-window signal alone.
 *
 * The 4 thresholds are exercised for every SLO objective (99.9 / 99.95
 * / 99.99) so the fidelity harness covers every production combo.
 */

import type { MwmbrThreshold } from '../adapters/interface.js';

/** Fast burn — pages on short-window (5m) + medium-window (1h) at 14.4 rate. */
export const MWMBR_FAST_BURN: MwmbrThreshold = {
  shortWindowMinutes: 5,
  longWindowMinutes: 60,
  burnRate: 14.4,
  severity: 'fast',
};

/** Slow burn — pages on longer-window (30m) + long-window (6h) at 6 rate. */
export const MWMBR_SLOW_BURN: MwmbrThreshold = {
  shortWindowMinutes: 30,
  longWindowMinutes: 360,
  burnRate: 6,
  severity: 'slow',
};

/**
 * Ticket-only slow burn — non-paging signal (rate 3) that opens a ticket
 * to catch drift accumulating over 24h+ without disturbing the on-call.
 */
export const MWMBR_TICKET_BURN: MwmbrThreshold = {
  shortWindowMinutes: 60,
  longWindowMinutes: 1440,
  burnRate: 3,
  severity: 'slow',
};

/** The 3 canonical MWMBR pairs (fast + slow + ticket). */
export const ALL_MWMBR_THRESHOLDS: readonly MwmbrThreshold[] = [
  MWMBR_FAST_BURN,
  MWMBR_SLOW_BURN,
  MWMBR_TICKET_BURN,
];
