export type {
  OrchestratorSpec,
  LeanSpecOutput,
  Transition,
  ValidTransition,
  InvalidTransition,
  UnspecifiedPolicy,
} from './types.js';
export { isInvalid } from './types.js';
export { generateLeanSpec } from './generator.js';

export type {
  ConformanceReport,
  Disagreement,
  DisagreementKind,
  Observation,
  Observe,
} from './conformance.js';
export { checkConformance, formatConformance } from './conformance.js';
export { LeanError, SpecError, UsageError } from './errors.js';
export type { Table } from './table.js';

export type {
  ExtractResult,
  ExtractStatus,
  LeanTableReport,
  TableDisagreement,
} from './extract.js';
export { checkLeanTable, extractLeanTable, renderTableProgram } from './extract.js';
export type { LeanRunOptions } from './lean-runner.js';
export type { LakeProjectConfig, LakeProjectFiles } from './lake.js';
export { generateLakeProject } from './lake.js';
export type { VerifyOptions, VerifyResult, VerifyStatus } from './verify.js';
export { verifyLeanSpec } from './verify.js';
