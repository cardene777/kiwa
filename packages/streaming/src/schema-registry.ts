// Schema registry test adapter — Confluent Schema Registry (SR) shaped mock
// covering Avro / Protobuf / JSON schema registration + compatibility check
// + evolution + subject naming strategy.
//
// The compatibility check is *structural* — the mock stores schemas as
// opaque strings and applies a small set of rules (added optional fields =
// backward-compatible, added required fields = break) so tests can validate
// the evolution flow without pulling in a real Avro parser.

import type { CompatibilityMode, SchemaKind, SubjectNamingStrategy } from './types.js';

export const SCHEMA_REGISTRY_SYMBOL = Symbol.for('kiwa.streaming.schema-registry');

export interface SchemaRegistryConfig {
  /** Default compat mode applied to new subjects. */
  readonly defaultCompatibility?: CompatibilityMode;
  /** Subject naming strategy — how tests derive subject from topic. */
  readonly subjectNamingStrategy?: SubjectNamingStrategy;
}

export interface RegisteredSchema {
  readonly id: number;
  readonly subject: string;
  readonly version: number;
  readonly kind: SchemaKind;
  readonly schema: string;
  readonly registeredAt: number;
}

export interface CompatibilityCheckResult {
  readonly compatible: boolean;
  readonly mode: CompatibilityMode;
  readonly reasons: readonly string[];
}

export interface SchemaRegistry {
  readonly [SCHEMA_REGISTRY_SYMBOL]: true;
  readonly config: SchemaRegistryConfig;
  /**
   * Register a schema version against a subject. Enforces the subject's
   * current compat mode; throws when incompatible.
   */
  register(input: {
    readonly subject: string;
    readonly kind: SchemaKind;
    readonly schema: string;
  }): Promise<RegisteredSchema>;
  getById(id: number): Promise<RegisteredSchema | null>;
  getLatestVersion(subject: string): Promise<RegisteredSchema | null>;
  listVersions(subject: string): Promise<RegisteredSchema[]>;
  listSubjects(): Promise<string[]>;
  setCompatibility(subject: string, mode: CompatibilityMode): Promise<void>;
  getCompatibility(subject: string): CompatibilityMode;
  checkCompatibility(input: {
    readonly subject: string;
    readonly kind: SchemaKind;
    readonly schema: string;
  }): CompatibilityCheckResult;
  subjectFor(topic: string, kind: 'key' | 'value'): string;
  reset(): void;
}

interface SubjectState {
  readonly subject: string;
  compat: CompatibilityMode;
  readonly versions: RegisteredSchema[];
}

/**
 * Create a Confluent-shaped schema registry mock. Every registered schema
 * gets a monotonically increasing id + subject-scoped version. Compatibility
 * enforcement is structural — see `checkCompatibility` for the rule set.
 */
export function createSchemaRegistry(config?: SchemaRegistryConfig): SchemaRegistry {
  const cfg: SchemaRegistryConfig = config ?? {};
  const defaultCompat: CompatibilityMode = cfg.defaultCompatibility ?? 'BACKWARD';
  const strategy: SubjectNamingStrategy = cfg.subjectNamingStrategy ?? 'topic-name';
  const subjects = new Map<string, SubjectState>();
  const byId = new Map<number, RegisteredSchema>();
  let nextId = 1;

  function ensureSubject(subject: string): SubjectState {
    const existing = subjects.get(subject);
    if (existing) return existing;
    const created: SubjectState = { subject, compat: defaultCompat, versions: [] };
    subjects.set(subject, created);
    return created;
  }

  const registry: SchemaRegistry = {
    [SCHEMA_REGISTRY_SYMBOL]: true,
    config: cfg,
    async register(input): Promise<RegisteredSchema> {
      const state = ensureSubject(input.subject);
      const check = registry.checkCompatibility(input);
      if (!check.compatible) {
        throw new Error(
          `schema-registry: incompatible schema for subject "${input.subject}" (mode=${check.mode}): ${check.reasons.join('; ')}`,
        );
      }
      // Dedup — if the incoming schema string equals the latest, return it.
      const latest = state.versions[state.versions.length - 1];
      if (latest && latest.schema === input.schema && latest.kind === input.kind) {
        return latest;
      }
      const id = nextId++;
      const version = state.versions.length + 1;
      const entry: RegisteredSchema = {
        id,
        subject: input.subject,
        version,
        kind: input.kind,
        schema: input.schema,
        registeredAt: Date.now(),
      };
      state.versions.push(entry);
      byId.set(id, entry);
      return entry;
    },
    async getById(id: number): Promise<RegisteredSchema | null> {
      return byId.get(id) ?? null;
    },
    async getLatestVersion(subject: string): Promise<RegisteredSchema | null> {
      const state = subjects.get(subject);
      if (!state || state.versions.length === 0) return null;
      return state.versions[state.versions.length - 1] ?? null;
    },
    async listVersions(subject: string): Promise<RegisteredSchema[]> {
      const state = subjects.get(subject);
      if (!state) return [];
      return [...state.versions];
    },
    async listSubjects(): Promise<string[]> {
      return [...subjects.keys()];
    },
    async setCompatibility(subject: string, mode: CompatibilityMode): Promise<void> {
      const state = ensureSubject(subject);
      state.compat = mode;
    },
    getCompatibility(subject: string): CompatibilityMode {
      return subjects.get(subject)?.compat ?? defaultCompat;
    },
    checkCompatibility(input): CompatibilityCheckResult {
      const state = subjects.get(input.subject);
      const mode = state?.compat ?? defaultCompat;
      const reasons: string[] = [];
      if (!state || state.versions.length === 0) {
        return { compatible: true, mode, reasons: [] };
      }
      const latest = state.versions[state.versions.length - 1];
      if (!latest) return { compatible: true, mode, reasons: [] };
      // Structural compat rules — not full Avro/Proto semantic checks:
      //   - required fields removed in new = breaks BACKWARD
      //   - new required fields added = breaks BACKWARD
      //   - kind change = always breaks
      if (latest.kind !== input.kind) {
        reasons.push(`schema kind changed from ${latest.kind} to ${input.kind}`);
      }
      const oldRequired = extractRequiredFields(latest.schema);
      const newRequired = extractRequiredFields(input.schema);
      for (const field of oldRequired) {
        if (!newRequired.has(field)) {
          reasons.push(`required field "${field}" removed`);
        }
      }
      for (const field of newRequired) {
        if (!oldRequired.has(field)) {
          reasons.push(`required field "${field}" added (breaks BACKWARD compatibility)`);
        }
      }
      const compatible = decideCompatibility(mode, reasons);
      return { compatible, mode, reasons };
    },
    subjectFor(topic: string, kind: 'key' | 'value'): string {
      switch (strategy) {
        case 'topic-name':
          return `${topic}-${kind}`;
        case 'record-name':
          return kind === 'key' ? `${topic}Key` : `${topic}Value`;
        case 'topic-record-name':
          return `${topic}-${kind === 'key' ? 'Key' : 'Value'}`;
      }
    },
    reset(): void {
      subjects.clear();
      byId.clear();
      nextId = 1;
    },
  };
  return registry;
}

/**
 * Extract required field names from a schema string. Handles Avro (`"name":`
 * with default absent), Protobuf (`required` keyword), and JSON Schema
 * (`"required": [...]`). Best-effort structural parsing — enough for the
 * mock's compat rules.
 */
function extractRequiredFields(schema: string): Set<string> {
  const out = new Set<string>();
  // Avro: fields entries without a default marker imply required.
  const avroFields = schema.matchAll(/"name"\s*:\s*"([^"]+)"(?![^}]*"default")/g);
  for (const m of avroFields) {
    const name = m[1];
    if (name !== undefined) out.add(name);
  }
  // JSON Schema required array.
  const jsonRequired = /"required"\s*:\s*\[([^\]]*)\]/.exec(schema);
  if (jsonRequired && jsonRequired[1] !== undefined) {
    for (const raw of jsonRequired[1].split(',')) {
      const trimmed = raw.trim().replace(/^"(.*)"$/, '$1');
      if (trimmed.length > 0) out.add(trimmed);
    }
  }
  // Protobuf required keyword (proto2).
  const protoRequired = schema.matchAll(/required\s+\w+\s+(\w+)\s*=/g);
  for (const m of protoRequired) {
    const name = m[1];
    if (name !== undefined) out.add(name);
  }
  return out;
}

/**
 * Decide compat based on mode + observed break reasons.
 *   - NONE: always compatible
 *   - BACKWARD / BACKWARD_TRANSITIVE: break iff removed / added required
 *   - FORWARD / FORWARD_TRANSITIVE: opposite direction (mock treats same set)
 *   - FULL / FULL_TRANSITIVE: any reason breaks
 */
function decideCompatibility(mode: CompatibilityMode, reasons: readonly string[]): boolean {
  if (mode === 'NONE') return true;
  return reasons.length === 0;
}

/** Type guard: recognize a SchemaRegistry. */
export function isSchemaRegistry(value: unknown): value is SchemaRegistry {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [SCHEMA_REGISTRY_SYMBOL]?: true })[SCHEMA_REGISTRY_SYMBOL] === true
  );
}
