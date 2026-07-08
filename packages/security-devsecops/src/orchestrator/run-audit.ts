import {
  containerSecurityMockAdapter,
  containerSecurityRealAdapter,
  dastMockAdapter,
  dastRealAdapter,
  iacScanMockAdapter,
  iacScanRealAdapter,
  sastMockAdapter,
  sastRealAdapter,
  scaMockAdapter,
  scaRealAdapter,
  secretScanMockAdapter,
  secretScanRealAdapter,
} from '../adapters/index.js';
import type { AdapterMode, AnyAdapter } from '../adapters/types.js';
import type { DevSecOpsAxis } from '../semantics/types.js';
import { axisForPreset } from './preset.js';
import type {
  AuditInvocation,
  AuditReport,
  AxisAuditResult,
} from './types.js';

const MOCK_ADAPTERS: Record<DevSecOpsAxis, AnyAdapter> = {
  sast: sastMockAdapter,
  sca: scaMockAdapter,
  'secret-scan': secretScanMockAdapter,
  'iac-scan': iacScanMockAdapter,
  dast: dastMockAdapter,
  'container-security': containerSecurityMockAdapter,
};

const REAL_ADAPTERS: Record<DevSecOpsAxis, AnyAdapter> = {
  sast: sastRealAdapter,
  sca: scaRealAdapter,
  'secret-scan': secretScanRealAdapter,
  'iac-scan': iacScanRealAdapter,
  dast: dastRealAdapter,
  'container-security': containerSecurityRealAdapter,
};

function pickAdapter(axis: DevSecOpsAxis, mode: AdapterMode): AnyAdapter {
  return mode === 'mock' ? MOCK_ADAPTERS[axis] : REAL_ADAPTERS[axis];
}

/**
 * DevSecOps library single entry (v0.3、 Phase 3)。
 *
 * skill 4 種の workflow を library 内に集約、 skill 側は preset 選択だけで
 * 6 axis を横断的に扱える。 backward compat 維持 = v0.1 semantics 直接使用 +
 * v0.2 adapter 個別使用も引き続き動作。
 */
export async function runSecurityAudit(input: AuditInvocation): Promise<AuditReport> {
  const startedAt = Date.now();
  const axes = axisForPreset(input.preset);
  const results: AxisAuditResult[] = [];
  let idx = 0;
  for (const axis of axes) {
    const adapter = pickAdapter(axis, input.mode);
    const scanId = `${input.preset}-${axis}-${idx++}`;
    const r = await adapter.scan({
      scanId,
      target: input.target,
      mode: input.mode,
      ...(input.metadata ? { metadata: input.metadata } : {}),
    });
    results.push({
      axis: r.axis,
      mode: r.mode,
      completed: r.completed,
      eventCount: r.history.length,
      durationMs: r.durationMs,
      history: r.history,
    });
  }
  return {
    preset: input.preset,
    target: input.target,
    mode: input.mode,
    startedAt,
    finishedAt: Date.now(),
    results,
  };
}
