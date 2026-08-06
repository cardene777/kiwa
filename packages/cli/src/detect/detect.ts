/**
 * Decide which kiwa layers apply to a project, from what it already depends on.
 *
 * The mapping lives in `docs/stack-signals.json`; this module applies it. The
 * one piece of judgement here is precedence, because a dependency name is not
 * always enough to tell layers apart.
 *
 * `rust-tower-http-poc` depends on `axum` as well as `tower-http` — the
 * middleware wraps an axum router — so reading dependency names alone reports
 * two layers where the project tests one. What settles it is `kiwa-test-rs`'s
 * feature list, which is the project's own statement of what it is testing.
 * Signals carry a `strength` for that reason: an `exact` signal settles its
 * group, a `weak` one only speaks when nothing exact did.
 */

import type { Dependency } from './manifests.js';

export type Strength = 'exact' | 'weak';

export interface Signal {
  match: string;
  layer?: string;
  kind?: 'feature';
  features?: Record<string, string>;
  default?: string;
  /** Layers the same dependency also implies, which a manifest cannot separate. */
  also?: string[];
  strength: Strength;
  note?: string;
}

export interface SignalTable {
  manifests: Record<string, string>;
  signals: Record<string, Signal[]>;
  generated: { signals: Signal[] };
}

export interface Detection {
  layer: string;
  /** The dependency (or feature) that produced it, for the report. */
  signal: string;
  manifest: string;
  strength: Strength;
}

/**
 * Signals in the same group compete; signals in different groups do not.
 *
 * The group is the runtime prefix, so `rust-axum` and `rust-tower-http` compete
 * while `rust-unit` and `go-gin` do not. Without this an exact Rust signal
 * would suppress a weak Go one in a project that happens to hold both.
 */
function group(layer: string): string {
  const at = layer.indexOf('-');
  return at === -1 ? layer : layer.slice(0, at);
}

function applySignal(signal: Signal, dep: Dependency, manifest: string): Detection[] {
  if (dep.name !== signal.match && !dep.name.startsWith(`${signal.match}/`)) return [];

  if (signal.kind === 'feature') {
    const hits: Detection[] = [];
    for (const feature of dep.features) {
      const layer = signal.features?.[feature];
      if (layer) {
        hits.push({ layer, signal: `${dep.name} feature "${feature}"`, manifest, strength: signal.strength });
      }
    }
    // A bare dependency with no recognised feature still says something: the
    // project uses the runtime adapter, which is the unit layer.
    if (!hits.length && signal.default) {
      hits.push({ layer: signal.default, signal: dep.name, manifest, strength: signal.strength });
    }
    // The adapter serves the integration layer as well, and no manifest can
    // tell the two apart — `rust-cargo-poc` has `tests/poc.rs` and
    // `tests/poc_integration.rs` against one `kiwa-test-rs` entry. Reporting
    // only the unit layer would hide half of what the project already tests.
    for (const layer of signal.also ?? []) {
      hits.push({ layer, signal: dep.name, manifest, strength: signal.strength });
    }
    return hits;
  }

  // `also` applies to plain signals too. The Go adapter is one: it names its
  // layer directly rather than through features, and reading `also` only on the
  // feature path left `go-integration` undetected.
  const layers = [...(signal.layer ? [signal.layer] : []), ...(signal.also ?? [])];
  return layers.map((layer) => ({ layer, signal: dep.name, manifest, strength: signal.strength }));
}

/**
 * Apply one manifest's dependencies against the signals for its language.
 *
 * Returns every hit, including ones precedence will later discard, so the
 * caller can report what was considered.
 */
export function detectFrom(
  table: SignalTable,
  language: string,
  manifest: string,
  deps: Dependency[],
): Detection[] {
  const signals = [...(table.signals[language] ?? []), ...table.generated.signals];
  return deps.flatMap((dep) => signals.flatMap((signal) => applySignal(signal, dep, manifest)));
}

/**
 * Resolve precedence within each group and de-duplicate.
 *
 * A layer detected twice through different signals appears once, keeping the
 * stronger of the two so the report names the signal that actually decided it.
 */
export function resolve(all: Detection[]): Detection[] {
  const decisive = new Set(all.filter((d) => d.strength === 'exact').map((d) => group(d.layer)));

  const kept = new Map<string, Detection>();
  for (const d of all) {
    if (d.strength === 'weak' && decisive.has(group(d.layer))) continue;
    const existing = kept.get(d.layer);
    if (!existing || (existing.strength === 'weak' && d.strength === 'exact')) kept.set(d.layer, d);
  }
  return [...kept.values()].sort((a, b) => a.layer.localeCompare(b.layer));
}
