/**
 * Decide which kiwa layers apply to a project, from what it already depends on.
 *
 * The mapping lives in `docs/stack-signals.json`; this module applies it. The
 * one piece of judgement here is precedence, because a dependency name is not
 * always enough to tell layers apart.
 *
 * A project can depend on two frameworks where one wraps the other — the
 * middleware wraps an axum router — so reading dependency names alone reports
 * two layers where the project tests one. What settles it is the adapter's
 * feature list, which is the project's own statement of what it is testing.
 * Signals carry a `strength` for that reason: an `exact` signal settles its
 * group, a `weak` one only speaks when nothing exact did.
 */

import { createHash } from 'node:crypto';

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

/**
 * A signal derived from a package's `peerDependencies` rather than written by
 * hand, carrying the language it was derived from.
 *
 * The language is not decoration. Generated signals are npm names, and npm
 * names share a namespace with other registries: `redis`, `postgres` and
 * `testcontainers` all exist in both. Matching is by name (exact, or a `/`
 * boundary prefix), so without the language a `Cargo.toml` depending on the
 * `redis` crate matches a signal derived from a TypeScript package and reports
 * a TypeScript layer.
 *
 * Go is unaffected either way, because module paths are
 * `github.com/redis/go-redis/v9` and match neither form.
 */
export interface GeneratedSignal extends Signal {
  /** The manifest language this signal was derived from. */
  language: string;
}

export interface SignalTable {
  manifests: Record<string, string>;
  signals: Record<string, Signal[]>;
  generated: { signals: GeneratedSignal[] };
}

/**
 * A fingerprint of the parts of the table that decide what gets detected.
 *
 * `.kiwa/stack.json` records an answer, and the reader narrows on it. The
 * staleness check compares the recording against the manifests, which catches
 * "the project changed" — but not "the table changed". A recording taken before
 * a signal existed says nothing about the layer that signal names, and reading
 * its silence as absence removes exactly the layers the signal was added to
 * find.
 *
 * Covers `signals` and `generated.signals` and nothing else. Prose (`$comment`)
 * and the manifest map do not change which layers a dependency yields, and
 * invalidating every recording over a reworded comment costs a re-run for
 * nothing.
 *
 * Key order is normalised so that reformatting the file does not read as a
 * change of meaning.
 */
export function signalsFingerprint(table: SignalTable | null): string {
  if (!table) return '';
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, canonical(v)]),
      );
    }
    return value;
  };
  const body = JSON.stringify(
    canonical({ signals: table.signals ?? {}, generated: table.generated?.signals ?? [] }),
  );
  return createHash('sha256').update(body).digest('hex').slice(0, 16);
}

export interface Detection {
  layer: string;
  /**
   * Set when the layer follows from another one rather than from a signal of
   * its own. Kept only while nothing more specific turned up in the group.
   */
  implied?: true;
  /** The layer this one follows from, used to decide "more specific". */
  impliedBy?: string;
  /** The dependency (or feature) that produced it, for the report. */
  signal: string;
  manifest: string;
  strength: Strength;
}

/**
 * Signals in the same group compete; signals in different groups do not.
 *
 * The group is the runtime prefix, so two layers of one runtime compete
 * while layers of different runtimes do not. Without this an exact signal
 * would suppress a weak Go one in a project that happens to hold both.
 */
function group(layer: string): string {
  const at = layer.indexOf('-');
  return at === -1 ? layer : layer.slice(0, at);
}

function applySignal(signal: Signal, dep: Dependency, manifest: string): Detection[] {
  if (dep.name !== signal.match && !dep.name.startsWith(`${signal.match}/`)) return [];

  if (signal.kind === 'feature') {
    // A workspace-inherited entry states the dependency and hides the
    // feature list, which is the only thing that says which layer. Falling back
    // to the default would report the fallback layer for a framework project —
    // answer built from an absent one.
    if (dep.unresolved) return [];

    const base = signal.default ?? signal.layer;
    const hits: Detection[] = [];
    for (const feature of dep.features) {
      const layer = signal.features?.[feature];
      if (layer) {
        hits.push({ layer, signal: `${dep.name} feature "${feature}"`, manifest, strength: signal.strength });
      }
    }
    // A bare dependency with no recognised feature still says something: the
    // project uses the runtime adapter, which is the unit layer. It is a
    // fallback, so it yields to anything more specific in the same group.
    if (!hits.length && signal.default) {
      hits.push({
        layer: signal.default,
        signal: dep.name,
        manifest,
        strength: signal.strength,
        implied: true,
      });
    }
    // The adapter can serve the integration layer too, and no manifest tells
    // the two apart. It is marked as following from the base layer rather than
    // asserted: `resolve` keeps it only while nothing more specific appeared.
    for (const layer of signal.also ?? []) {
      hits.push({
        layer,
        signal: dep.name,
        manifest,
        strength: signal.strength,
        implied: true,
        ...(base ? { impliedBy: base } : {}),
      });
    }
    return hits;
  }

  // Plain signals carry the same three roles as feature ones. `layer` states
  // the layer outright; `default` is the layer that holds while nothing more
  // specific turned up; `also` is what the same dependency may additionally
  // mean.
  //
  // Reading `default` as an assertion here made the Go adapter report
  // the fallback beside the framework layer, while an adapter whose feature
  // replaces the default — reported the framework layer alone. Same intent,
  // two answers, decided by which mechanism the language happened to use.
  const from = signal.default ?? signal.layer;
  const out: Detection[] = [];

  if (signal.layer) {
    out.push({ layer: signal.layer, signal: dep.name, manifest, strength: signal.strength });
  }
  if (signal.default) {
    out.push({
      layer: signal.default,
      signal: dep.name,
      manifest,
      strength: signal.strength,
      implied: true,
    });
  }
  for (const layer of signal.also ?? []) {
    out.push({
      layer,
      signal: dep.name,
      manifest,
      strength: signal.strength,
      implied: true,
      ...(from ? { impliedBy: from } : {}),
    });
  }
  return out;
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
  // Generated signals are filtered by the language they were derived from, not
  // applied to every manifest. An entry without a `language` matches nothing:
  // the shape is machine-written, so a missing field means the generator is out
  // of date, and guessing "applies everywhere" is the behaviour this filter
  // exists to remove.
  const signals = [
    ...(table.signals[language] ?? []),
    ...table.generated.signals.filter((signal) => signal.language === language),
  ];
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
    // An asserted detection replaces an implied one for the same layer.
    //
    // Without this the first one seen wins, and swapping two lines of a
    // package.json changes the answer: an implied entry taking the slot leaves
    // `asserted` empty below, so the loop that drops implied layers drops
    // nothing and all five `nextjs-*` come back where one was asserted.
    //
    // Strength is not compared here. It cannot differ within a surviving layer:
    // `decisive` is computed from every detection up front, so a group holding
    // any exact signal loses all of its weak ones at the `continue` above. The
    // condition this replaced (`existing.strength === 'weak' && d.strength ===
    // 'exact'`) could therefore never fire — measured, not assumed.
    if (!existing || (existing.implied && !d.implied)) kept.set(d.layer, d);
  }

  // An implied layer is a guess that holds only while nothing else in its group
  // says otherwise. An adapter can imply the integration layer because the
  // plain corpus project carries both a unit and an integration test file and
  // `tests/poc_integration.rs` — but the framework projects each carry a single
  // test file, so keeping it once a framework layer appeared would report an
  // integration suite that no such project has.
  const asserted = new Map<string, Set<string>>();
  for (const d of kept.values()) {
    if (d.implied) continue;
    const g = group(d.layer);
    if (!asserted.has(g)) asserted.set(g, new Set());
    asserted.get(g)!.add(d.layer);
  }
  for (const [layer, d] of [...kept]) {
    if (!d.implied) continue;
    const others = [...(asserted.get(group(layer)) ?? [])].filter((l) => l !== d.impliedBy);
    if (others.length) kept.delete(layer);
  }

  return [...kept.values()].sort((a, b) => a.layer.localeCompare(b.layer));
}
