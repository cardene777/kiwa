/**
 * Registry flow — wraps @kiwa/streaming's SchemaRegistry with the
 * dogfood-specific subject naming strategy + a compat-mode switch helper.
 *
 * The dogfood's contract with the registry:
 *   1. Every topic ships a *value* schema, subject = `${topic}-value`
 *   2. Optional key schemas use subject = `${topic}-key`
 *   3. Compat mode defaults to BACKWARD (Confluent SR default), but tests
 *      can flip to FORWARD or FULL per subject to observe the reject path
 */

import type {
  CompatibilityMode,
  RegisteredSchema,
  SchemaKind,
  SchemaRegistry,
} from '@kiwa/streaming';

export interface RegistryRun {
  readonly registry: SchemaRegistry;
  readonly subjectFor: (topic: string, kind: 'key' | 'value') => string;
  readonly register: (input: {
    readonly topic: string;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly nameKind?: 'value' | 'key';
  }) => Promise<RegisteredSchema>;
  readonly setCompatibility: (
    topic: string,
    mode: CompatibilityMode,
    nameKind?: 'value' | 'key',
  ) => Promise<void>;
  readonly checkCompatibility: (input: {
    readonly topic: string;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly nameKind?: 'value' | 'key';
  }) => ReturnType<SchemaRegistry['checkCompatibility']>;
}

/**
 * Build the registry run. Every op derives its subject from `topic + nameKind`
 * via the registry's configured subject naming strategy, so tests can swap
 * strategy from the SchemaRegistryConfig without touching call sites.
 */
export function createRegistryRun(registry: SchemaRegistry): RegistryRun {
  function subjectFor(topic: string, kind: 'key' | 'value'): string {
    return registry.subjectFor(topic, kind);
  }

  async function register(input: {
    readonly topic: string;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly nameKind?: 'value' | 'key';
  }): Promise<RegisteredSchema> {
    const kind = input.nameKind ?? 'value';
    const subject = subjectFor(input.topic, kind);
    return registry.register({ subject, kind: input.kind, schema: input.schema });
  }

  async function setCompatibility(
    topic: string,
    mode: CompatibilityMode,
    nameKind: 'value' | 'key' = 'value',
  ): Promise<void> {
    await registry.setCompatibility(subjectFor(topic, nameKind), mode);
  }

  function checkCompatibility(input: {
    readonly topic: string;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly nameKind?: 'value' | 'key';
  }): ReturnType<SchemaRegistry['checkCompatibility']> {
    const kind = input.nameKind ?? 'value';
    return registry.checkCompatibility({
      subject: subjectFor(input.topic, kind),
      kind: input.kind,
      schema: input.schema,
    });
  }

  return { registry, subjectFor, register, setCompatibility, checkCompatibility };
}
