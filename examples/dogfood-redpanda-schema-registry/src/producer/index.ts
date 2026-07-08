/**
 * Redpanda producer flow — schema-aware publish.
 *
 * The producer registers the value schema against the subject *before* every
 * publish and fails-fast when the incoming schema is incompatible with the
 * subject's compat mode. The dogfood models "compatibility check on publish",
 * which is what real Confluent SR clients do via a wire-format prefix
 * (magic byte + schema id).
 *
 * Serialization is a JSON-string sidecar — the mock does not model Avro
 * binary framing; the "schema id" that flows on the wire is stashed in the
 * message header (`x-schema-id`) instead of a magic byte prefix.
 */

import type {
  KafkaMock,
  PublishResult,
  SchemaKind,
  SchemaRegistry,
} from '@kiwa/streaming';

export interface ProducerRun {
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
  /**
   * Publish one payload against a topic. `ensureSchema` registers the
   * schema against `${topic}-value` (fail-fast on compat reject) and stamps
   * the resulting id in the message header.
   */
  readonly publish: <T>(input: {
    readonly topic: string;
    readonly payload: T;
    readonly schema: string;
    readonly kind?: SchemaKind;
  }) => Promise<PublishResult>;
  readonly compatibilityRejections: () => readonly {
    readonly topic: string;
    readonly reasons: readonly string[];
    readonly at: number;
  }[];
}

/** Build the producer run bound to a Redpanda mock + schema registry. */
export function createProducerRun(input: {
  readonly kafka: KafkaMock;
  readonly registry: SchemaRegistry;
}): ProducerRun {
  const rejections: {
    readonly topic: string;
    readonly reasons: readonly string[];
    readonly at: number;
  }[] = [];
  const producer = input.kafka.producer();

  async function ensureSchema(topic: string, schema: string, kind: SchemaKind): Promise<number> {
    const subject = input.registry.subjectFor(topic, 'value');
    const check = input.registry.checkCompatibility({ subject, kind, schema });
    if (!check.compatible) {
      rejections.push({ topic, reasons: [...check.reasons], at: Date.now() });
      throw new Error(
        `producer: compatibility check failed for ${subject} (mode=${check.mode}): ${check.reasons.join('; ')}`,
      );
    }
    const entry = await input.registry.register({ subject, kind, schema });
    return entry.id;
  }

  async function publish<T>(payload: {
    readonly topic: string;
    readonly payload: T;
    readonly schema: string;
    readonly kind?: SchemaKind;
  }): Promise<PublishResult> {
    const kind = payload.kind ?? 'avro';
    const schemaId = await ensureSchema(payload.topic, payload.schema, kind);
    const [result] = await producer.send<T>({
      topic: payload.topic,
      messages: [
        {
          value: payload.payload,
          headers: {
            'x-schema-id': String(schemaId),
            'x-schema-kind': kind,
          },
        },
      ],
    });
    if (!result) {
      throw new Error(`producer: send returned no result for topic ${payload.topic}`);
    }
    return result;
  }

  return {
    connect: () => producer.connect(),
    disconnect: () => producer.disconnect(),
    publish,
    compatibilityRejections: () => [...rejections],
  };
}
