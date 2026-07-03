import type { AlertFireEvent, SilenceDef } from '../adapters/interface.js';

/**
 * Time-based silence store with literal + regex label matching.
 *
 * The observability package `AlertRouter` supports literal `match` on
 * silences only. This dogfood layers a `matchRe` field on top so callers
 * can silence all fires under a route prefix (`route: '^/api/'`) without
 * enumerating every leaf. Regex compilation is cached per silence.
 */
export class SilenceStore {
  private readonly silences: SilenceDef[] = [];
  private readonly regexCache = new Map<string, RegExp>();

  constructor(seed?: SilenceDef[]) {
    if (seed) this.silences.push(...seed);
  }

  add(silence: SilenceDef): void {
    this.silences.push(silence);
  }

  remove(id: string): void {
    const idx = this.silences.findIndex((s) => s.id === id);
    if (idx >= 0) this.silences.splice(idx, 1);
  }

  list(): SilenceDef[] {
    return [...this.silences];
  }

  /** True when the fire matches an unexpired silence. */
  isSilenced(fire: AlertFireEvent, now: number): SilenceDef | null {
    for (const s of this.silences) {
      if (s.expiresAt <= now) continue;
      if (!matchLiteral(s.match, fire.labels)) continue;
      if (!matchRegex(s.matchRe, fire.labels, this.regexCache, s.id)) continue;
      return s;
    }
    return null;
  }
}

/**
 * A canonical silence set — 2 windows so the fidelity harness can
 * exercise both literal + regex paths without hand-rolling silences
 * in every test.
 */
export function seededSilences(now: number): SilenceDef[] {
  return [
    // Literal silence — maintenance window on platform team for 15 min.
    {
      id: 'silence-maintenance-platform',
      match: { team: 'platform' },
      expiresAt: now + 15 * 60 * 1000,
    },
    // Regex silence — deploy window covering any /api/ route for 30 min.
    {
      id: 'silence-deploy-window',
      match: {},
      matchRe: { route: '^/api/' },
      expiresAt: now + 30 * 60 * 1000,
    },
  ];
}

function matchLiteral(
  match: Record<string, string>,
  labels: Record<string, string>,
): boolean {
  for (const [k, v] of Object.entries(match)) {
    if (labels[k] !== v) return false;
  }
  return true;
}

function matchRegex(
  matchRe: Record<string, string> | undefined,
  labels: Record<string, string>,
  cache: Map<string, RegExp>,
  silenceId: string,
): boolean {
  if (!matchRe) return true;
  for (const [k, pattern] of Object.entries(matchRe)) {
    const value = labels[k];
    if (value === undefined) return false;
    const cacheKey = `${silenceId}:${k}:${pattern}`;
    let re = cache.get(cacheKey);
    if (!re) {
      try {
        re = new RegExp(pattern);
        cache.set(cacheKey, re);
      } catch {
        // A malformed pattern never matches — do not throw during
        // silence evaluation so bad user input cannot brick the
        // orchestrator.
        return false;
      }
    }
    if (!re.test(value)) return false;
  }
  return true;
}
