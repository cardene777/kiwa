// Redpanda schema-evolution semantics — Avro / Protobuf / JSON compatibility
// checks + subject naming strategy + inter-schema references (Confluent SR
// $ref graph). Wraps a versioned subject registry with a compatibility oracle
// so tests can validate evolution boundaries against production expectations.
//
// The compatibility oracle is structural: it inspects the schema string for
// specific evolution shapes ("added optional field", "removed required field")
// keyed by inline markers, since we don't parse Avro / Protobuf ASTs. Tests
// use the markers to describe what a change is; the oracle checks the mode.

import type { CompatibilityMode, SchemaKind, SubjectNamingStrategy } from '../types.js';

export const REDPANDA_SCHEMA_EVOLUTION_SYMBOL = Symbol.for(
  'kiwa.streaming.semantics.redpanda-schema-evolution',
);

export interface RedpandaSchemaEvolutionConfig {
  readonly defaultCompatibility?: CompatibilityMode;
  readonly subjectNamingStrategy?: SubjectNamingStrategy;
}

export interface SchemaReference {
  readonly name: string;
  readonly subject: string;
  readonly version: number;
}

export interface EvolutionSchema {
  readonly id: number;
  readonly subject: string;
  readonly version: number;
  readonly kind: SchemaKind;
  readonly schema: string;
  readonly references: readonly SchemaReference[];
  readonly registeredAt: number;
}

export interface EvolutionCheckResult {
  readonly compatible: boolean;
  readonly mode: CompatibilityMode;
  readonly reasons: readonly string[];
}

export interface RedpandaSchemaEvolution {
  readonly [REDPANDA_SCHEMA_EVOLUTION_SYMBOL]: true;
  readonly config: Required<RedpandaSchemaEvolutionConfig>;
  register(input: {
    readonly subject: string;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly references?: readonly SchemaReference[];
  }): EvolutionSchema;
  latest(subject: string): EvolutionSchema | null;
  versions(subject: string): readonly EvolutionSchema[];
  setCompatibility(subject: string, mode: CompatibilityMode): void;
  getCompatibility(subject: string): CompatibilityMode;
  check(input: {
    readonly subject: string;
    readonly kind: SchemaKind;
    readonly schema: string;
  }): EvolutionCheckResult;
  subjectFor(topic: string, part: 'key' | 'value', recordName?: string): string;
  resolveReferences(schema: EvolutionSchema): readonly EvolutionSchema[];
  reset(): void;
}

interface SubjectState {
  compat: CompatibilityMode;
  readonly versions: EvolutionSchema[];
}

// Structural markers embedded in schema strings for the oracle. Tests use
// them to declare the shape of a change:
//   "OPTIONAL_ADD:field_x"        added optional field
//   "REQUIRED_ADD:field_x"        added required field
//   "REQUIRED_REMOVE:field_x"     removed required field
//   "OPTIONAL_REMOVE:field_x"     removed optional field
//   "TYPE_CHANGE:field_x"         changed a field's type
const MARKER_PATTERN = /(OPTIONAL_ADD|REQUIRED_ADD|REQUIRED_REMOVE|OPTIONAL_REMOVE|TYPE_CHANGE):([\w\-.]+)/g;

function extractMarkers(schema: string): { readonly kind: string; readonly field: string }[] {
  const out: { readonly kind: string; readonly field: string }[] = [];
  const pattern = new RegExp(MARKER_PATTERN.source, 'g');
  let match: RegExpExecArray | null = pattern.exec(schema);
  while (match !== null) {
    out.push({ kind: match[1] ?? '', field: match[2] ?? '' });
    match = pattern.exec(schema);
  }
  return out;
}

function reasonsForCheck(
  previous: EvolutionSchema | null,
  candidate: string,
  mode: CompatibilityMode,
): readonly string[] {
  if (!previous) return [];
  if (mode === 'NONE') return [];
  const priorMarkers = extractMarkers(previous.schema);
  const nextMarkers = extractMarkers(candidate);
  const changes = new Set(
    nextMarkers.filter(
      (m) => !priorMarkers.some((p) => p.kind === m.kind && p.field === m.field),
    ).map((m) => `${m.kind}:${m.field}`),
  );
  const reasons: string[] = [];
  for (const change of changes) {
    const [kind, field] = change.split(':');
    if (kind === 'REQUIRED_ADD') {
      if (mode === 'BACKWARD' || mode === 'BACKWARD_TRANSITIVE' || mode === 'FULL' || mode === 'FULL_TRANSITIVE') {
        reasons.push(`added required field "${field}" breaks ${mode}`);
      }
    }
    if (kind === 'REQUIRED_REMOVE') {
      if (mode === 'FORWARD' || mode === 'FORWARD_TRANSITIVE' || mode === 'FULL' || mode === 'FULL_TRANSITIVE') {
        reasons.push(`removed required field "${field}" breaks ${mode}`);
      }
    }
    if (kind === 'TYPE_CHANGE') {
      reasons.push(`type change on field "${field}" breaks ${mode}`);
    }
  }
  return reasons;
}

/**
 * Create a Redpanda schema-evolution registry. Registration enforces the
 * subject's current compat mode + tracks a schema reference graph
 * (`references`) so tests can validate composed schemas (Order → Address).
 */
export function createRedpandaSchemaEvolution(
  config?: RedpandaSchemaEvolutionConfig,
): RedpandaSchemaEvolution {
  const cfg: Required<RedpandaSchemaEvolutionConfig> = {
    defaultCompatibility: config?.defaultCompatibility ?? 'BACKWARD',
    subjectNamingStrategy: config?.subjectNamingStrategy ?? 'topic-name',
  };
  const subjects = new Map<string, SubjectState>();
  const byId = new Map<number, EvolutionSchema>();
  let nextId = 1;

  function ensureSubject(subject: string): SubjectState {
    const existing = subjects.get(subject);
    if (existing) return existing;
    const created: SubjectState = { compat: cfg.defaultCompatibility, versions: [] };
    subjects.set(subject, created);
    return created;
  }

  const evolution: RedpandaSchemaEvolution = {
    [REDPANDA_SCHEMA_EVOLUTION_SYMBOL]: true,
    config: cfg,
    register(input): EvolutionSchema {
      const state = ensureSubject(input.subject);
      const check = evolution.check(input);
      if (!check.compatible) {
        throw new Error(
          `redpanda schema-evolution: incompatible schema for "${input.subject}" (mode=${check.mode}): ${check.reasons.join('; ')}`,
        );
      }
      // Validate all references resolve to something already registered.
      const refs = input.references ?? [];
      for (const r of refs) {
        const refState = subjects.get(r.subject);
        if (!refState) {
          throw new Error(`redpanda schema-evolution: unknown reference subject "${r.subject}"`);
        }
        const refVersion = refState.versions.find((v) => v.version === r.version);
        if (!refVersion) {
          throw new Error(
            `redpanda schema-evolution: reference version ${r.version} not registered for "${r.subject}"`,
          );
        }
      }
      const version = state.versions.length + 1;
      const registered: EvolutionSchema = {
        id: nextId++,
        subject: input.subject,
        version,
        kind: input.kind,
        schema: input.schema,
        references: [...refs],
        registeredAt: Date.now(),
      };
      state.versions.push(registered);
      byId.set(registered.id, registered);
      return registered;
    },
    latest(subject: string): EvolutionSchema | null {
      const state = subjects.get(subject);
      if (!state || state.versions.length === 0) return null;
      return state.versions[state.versions.length - 1] ?? null;
    },
    versions(subject: string): readonly EvolutionSchema[] {
      return subjects.get(subject)?.versions ?? [];
    },
    setCompatibility(subject: string, mode: CompatibilityMode): void {
      ensureSubject(subject).compat = mode;
    },
    getCompatibility(subject: string): CompatibilityMode {
      return subjects.get(subject)?.compat ?? cfg.defaultCompatibility;
    },
    check(input): EvolutionCheckResult {
      const state = subjects.get(input.subject);
      const previous = state && state.versions.length > 0 ? state.versions[state.versions.length - 1] : null;
      const mode = state?.compat ?? cfg.defaultCompatibility;
      const reasons = reasonsForCheck(previous ?? null, input.schema, mode);
      return { compatible: reasons.length === 0, mode, reasons };
    },
    subjectFor(topic: string, part: 'key' | 'value', recordName?: string): string {
      switch (cfg.subjectNamingStrategy) {
        case 'topic-name':
          return `${topic}-${part}`;
        case 'record-name': {
          if (!recordName) throw new Error('redpanda schema-evolution: record-name strategy needs a recordName');
          return recordName;
        }
        case 'topic-record-name': {
          if (!recordName) throw new Error('redpanda schema-evolution: topic-record-name strategy needs a recordName');
          return `${topic}-${recordName}`;
        }
      }
    },
    resolveReferences(schema: EvolutionSchema): readonly EvolutionSchema[] {
      const out: EvolutionSchema[] = [];
      for (const r of schema.references) {
        const state = subjects.get(r.subject);
        const match = state?.versions.find((v) => v.version === r.version);
        if (match) out.push(match);
      }
      return out;
    },
    reset(): void {
      subjects.clear();
      byId.clear();
      nextId = 1;
    },
  };
  return evolution;
}

/** Type guard: recognize a RedpandaSchemaEvolution. */
export function isRedpandaSchemaEvolution(value: unknown): value is RedpandaSchemaEvolution {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [REDPANDA_SCHEMA_EVOLUTION_SYMBOL]?: true })[REDPANDA_SCHEMA_EVOLUTION_SYMBOL] === true
  );
}
