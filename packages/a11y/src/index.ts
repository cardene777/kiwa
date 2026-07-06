export type {
  AxeViolation,
  AxeResults,
  AxeRunModule,
  AuditOptions,
} from './types.js';
export {
  runAxe,
  reportViolations,
  expectNoViolations,
  type ViolationReport,
} from './audit.js';
export {
  runLayerHarness,
  bucketViolations,
  unionByRule,
  computeTotals,
  isHarnessOk,
  summariseHarness,
  zeroImpacts,
  IMPACTS,
  type Impact,
  type LayerReport,
  type HarnessReport,
  type HarnessFixtures,
} from './layer-harness.js';
