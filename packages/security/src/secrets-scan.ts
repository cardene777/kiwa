/**
 * Axis 6 — Secrets scanning engine。
 *
 * 3 sub-axis ...
 * - TruffleHog signature (代表的 40+ signature を pattern set で SSOT 化、
 *   Github / AWS / Slack / OpenAI / Stripe 等)
 * - Gitleaks style rule (regex + entropy check の 2 段判定)
 * - rotation policy (secret 発見時の rotation SLA + tracking)
 */

import type { SecurityEvent } from './types.js';

export type SecretKind =
  | 'aws-access-key'
  | 'aws-secret-key'
  | 'github-token'
  | 'slack-token'
  | 'openai-key'
  | 'stripe-key'
  | 'generic-jwt'
  | 'generic-private-key';

export interface SecretSignature {
  kind: SecretKind;
  pattern: RegExp;
  minEntropy?: number;
  description: string;
}

/**
 * TruffleHog + Gitleaks 由来の代表 signature を SSOT 化。
 * 実 signature 全網羅は upstream に譲り、 kiwa fixture test で
 * よく参照される 8 kind に絞る。
 */
export const DEFAULT_SIGNATURES: SecretSignature[] = [
  {
    kind: 'aws-access-key',
    pattern: /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,
    description: 'AWS access key id (AKIA / ASIA prefix + 16 alphanumeric)',
  },
  {
    kind: 'aws-secret-key',
    // AWS secret keys are 40 chars from the base64 alphabet — the alphabet is
    // stable so we don't need entropy to catch them here; the entropy check
    // stays as a defense-in-depth for the many false-positive corpora.
    pattern: /\b[A-Za-z0-9/+]{40}\b/,
    minEntropy: 3.5,
    description: 'AWS secret access key (40 chars base64 alphabet)',
  },
  {
    kind: 'github-token',
    pattern: /\bghp_[A-Za-z0-9]{36}\b/,
    description: 'GitHub personal access token (ghp_ prefix)',
  },
  {
    kind: 'slack-token',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    description: 'Slack API token (xox[baprs]- prefix)',
  },
  {
    kind: 'openai-key',
    pattern: /\bsk-[A-Za-z0-9]{20,}\b/,
    description: 'OpenAI API key (sk- prefix)',
  },
  {
    kind: 'stripe-key',
    pattern: /\b(sk|pk)_(test|live)_[A-Za-z0-9]{16,}\b/,
    description: 'Stripe secret / publishable key',
  },
  {
    kind: 'generic-jwt',
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    description: 'JWT (3-segment base64url)',
  },
  {
    kind: 'generic-private-key',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    description: 'PEM-encoded private key header',
  },
];

export interface SecretFinding {
  kind: SecretKind;
  matched: string;
  line: number;
  column: number;
  entropy: number;
  ruleDescription: string;
}

/**
 * Shannon entropy of a string over its own byte histogram. Values >= 3.5
 * are typical for random secrets over base64/hex alphabets; anything
 * closer to natural language sits well below.
 */
export function shannonEntropy(input: string): number {
  if (input.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const ch of input) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  let entropy = 0;
  const len = input.length;
  for (const count of counts.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function scanSecrets(
  source: string,
  signatures: SecretSignature[] = DEFAULT_SIGNATURES,
): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = source.split(/\r?\n/);
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx += 1) {
    const line = lines[lineIdx] ?? '';
    for (const sig of signatures) {
      // Use a fresh regex so we can iterate all matches on the line.
      const global = new RegExp(sig.pattern.source, sig.pattern.flags.replace('g', '') + 'g');
      let match: RegExpExecArray | null;
      while ((match = global.exec(line)) !== null) {
        const captured = match[0];
        const entropy = shannonEntropy(captured);
        if (sig.minEntropy !== undefined && entropy < sig.minEntropy) continue;
        findings.push({
          kind: sig.kind,
          matched: captured,
          line: lineIdx + 1,
          column: match.index + 1,
          entropy,
          ruleDescription: sig.description,
        });
      }
    }
  }
  return findings;
}

/** Rotation policy — secret 発見時の rotation SLA + tracking。 */
export interface RotationPolicy {
  /** 発見から X 日以内に rotation 必須。 */
  rotateWithinDays: number;
  /** 対象 kind (未指定 = 全 kind)。 */
  appliesTo?: SecretKind[];
}

export interface RotationTracker {
  finding: SecretFinding;
  discoveredAtMs: number;
  rotatedAtMs: number | null;
  policy: RotationPolicy;
}

export function isRotationOverdue(tracker: RotationTracker, nowMs: number = Date.now()): boolean {
  if (tracker.rotatedAtMs !== null) return false;
  const dayMs = 24 * 60 * 60 * 1000;
  const deadlineMs = tracker.discoveredAtMs + tracker.policy.rotateWithinDays * dayMs;
  return nowMs > deadlineMs;
}

export function markRotated(tracker: RotationTracker, atMs: number = Date.now()): RotationTracker {
  return { ...tracker, rotatedAtMs: atMs };
}

export function toSecretsEvent(input: {
  provider: 'helmet' | 'coraza';
  finding: SecretFinding;
  timestamp: number;
}): SecurityEvent {
  return {
    axis: 'secrets-scan',
    provider: input.provider,
    verdict: 'deny',
    reason: `secrets-scan: ${input.finding.kind} at line ${input.finding.line}`,
    payload: {
      kind: input.finding.kind,
      line: input.finding.line,
      column: input.finding.column,
      entropy: input.finding.entropy,
    },
    timestamp: input.timestamp,
  };
}
