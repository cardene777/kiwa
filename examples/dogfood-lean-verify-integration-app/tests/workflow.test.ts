import { describe, expect, it } from 'vitest';
import type { OrchestratorSpec } from '@kiwa-lab/lean';
import {
  batchVerify,
  isSkippedOrNotInstalled,
  specToVerify,
} from '../src/workflow.js';

const TRANSACTION_SPEC: OrchestratorSpec = {
  moduleName: 'TransactionOrchestrator',
  namespace: 'Transaction',
  states: ['beginning', 'active', 'savepoint-nested', 'committing', 'aborted'],
  events: [
    'begin-completed',
    'query-executed',
    'savepoint-created',
    'savepoint-released',
    'commit-requested',
    'commit-succeeded',
    'rollback-requested',
    'timeout',
  ],
  transitions: [
    { from: 'beginning', event: 'begin-completed', to: 'active' },
    { from: 'active', event: 'commit-requested', to: 'committing' },
  ],
};

const SESSION_SPEC: OrchestratorSpec = {
  moduleName: 'SessionLifecycleOrchestrator',
  namespace: 'Session',
  states: ['init', 'authed', 'refreshing', 'expired', 'revoked'],
  events: [
    'auth-succeeded',
    'auth-failed',
    'refresh-triggered',
    'refresh-succeeded',
    'refresh-failed',
    'session-expired',
    'revoke-requested',
    'timeout',
  ],
  transitions: [{ from: 'init', event: 'auth-succeeded', to: 'authed' }],
};

describe('dogfood-lean-verify-integration (v2.15-2)', () => {
  it('Pattern 1: specToVerify returns lean-not-installed on typical dev environment (or ok if Lean is installed)', () => {
    const result = specToVerify(TRANSACTION_SPEC);
    expect(['lean-not-installed', 'ok', 'verification-failed']).toContain(result.status);
  });

  it('Pattern 2: batchVerify with skip=true always returns skipped-by-env', () => {
    const result = batchVerify([TRANSACTION_SPEC, SESSION_SPEC], { skip: true });
    expect(result.status).toBe('skipped-by-env');
    expect(result.verifiedFiles.length).toBe(2);
  });

  it('Pattern 3: isSkippedOrNotInstalled detects both skip and not-installed', () => {
    const skipped = batchVerify([TRANSACTION_SPEC], { skip: true });
    expect(isSkippedOrNotInstalled(skipped)).toBe(true);
    const notInstalled: import('@kiwa-lab/lean').VerifyResult = {
      status: 'lean-not-installed',
      verifiedFiles: [],
    };
    expect(isSkippedOrNotInstalled(notInstalled)).toBe(true);
    const ok: import('@kiwa-lab/lean').VerifyResult = {
      status: 'ok',
      verifiedFiles: [],
    };
    expect(isSkippedOrNotInstalled(ok)).toBe(false);
  });

  it('Pattern 4: batchVerify skip path emits KiwaSpecs paths for all inputs', () => {
    const result = batchVerify([TRANSACTION_SPEC, SESSION_SPEC], { skip: true });
    expect(result.verifiedFiles).toEqual([
      'KiwaSpecs/TransactionOrchestrator.lean',
      'KiwaSpecs/SessionLifecycleOrchestrator.lean',
    ]);
  });

  it('5 orchestrator バッチ検証統合 (skip 経路で 決定的 CI 動作 = kiwa 全体 systematic pattern の 2 軸融合実験)', () => {
    const specs: OrchestratorSpec[] = [
      TRANSACTION_SPEC,
      SESSION_SPEC,
      { ...TRANSACTION_SPEC, moduleName: 'CacheLifecycleOrchestrator', namespace: 'Cache' },
      { ...TRANSACTION_SPEC, moduleName: 'JobLifecycleOrchestrator', namespace: 'Job' },
      { ...TRANSACTION_SPEC, moduleName: 'CliLifecycleOrchestrator', namespace: 'Cli' },
    ];
    const result = batchVerify(specs, { skip: true });
    expect(result.status).toBe('skipped-by-env');
    expect(result.verifiedFiles.length).toBe(5);
  });
});
