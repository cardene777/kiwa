/**
 * Tamper-evident audit log — every RLS event (policy install / tenant
 * filter / bypass / audit) that the gate emits is captured here with a
 * running SHA-256 chain so post-hoc replay can detect insertions or
 * deletions. Production Nuxt 3 `server/api/audit-log.get.ts` reads this
 * chain and rejects any request whose caller lacks a support role.
 *
 * The chain hash is computed as
 *   `sha256(prevChainHash || eventJson)`
 * so any middle-inserted entry breaks every hash after it. The mock uses
 * a deterministic, single-purpose hash so tests can assert exact values.
 */

import type { RlsAuditEntry, RlsSession } from '@kiwa-lab/orm';

export interface AuditRecord {
  readonly seq: number;
  readonly tenantId: string;
  readonly operation: 'read' | 'write';
  readonly allowed: boolean;
  readonly reason: string;
  readonly chainHash: string;
}

export interface AuditLog {
  readonly append: (entry: RlsAuditEntry) => AuditRecord;
  readonly snapshot: () => readonly AuditRecord[];
  readonly verify: () => { ok: boolean; brokenAt: number };
  readonly size: () => number;
  readonly reset: () => void;
}

const CHAIN_SEED = 'kiwa-rls-audit-v1';

/**
 * Deterministic 32-hex-char hash suitable for a single-purpose audit
 * chain. Uses a folded FNV-1a mix over the input so tests can compute the
 * expected chain hash without depending on a native crypto binding. This
 * is not cryptographic strength — production would swap it for a real
 * HMAC — but it satisfies the tamper-evident invariant that any middle
 * insertion changes every downstream hash.
 */
function chainHash(prev: string, seq: number, entry: RlsAuditEntry): string {
  const payload = JSON.stringify({
    prev,
    seq,
    tenantId: entry.tenantId,
    operation: entry.operation,
    allowed: entry.allowed,
    reason: entry.reason,
  });
  let a = 0x811c9dc5;
  let b = 0x9e3779b9;
  for (let i = 0; i < payload.length; i += 1) {
    const c = payload.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = ((b + c) * 0x85ebca6b) >>> 0;
  }
  return (
    a.toString(16).padStart(8, '0') +
    b.toString(16).padStart(8, '0') +
    (a ^ b).toString(16).padStart(8, '0') +
    ((a + b) >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Build a tamper-evident audit log. `append` appends 1 record; `verify`
 * replays the chain from the seed and reports the first index whose
 * stored hash disagrees with the recomputed hash. `brokenAt = -1` when
 * the chain is intact.
 */
export function createAuditLog(): AuditLog {
  const records: AuditRecord[] = [];
  let prev = CHAIN_SEED;
  return {
    append(entry: RlsAuditEntry): AuditRecord {
      const seq = records.length + 1;
      const hash = chainHash(prev, seq, entry);
      const record: AuditRecord = {
        seq,
        tenantId: entry.tenantId,
        operation: entry.operation,
        allowed: entry.allowed,
        reason: entry.reason,
        chainHash: hash,
      };
      records.push(record);
      prev = hash;
      return record;
    },
    snapshot(): readonly AuditRecord[] {
      return [...records];
    },
    verify(): { ok: boolean; brokenAt: number } {
      let replay = CHAIN_SEED;
      for (let i = 0; i < records.length; i += 1) {
        const rec = records[i]!;
        const expected = chainHash(replay, rec.seq, {
          tenantId: rec.tenantId,
          operation: rec.operation,
          allowed: rec.allowed,
          reason: rec.reason,
        });
        if (expected !== rec.chainHash) {
          return { ok: false, brokenAt: i };
        }
        replay = expected;
      }
      return { ok: true, brokenAt: -1 };
    },
    size(): number {
      return records.length;
    },
    reset(): void {
      records.length = 0;
      prev = CHAIN_SEED;
    },
  };
}

/**
 * Drain an RLS session's audit log into the tamper-evident chain. Called
 * once per gate op so the audit trail always mirrors the underlying
 * neutral RLS events emitted by `@kiwa-lab/orm`'s RLS semantics.
 */
export function drainSessionAudit(session: RlsSession, log: AuditLog): number {
  let drained = 0;
  while (session.auditLog.length > 0) {
    const entry = session.auditLog.shift();
    if (!entry) break;
    log.append(entry);
    drained += 1;
  }
  return drained;
}
