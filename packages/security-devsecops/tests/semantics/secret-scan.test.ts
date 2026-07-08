import { describe, expect, it } from 'vitest';
import {
  allowlistSecret,
  completeSecretScan,
  flagSecretEntropy,
  matchSecretPattern,
  startSecretScan,
} from '../../src/index.js';

describe('secret-scan axis', () => {
  it('startSecretScan initializes with gitleaks', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    expect(s.provider).toBe('gitleaks');
  });

  it('matchSecretPattern records match + transitions', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    const step = matchSecretPattern(s, {
      ruleId: 'aws-access-key',
      filePath: 'config.ts',
      line: 5,
      redactedValue: 'AKIA****',
      severity: 'critical',
    });
    expect(step.state).toBe('secrets-found');
    expect(s.matches).toHaveLength(1);
    expect(s.matches[0]!.matchType).toBe('pattern');
  });

  it('flagSecretEntropy classifies severity by score', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    const highStep = flagSecretEntropy(s, {
      filePath: 'x',
      line: 1,
      entropyScore: 5.0,
      redactedValue: 'x***',
    });
    const mediumStep = flagSecretEntropy(s, {
      filePath: 'y',
      line: 2,
      entropyScore: 3.5,
      redactedValue: 'y***',
    });
    expect(highStep.metadata.entropyScore).toBe(5.0);
    expect(s.matches[0]!.severity).toBe('high');
    expect(s.matches[1]!.severity).toBe('medium');
    expect(mediumStep.metadata.entropyScore).toBe(3.5);
  });

  it('allowlistSecret adds to allowlist', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    allowlistSecret(s, { ruleId: 'test-fixture', reason: 'test file' });
    expect(s.allowlisted.has('test-fixture')).toBe(true);
  });

  it('completeSecretScan counts active vs allowlisted', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    matchSecretPattern(s, {
      ruleId: 'A',
      filePath: 'a',
      line: 1,
      redactedValue: 'x',
      severity: 'high',
    });
    matchSecretPattern(s, {
      ruleId: 'B',
      filePath: 'b',
      line: 2,
      redactedValue: 'x',
      severity: 'high',
    });
    allowlistSecret(s, { ruleId: 'A', reason: 'x' });
    const step = completeSecretScan(s);
    expect(step.metadata.totalMatches).toBe(2);
    expect(step.metadata.activeCount).toBe(1);
  });

  it('history accumulates in order', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    matchSecretPattern(s, {
      ruleId: 'A',
      filePath: 'x',
      line: 1,
      redactedValue: 'x',
      severity: 'critical',
    });
    flagSecretEntropy(s, {
      filePath: 'y',
      line: 2,
      entropyScore: 4.8,
      redactedValue: 'y',
    });
    allowlistSecret(s, { ruleId: 'A', reason: 'x' });
    completeSecretScan(s);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'secret.pattern-matched',
      'secret.pattern-matched',
      'secret.entropy-flagged',
      'secret.allowlisted',
      'secret.scan-completed',
    ]);
  });

  it('entropy match ruleId is "entropy"', () => {
    const s = startSecretScan({ scanId: 's-1', target: '.' });
    flagSecretEntropy(s, {
      filePath: 'x',
      line: 1,
      entropyScore: 4.7,
      redactedValue: 'y',
    });
    expect(s.matches[0]!.ruleId).toBe('entropy');
  });
});
