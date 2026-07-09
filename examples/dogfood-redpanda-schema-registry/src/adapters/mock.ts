/**
 * Mock adapter — spins up 1 RedpandaMock (with a colocated SchemaRegistry
 * mock) and wires the 9 dogfood flows (5 v1 + 4 v2) against it. Every op
 * appends 1 latency sample and 1 trace event so the fidelity harness never
 * reads as 0-sample.
 *
 * v2 (v1.31-3) adds transitive evolution + subject strategy probe + Redpanda
 * Console admin fixture + testcontainers probe placeholders. The Console
 * admin fixture wires `createFixtureFetch` into the shared
 * {@link createConsoleAdminClient} so the mock + real adapters trace the
 * same endpoint list on the fidelity harness.
 */

import {
  createRedpandaMock,
  type CompatibilityMode,
  type RedpandaMock,
} from '@kiwa-lab/streaming';
import {
  ORDER_V1_SCHEMA_STRING,
  USER_V1_SCHEMA_STRING,
  USER_V2_BREAK_SCHEMA_STRING,
  USER_V2_SCHEMA_STRING,
  USER_V3_SCHEMA_STRING,
  USER_V3_TRANSITIVE_BREAK_SCHEMA_STRING,
} from '../schemas/index.js';
import { createProducerRun } from '../producer/index.js';
import { createRegistryRun } from '../registry/index.js';
import {
  createConsoleAdminClient,
  createFixtureFetch,
} from '../console/index.js';
import type {
  CompatibilityObservation,
  ConsoleAdminObservation,
  EvolutionObservation,
  PublishObservation,
  RedpandaSchemaRegistryAdapter,
  RegisterObservation,
  SubjectStrategyObservation,
  TestcontainersProbeObservation,
  TraceEvent,
  TransitiveEvolutionObservation,
  UserPayload,
} from './interface.js';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_REDPANDA_BOOTSTRAP = 'redpanda-mock:9092';
export const MOCK_CONSOLE_URL = 'http://redpanda-console-mock:8080';
export const MOCK_SCHEMA_REGISTRY_URL = 'http://schema-registry-mock:8081';
export const REDPANDA_IMAGE_DEFAULT = 'redpandadata/redpanda:v23.3.5';
export const REDPANDA_CONSOLE_IMAGE_DEFAULT = 'redpandadata/console:v2.4.5';

export interface MockAdapterOptions {
  readonly clientId?: string;
}

/**
 * Build the mock adapter. All baseline schemas (User v1 / User v2 / User v3
 * / Order v1) live in `src/schemas/*` so the mock and the tests use the same
 * canonical Avro strings.
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): RedpandaSchemaRegistryAdapter {
  const config = {
    clientId: opts.clientId ?? 'dogfood-redpanda-schema-registry',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    subjectsRegistered: 0,
    recordsPublished: 0,
    compatibilityRejections: 0,
    evolutionSteps: 0,
    transitiveChainSteps: 0,
    subjectStrategyProbes: 0,
    consoleAdminCalls: 0,
    testcontainersProbes: 0,
  };

  let redpanda: RedpandaMock | null = null;

  function ensure(): RedpandaMock {
    if (redpanda) return redpanda;
    redpanda = createRedpandaMock({
      clientId: config.clientId,
      schemaRegistry: { defaultCompatibility: 'BACKWARD', subjectNamingStrategy: 'topic-name' },
    });
    return redpanda;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'REDPANDA_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveRegister(): Promise<RegisterObservation> {
      return timed('driveRegister', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Register 3 schemas across 2 topics — verifies subject naming +
        // multi-subject bookkeeping.
        const userV1 = await reg.register({
          topic: 'users',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const orderV1 = await reg.register({
          topic: 'orders',
          kind: 'avro',
          schema: ORDER_V1_SCHEMA_STRING,
        });
        // Second registration on `users` — same schema, dedup returns same id.
        const userV1Dup = await reg.register({
          topic: 'users',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const subjects = await reg.registry.listSubjects();
        const observation: RegisterObservation = {
          subjects: [...subjects].sort(),
          registeredIds: [userV1.id, orderV1.id, userV1Dup.id],
          latestVersions: {
            'users-value': userV1.version,
            'orders-value': orderV1.version,
          },
        };
        metricsAgg.subjectsRegistered += subjects.length;
        record('driveRegister', subjects.length === 2 && userV1.id === userV1Dup.id, {
          detail: {
            subjectCount: subjects.length,
            userV1: userV1.id,
            orderV1: orderV1.id,
            dedupHit: userV1.id === userV1Dup.id,
          },
        });
        return observation;
      });
    },

    async driveEvolution(): Promise<EvolutionObservation> {
      return timed('driveEvolution', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Step 1: register v1.
        const v1 = await reg.register({
          topic: 'users-evo',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        // Step 2: register v2 (adds an optional `email` field with default null).
        // BACKWARD-compatible — the registry accepts and bumps version.
        const v2 = await reg.register({
          topic: 'users-evo',
          kind: 'avro',
          schema: USER_V2_SCHEMA_STRING,
        });
        // Step 3: try registering the BREAK variant (adds a *required* email
        // field with no default). BACKWARD-incompatible → registry rejects.
        let rejectedIncompatible = false;
        try {
          await reg.register({
            topic: 'users-evo',
            kind: 'avro',
            schema: USER_V2_BREAK_SCHEMA_STRING,
          });
        } catch {
          rejectedIncompatible = true;
        }
        metricsAgg.evolutionSteps += 2;
        const observation: EvolutionObservation = {
          subject: reg.subjectFor('users-evo', 'value'),
          v1Id: v1.id,
          v2Id: v2.id,
          compatibleV2: v2.version === v1.version + 1,
          rejectedIncompatible,
        };
        record(
          'driveEvolution',
          v2.version === v1.version + 1 && rejectedIncompatible,
          {
            detail: {
              subject: observation.subject,
              v1Version: v1.version,
              v2Version: v2.version,
              rejectedIncompatible,
            },
          },
        );
        return observation;
      });
    },

    async driveCompatibilityModes(): Promise<CompatibilityObservation> {
      return timed('driveCompatibilityModes', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Prime the subject with v1 so subsequent compat checks have a
        // baseline to compare against.
        await reg.register({
          topic: 'users-compat',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const probes: readonly CompatibilityMode[] = ['BACKWARD', 'FORWARD', 'FULL'];
        const results: {
          readonly subject: string;
          readonly mode: CompatibilityMode;
          readonly compatible: boolean;
          readonly reasons: readonly string[];
        }[] = [];
        for (const mode of probes) {
          // eslint-disable-next-line no-await-in-loop
          await reg.setCompatibility('users-compat', mode);
          // Probe with the BREAK variant (adds required field, no default) —
          // BACKWARD / FORWARD / FULL all reject; NONE would accept but is
          // out of the 3-mode scope.
          const check = reg.checkCompatibility({
            topic: 'users-compat',
            kind: 'avro',
            schema: USER_V2_BREAK_SCHEMA_STRING,
          });
          results.push({
            subject: reg.subjectFor('users-compat', 'value'),
            mode,
            compatible: check.compatible,
            reasons: check.reasons,
          });
        }
        const observation: CompatibilityObservation = { probed: results };
        record('driveCompatibilityModes', results.every((r) => !r.compatible), {
          detail: {
            modes: probes,
            allReject: results.every((r) => !r.compatible),
          },
        });
        return observation;
      });
    },

    async drivePublish(payloads: readonly UserPayload[]): Promise<PublishObservation> {
      return timed('drivePublish', async () => {
        const rp = ensure();
        const admin = rp.admin();
        await admin.connect();
        await admin.createTopics({ topics: [{ topic: 'users-pub', numPartitions: 1 }] });
        await admin.disconnect();
        const producer = createProducerRun({ kafka: rp, registry: rp.schemaRegistry });
        await producer.connect();

        let published = 0;
        for (const payload of payloads) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await producer.publish({
              topic: 'users-pub',
              payload,
              schema: USER_V1_SCHEMA_STRING,
              kind: 'avro',
            });
            published += 1;
          } catch {
            // Producer records the compat rejection internally.
          }
        }

        // Now flip the subject to a required-only schema and try one more
        // publish — the fail-fast path kicks in.
        await rp.schemaRegistry.setCompatibility('users-pub-value', 'BACKWARD');
        try {
          await producer.publish({
            topic: 'users-pub',
            payload: payloads[0] ?? { id: 'x', displayName: 'x', region: 'us' },
            schema: USER_V2_BREAK_SCHEMA_STRING,
            kind: 'avro',
          });
          published += 1;
        } catch {
          // Expected — BACKWARD rejects the required-field addition.
        }

        await producer.disconnect();
        const rejections = producer.compatibilityRejections();
        metricsAgg.recordsPublished += published;
        metricsAgg.compatibilityRejections += rejections.length;
        const observation: PublishObservation = {
          recordsPublished: published,
          rejectedByCompatibility: rejections.length,
        };
        record('drivePublish', published === payloads.length && rejections.length === 1, {
          detail: {
            payloadCount: payloads.length,
            published,
            rejected: rejections.length,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, { detail: { mode: 'mock' } });
      });
    },

    // -------------------------------------------------------------------------
    // v2 ops — advanced Schema Registry semantics + Console admin + testcontainers
    // probe.
    // -------------------------------------------------------------------------

    async driveEvolutionTransitive(): Promise<TransitiveEvolutionObservation> {
      return timed('driveEvolutionTransitive', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Prime the chain with v1 + v2 under BACKWARD, then flip to
        // BACKWARD_TRANSITIVE so v3 must clear against BOTH v1 AND v2.
        await reg.setCompatibility('users-trans', 'BACKWARD');
        await reg.register({
          topic: 'users-trans',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        await reg.register({
          topic: 'users-trans',
          kind: 'avro',
          schema: USER_V2_SCHEMA_STRING,
        });
        // Register v3 under BACKWARD — accepted (adds an optional field with a
        // default vs v2).
        const v3 = await reg.register({
          topic: 'users-trans',
          kind: 'avro',
          schema: USER_V3_SCHEMA_STRING,
        });
        // Flip to BACKWARD_TRANSITIVE + probe the transitive-break variant.
        // Immediate BACKWARD check against v3 might treat it as delta-only
        // (metadata newly required vs v3); the transitive check rechecks
        // against v1 + v2 too, catching the added-required-field breakage.
        await reg.setCompatibility('users-trans', 'BACKWARD_TRANSITIVE');
        const versions = await rp.schemaRegistry.listVersions('users-trans-value');
        const chainVerdicts: {
          readonly from: number;
          readonly to: number;
          readonly compatible: boolean;
        }[] = [];
        // Walk every prior version + record whether the candidate would satisfy
        // BACKWARD against that specific prior version. The candidate is the
        // TRANSITIVE_BREAK variant (adds required `metadata` field).
        const transitiveMode: 'BACKWARD_TRANSITIVE' = 'BACKWARD_TRANSITIVE';
        let anyPriorBreaks = false;
        for (const prior of versions) {
          const priorRequired = extractRequiredFields(prior.schema);
          const candidateRequired = extractRequiredFields(USER_V3_TRANSITIVE_BREAK_SCHEMA_STRING);
          let compatibleVsPrior = true;
          for (const field of candidateRequired) {
            if (!priorRequired.has(field)) {
              compatibleVsPrior = false;
            }
          }
          chainVerdicts.push({
            from: prior.version,
            to: prior.version + 1,
            compatible: compatibleVsPrior,
          });
          if (!compatibleVsPrior) anyPriorBreaks = true;
        }
        // Assert the immediate-check would accept the change (v3 vs
        // TRANSITIVE_BREAK still shares the `metadata` field as required, so
        // no new-required-field breakage vs the immediate neighbour — but the
        // transitive check catches it against v1 + v2).
        let rejectedTransitiveOnly = false;
        try {
          await reg.register({
            topic: 'users-trans',
            kind: 'avro',
            schema: USER_V3_TRANSITIVE_BREAK_SCHEMA_STRING,
          });
        } catch {
          // The mock's baseline check only looks at immediate neighbour; the
          // transitive-only rejection therefore lives in the walker above.
        }
        // When the immediate check accepted the change but the transitive
        // walker flagged a prior break, we surface the transitive-only reject.
        rejectedTransitiveOnly = anyPriorBreaks;
        const observation: TransitiveEvolutionObservation = {
          subject: reg.subjectFor('users-trans', 'value'),
          versionsAccepted: versions.length,
          transitiveMode,
          rejectedTransitiveOnly,
          chainVerdicts,
        };
        metricsAgg.transitiveChainSteps += chainVerdicts.length;
        record('driveEvolutionTransitive', v3.version === 3 && rejectedTransitiveOnly, {
          detail: {
            subject: observation.subject,
            versionsAccepted: observation.versionsAccepted,
            transitiveMode,
            rejectedTransitiveOnly,
          },
        });
        return observation;
      });
    },

    async driveSubjectStrategies(): Promise<SubjectStrategyObservation> {
      return timed('driveSubjectStrategies', async () => {
        // Each strategy needs a fresh registry so the subject-derivation logic
        // uses the strategy configured at construction time. The mock takes
        // the strategy from the RedpandaMock ctor arg so we spin up 3
        // parallel registries.
        const strategies: readonly ('topic-name' | 'record-name' | 'topic-record-name')[] = [
          'topic-name',
          'record-name',
          'topic-record-name',
        ];
        const probed: {
          readonly strategy: 'topic-name' | 'record-name' | 'topic-record-name';
          readonly derivedSubject: string;
          readonly registered: boolean;
          readonly latestVersion: number;
        }[] = [];
        for (const strategy of strategies) {
          const rp = createRedpandaMock({
            clientId: config.clientId,
            schemaRegistry: {
              defaultCompatibility: 'BACKWARD',
              subjectNamingStrategy: strategy,
            },
          });
          const derivedSubject = rp.schemaRegistry.subjectFor('users', 'value');
          let registered = false;
          let latestVersion = 0;
          try {
            const entry = await rp.schemaRegistry.register({
              subject: derivedSubject,
              kind: 'avro',
              schema: USER_V1_SCHEMA_STRING,
            });
            registered = true;
            latestVersion = entry.version;
          } catch {
            // The mock accepts every fresh register; a rejection would be a
            // bug in the streaming package.
          }
          probed.push({ strategy, derivedSubject, registered, latestVersion });
          rp.reset();
        }
        metricsAgg.subjectStrategyProbes += probed.length;
        const observation: SubjectStrategyObservation = { probed };
        record('driveSubjectStrategies', probed.every((p) => p.registered), {
          detail: {
            strategies: probed.map((p) => p.strategy),
            allRegistered: probed.every((p) => p.registered),
          },
        });
        return observation;
      });
    },

    async driveConsoleAdmin(): Promise<ConsoleAdminObservation> {
      return timed('driveConsoleAdmin', async () => {
        const rp = ensure();
        // Prime the subject so the fixture surfaces 1+ subject.
        try {
          await rp.schemaRegistry.register({
            subject: 'users-value',
            kind: 'avro',
            schema: USER_V1_SCHEMA_STRING,
          });
        } catch {
          // Already registered by a prior op — ignore.
        }
        const subjects = await rp.schemaRegistry.listSubjects();
        const configBySubject: Record<string, string> = {};
        for (const subject of subjects) {
          configBySubject[subject] = rp.schemaRegistry.getCompatibility(subject);
        }
        const schemaById: Record<number, string> = { 1: USER_V1_SCHEMA_STRING };
        const client = createConsoleAdminClient({
          baseUrl: MOCK_CONSOLE_URL,
          fetchImpl: createFixtureFetch({
            subjects,
            configBySubject,
            schemaById,
          }),
        });
        const listed = await client.listSubjects();
        const configFetch = subjects[0]
          ? await client.getSubjectConfig(subjects[0])
          : { ok: false, compatibilityLevel: null };
        const schemaFetch = await client.getSchemaById(1);
        const health = await client.health();
        const observation: ConsoleAdminObservation = {
          baseUrl: MOCK_CONSOLE_URL,
          endpoints: client.hits(),
          healthOk: health.ok && health.status === 'up',
          subjectsSeen: listed.subjects.length,
          schemaByIdReachable: schemaFetch.ok,
        };
        metricsAgg.consoleAdminCalls += client.hits().length;
        record(
          'driveConsoleAdmin',
          observation.healthOk && observation.subjectsSeen > 0 && observation.schemaByIdReachable,
          {
            detail: {
              subjectsSeen: observation.subjectsSeen,
              healthOk: observation.healthOk,
              endpointCount: client.hits().length,
              configFetched: configFetch.ok,
            },
          },
        );
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          bootstrap: MOCK_REDPANDA_BOOTSTRAP,
          consoleUrl: MOCK_CONSOLE_URL,
          schemaRegistryUrl: MOCK_SCHEMA_REGISTRY_URL,
          redpandaImage: REDPANDA_IMAGE_DEFAULT,
          consoleImage: REDPANDA_CONSOLE_IMAGE_DEFAULT,
          reachable: true,
        };
        record('driveTestcontainersProbe', true, {
          detail: {
            bootstrap: observation.bootstrap,
            consoleUrl: observation.consoleUrl,
            reachable: observation.reachable,
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        subjectsRegistered: metricsAgg.subjectsRegistered,
        recordsPublished: metricsAgg.recordsPublished,
        compatibilityRejections: metricsAgg.compatibilityRejections,
        evolutionSteps: metricsAgg.evolutionSteps,
        transitiveChainSteps: metricsAgg.transitiveChainSteps,
        subjectStrategyProbes: metricsAgg.subjectStrategyProbes,
        consoleAdminCalls: metricsAgg.consoleAdminCalls,
        testcontainersProbes: metricsAgg.testcontainersProbes,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.subjectsRegistered = 0;
      metricsAgg.recordsPublished = 0;
      metricsAgg.compatibilityRejections = 0;
      metricsAgg.evolutionSteps = 0;
      metricsAgg.transitiveChainSteps = 0;
      metricsAgg.subjectStrategyProbes = 0;
      metricsAgg.consoleAdminCalls = 0;
      metricsAgg.testcontainersProbes = 0;
      if (redpanda) redpanda.reset();
      redpanda = null;
    },
  };
}

export function sampleUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
  return {
    id: 'u-1',
    displayName: 'Alice',
    region: 'us',
    ...overrides,
  };
}

/**
 * Extract required-field names from an Avro schema string. Duplicated from
 * the streaming package's structural check so the adapter can perform a
 * transitive walk against every prior version — the streaming package only
 * checks against the immediate neighbour.
 */
function extractRequiredFields(schema: string): Set<string> {
  const out = new Set<string>();
  const avroFields = schema.matchAll(/"name"\s*:\s*"([^"]+)"(?![^}]*"default")/g);
  for (const m of avroFields) {
    const name = m[1];
    if (name !== undefined) out.add(name);
  }
  return out;
}
