/**
 * Higher-level flows that compose the adapter ops. These are the driver
 * functions that both the mock-mode tests and the fidelity harness run.
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
