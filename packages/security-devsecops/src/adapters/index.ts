/**
 * DevSecOps adapter barrel (v0.2)。
 *
 * v0.1 semantics = pure state-machine (backward compat 維持)、 v0.2 adapter =
 * scan target → semantics 経由の deterministic replay (mock) or 実 CLI 呼出隠蔽
 * (real、 v1.47-2 で追加)。
 */
export * from './types.js';

export { sastMockAdapter } from './sast-mock.js';
export { scaMockAdapter } from './sca-mock.js';
export { secretScanMockAdapter } from './secret-scan-mock.js';
export { iacScanMockAdapter } from './iac-scan-mock.js';
export { dastMockAdapter } from './dast-mock.js';
export { containerSecurityMockAdapter } from './container-security-mock.js';
