/**
 * DevSecOps orchestrator types (v0.3、 Phase 3)。
 *
 * v0.1 = semantics library、 v0.2 = 6 axis × mock/real adapter pair、
 * v0.3 = runSecurityAudit single entry + 4 preset + summary API。
 * skill 4 種 (security-audit / supply-chain / specialty / threat-model) が
 * library single entry で置換可能な状態に到達、 DevSecOps library 化 3 段完成。
 */
import type {
  AdapterMode,
  AdapterResult,
} from '../adapters/types.js';
import type { DevSecOpsAxis, Severity } from '../semantics/types.js';

export type AuditPreset =
  | 'audit-all'
  | 'supply-chain'
  | 'specialty'
  | 'threat-model';

export interface AuditInvocation {
  preset: AuditPreset;
  target: string;
  mode: AdapterMode;
  metadata?: Record<string, string | number | boolean>;
}

export interface AxisAuditResult {
  axis: DevSecOpsAxis;
  mode: AdapterMode;
  completed: boolean;
  eventCount: number;
  durationMs: number;
  history: AdapterResult<unknown>['history'];
}

export interface AuditReport {
  preset: AuditPreset;
  target: string;
  mode: AdapterMode;
  startedAt: number;
  finishedAt: number;
  results: AxisAuditResult[];
}

export interface AuditSummary {
  preset: AuditPreset;
  totalAxis: number;
  completedAxis: number;
  totalEvents: number;
  totalDurationMs: number;
  perAxis: Array<{
    axis: DevSecOpsAxis;
    completed: boolean;
    eventCount: number;
  }>;
  stridDreadTags?: Array<{ axis: DevSecOpsAxis; tag: string; severity: Severity }>;
}
