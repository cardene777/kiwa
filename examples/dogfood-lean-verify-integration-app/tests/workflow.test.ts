import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateLeanSpec, verifyLeanSpec, type OrchestratorSpec } from '@kiwa-lab/lean';
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
  unspecified: 'invalid',
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
  unspecified: 'invalid',
  transitions: [{ from: 'init', event: 'auth-succeeded', to: 'authed' }],
};

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('dogfood-lean-verify-integration (v2.15-2)', () => {
  it('Pattern 1: specToVerify verifies with Lean, and reports its absence otherwise', () => {
    // `verification-failed` used to be accepted here too, so the assertion held
    // whatever happened. With a toolchain present, a generated spec verifies.
    const result = specToVerify(TRANSACTION_SPEC);
    expect(result.status).toBe(leanInstalled() ? 'ok' : 'lean-not-installed');
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

  it.skipIf(!leanInstalled())(
    'Pattern 5: 実 toolchain が 5 spec をまとめて検証する',
    () => {
      const specs: OrchestratorSpec[] = [
        TRANSACTION_SPEC,
        SESSION_SPEC,
        { ...SESSION_SPEC, moduleName: 'CacheLifecycleOrchestrator', namespace: 'Cache' },
      ];
      const result = batchVerify(specs);
      expect(result.status).toBe('ok');
      expect(result.verifiedFiles.length).toBe(3);
    },
  );

  it.skipIf(!leanInstalled())('Pattern 6: 壊れた spec は理由付きで拒否される', () => {
    // beginning からしか出られない機械で、 beginning を終端だと主張させる。
    const broken: OrchestratorSpec = {
      ...TRANSACTION_SPEC,
      moduleName: 'BrokenOrchestrator',
      namespace: 'Broken',
    };
    const out = specToVerify(broken);
    expect(out.status).toBe('ok');

    // 生成物の定理を偽にしたものを直接 Lean にかける。
    const good = generateLeanSpec(broken);
    const falsified = {
      ...good,
      source: good.source.replace('⟨.BeginCompleted, rfl⟩', '⟨.QueryExecuted, rfl⟩'),
    };
    const result = verifyLeanSpec([falsified]);
    expect(result.status).toBe('verification-failed');
    expect(result.diagnostics).toContain('error');
  });
});
