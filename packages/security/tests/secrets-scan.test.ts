import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SIGNATURES,
  isRotationOverdue,
  markRotated,
  scanSecrets,
  shannonEntropy,
  toSecretsEvent,
} from '../src/index.js';
import type { SecretFinding } from '../src/index.js';

describe('Secrets scan — shannonEntropy', () => {
  it('T-SEC-SS-001 returns 0 for an empty string', () => {
    expect(shannonEntropy('')).toBe(0);
  });

  it('T-SEC-SS-002 returns 0 for a single repeating character', () => {
    expect(shannonEntropy('aaaaaaaa')).toBe(0);
  });

  it('T-SEC-SS-003 gives high entropy to random-looking strings', () => {
    // Random-ish base64 alphabet.
    expect(shannonEntropy('kQ7hj29aVn3XmPq0Zc4B')).toBeGreaterThan(3.5);
  });

  it('T-SEC-SS-004 gives low entropy to natural language', () => {
    expect(shannonEntropy('the quick brown fox')).toBeLessThan(4);
  });
});

describe('Secrets scan — scanSecrets (signatures)', () => {
  it('T-SEC-SS-005 detects an AWS access key', () => {
    const findings = scanSecrets('AKIAIOSFODNN7EXAMPLE inside a file');
    expect(findings.some((f) => f.kind === 'aws-access-key')).toBe(true);
  });

  it('T-SEC-SS-006 detects a GitHub personal access token', () => {
    const findings = scanSecrets('token = "ghp_abcdefghijklmnopqrstuvwxyz0123456789"');
    expect(findings.some((f) => f.kind === 'github-token')).toBe(true);
  });

  it('T-SEC-SS-007 detects a Slack bot token', () => {
    const findings = scanSecrets('SLACK=xoxb-1234567890-abcdefghij');
    expect(findings.some((f) => f.kind === 'slack-token')).toBe(true);
  });

  it('T-SEC-SS-008 detects an OpenAI-style key', () => {
    const findings = scanSecrets('OPENAI_KEY=sk-abcdefghij0123456789xyz');
    expect(findings.some((f) => f.kind === 'openai-key')).toBe(true);
  });

  it('T-SEC-SS-009 detects a Stripe live key', () => {
    const findings = scanSecrets('STRIPE=sk_live_abcdefghij0123456789');
    expect(findings.some((f) => f.kind === 'stripe-key')).toBe(true);
  });

  it('T-SEC-SS-010 detects a JWT', () => {
    // 3-segment base64url token.
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhIn0.abcdef';
    const findings = scanSecrets(jwt);
    expect(findings.some((f) => f.kind === 'generic-jwt')).toBe(true);
  });

  it('T-SEC-SS-011 detects a PEM private key header', () => {
    const findings = scanSecrets('-----BEGIN RSA PRIVATE KEY-----\nMIIExample\n-----END RSA PRIVATE KEY-----');
    expect(findings.some((f) => f.kind === 'generic-private-key')).toBe(true);
  });

  it('T-SEC-SS-012 returns line + column positions', () => {
    const findings = scanSecrets('normal line\nsecret ghp_abcdefghijklmnopqrstuvwxyz0123456789 here');
    const gh = findings.find((f) => f.kind === 'github-token');
    expect(gh?.line).toBe(2);
    expect(gh?.column).toBeGreaterThan(0);
  });

  it('T-SEC-SS-013 filters low entropy strings for aws-secret-key signature', () => {
    // 40 chars of the same character — matches shape but entropy < 3.5.
    const findings = scanSecrets('key = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"');
    expect(findings.some((f) => f.kind === 'aws-secret-key')).toBe(false);
  });

  it('T-SEC-SS-014 finds multiple secrets in one source', () => {
    const source = `
      AWS=AKIAIOSFODNN7EXAMPLE
      GH=ghp_abcdefghijklmnopqrstuvwxyz0123456789
    `;
    const findings = scanSecrets(source);
    expect(findings.length).toBeGreaterThanOrEqual(2);
  });

  it('T-SEC-SS-015 respects a custom signature list', () => {
    const custom = [
      {
        kind: 'aws-access-key' as const,
        pattern: /CUSTOM_[A-Z0-9]{10}/,
        description: 'custom',
      },
    ];
    const findings = scanSecrets('X = CUSTOM_ABCDEFGHIJ', custom);
    expect(findings).toHaveLength(1);
  });

  it('T-SEC-SS-016 returns no findings for a clean input', () => {
    const findings = scanSecrets('hello world, nothing to see here');
    expect(findings).toEqual([]);
  });

  it('T-SEC-SS-017 DEFAULT_SIGNATURES covers 8 kinds', () => {
    expect(DEFAULT_SIGNATURES.length).toBeGreaterThanOrEqual(8);
  });
});

describe('Secrets scan — rotation policy', () => {
  const finding: SecretFinding = {
    kind: 'github-token',
    matched: 'x',
    line: 1,
    column: 1,
    entropy: 5,
    ruleDescription: 'gh',
  };

  it('T-SEC-SS-018 isRotationOverdue false immediately after discovery', () => {
    const tracker = {
      finding,
      discoveredAtMs: 1000,
      rotatedAtMs: null,
      policy: { rotateWithinDays: 7 },
    };
    expect(isRotationOverdue(tracker, 1001)).toBe(false);
  });

  it('T-SEC-SS-019 isRotationOverdue true after policy window', () => {
    const tracker = {
      finding,
      discoveredAtMs: 0,
      rotatedAtMs: null,
      policy: { rotateWithinDays: 1 },
    };
    const nowMs = 2 * 24 * 60 * 60 * 1000;
    expect(isRotationOverdue(tracker, nowMs)).toBe(true);
  });

  it('T-SEC-SS-020 isRotationOverdue false once rotated', () => {
    const tracker = {
      finding,
      discoveredAtMs: 0,
      rotatedAtMs: 100,
      policy: { rotateWithinDays: 1 },
    };
    const nowMs = 30 * 24 * 60 * 60 * 1000;
    expect(isRotationOverdue(tracker, nowMs)).toBe(false);
  });

  it('T-SEC-SS-021 markRotated sets rotatedAtMs', () => {
    const before = {
      finding,
      discoveredAtMs: 0,
      rotatedAtMs: null,
      policy: { rotateWithinDays: 7 },
    };
    const after = markRotated(before, 42);
    expect(after.rotatedAtMs).toBe(42);
  });
});

describe('Secrets scan — toSecretsEvent', () => {
  it('T-SEC-SS-022 emits a deny event with kind + location payload', () => {
    const ev = toSecretsEvent({
      provider: 'helmet',
      finding: {
        kind: 'aws-access-key',
        matched: 'x',
        line: 5,
        column: 10,
        entropy: 4,
        ruleDescription: 'aws',
      },
      timestamp: 100,
    });
    expect(ev.axis).toBe('secrets-scan');
    expect(ev.verdict).toBe('deny');
    expect(ev.reason).toContain('aws-access-key');
  });
});
