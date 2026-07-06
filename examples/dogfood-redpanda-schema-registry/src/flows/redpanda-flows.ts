/**
 * Higher-level flows that compose the adapter ops. These are the driver
 * functions that both the mock-mode tests and the fidelity harness run.
 *
 * v1 (v1.20-3) covered 5 ops. v1.31-3 adds 4 v2 flow helpers so callers
 * don't have to reach into the adapter directly for the transitive /
 * strategy / admin / testcontainers ops.
 */

import type {
  RedpandaSchemaRegistryAdapter,
  UserPayload,
} from '../adapters/interface.js';

export async function driveRegisterFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ subjectCount: number; distinctIds: number }> {
  const out = await adapter.driveRegister();
  const distinctIds = new Set(out.registeredIds).size;
  return { subjectCount: out.subjects.length, distinctIds };
}

export async function driveEvolutionFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ compatibleV2: boolean; rejectedIncompatible: boolean; subject: string }> {
  const out = await adapter.driveEvolution();
  return {
    compatibleV2: out.compatibleV2,
    rejectedIncompatible: out.rejectedIncompatible,
    subject: out.subject,
  };
}

export async function driveCompatibilityModesFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ modes: number; allReject: boolean }> {
  const out = await adapter.driveCompatibilityModes();
  return {
    modes: out.probed.length,
    allReject: out.probed.every((r) => !r.compatible),
  };
}

export async function drivePublishFlow(
  adapter: RedpandaSchemaRegistryAdapter,
  payloads: readonly UserPayload[],
): Promise<{ recordsPublished: number; rejectedByCompatibility: number }> {
  const out = await adapter.drivePublish(payloads);
  return {
    recordsPublished: out.recordsPublished,
    rejectedByCompatibility: out.rejectedByCompatibility,
  };
}

export async function driveFidelityFlow(adapter: RedpandaSchemaRegistryAdapter): Promise<void> {
  await adapter.emitFidelity();
}

// -----------------------------------------------------------------------------
// v2 flows — surface the 4 new adapter ops behind flat helper functions so
// tests can compose them like the v1 flows.
// -----------------------------------------------------------------------------

export async function driveEvolutionTransitiveFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ versionsAccepted: number; rejectedTransitiveOnly: boolean; chainLength: number }> {
  const out = await adapter.driveEvolutionTransitive();
  return {
    versionsAccepted: out.versionsAccepted,
    rejectedTransitiveOnly: out.rejectedTransitiveOnly,
    chainLength: out.chainVerdicts.length,
  };
}

export async function driveSubjectStrategiesFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ strategyCount: number; allRegistered: boolean; subjects: readonly string[] }> {
  const out = await adapter.driveSubjectStrategies();
  return {
    strategyCount: out.probed.length,
    allRegistered: out.probed.every((p) => p.registered),
    subjects: out.probed.map((p) => p.derivedSubject),
  };
}

export async function driveConsoleAdminFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{ endpointCount: number; healthOk: boolean; subjectsSeen: number }> {
  const out = await adapter.driveConsoleAdmin();
  return {
    endpointCount: out.endpoints.length,
    healthOk: out.healthOk,
    subjectsSeen: out.subjectsSeen,
  };
}

export async function driveTestcontainersProbeFlow(
  adapter: RedpandaSchemaRegistryAdapter,
): Promise<{
  reachable: boolean;
  bootstrap: string;
  consoleUrl: string;
  redpandaImage: string;
}> {
  const out = await adapter.driveTestcontainersProbe();
  return {
    reachable: out.reachable,
    bootstrap: out.bootstrap,
    consoleUrl: out.consoleUrl,
    redpandaImage: out.redpandaImage,
  };
}
