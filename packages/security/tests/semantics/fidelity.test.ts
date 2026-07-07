import { describe, expect, it } from 'vitest';
import {
  collectAdvFidelityCoverage,
  providerAdvEventName,
  SECURITY_ADV_AXIS_TO_EVENTS,
  SECURITY_ADV_FIDELITY_GRID,
  type SecurityAdvAxis,
  type SecurityAdvTarget,
} from '../../src/semantics/index.js';

describe('SECURITY_ADV_FIDELITY_GRID', () => {
  it('exposes 32 combinations (4 provider x 8 axis)', () => {
    expect(SECURITY_ADV_FIDELITY_GRID).toHaveLength(32);
  });

  it('each provider appears exactly 8 times', () => {
    const counts = new Map<SecurityAdvTarget, number>();
    for (const cell of SECURITY_ADV_FIDELITY_GRID) {
      counts.set(cell.provider, (counts.get(cell.provider) ?? 0) + 1);
    }
    for (const [, count] of counts) {
      expect(count).toBe(8);
    }
  });

  it('each axis appears exactly 4 times', () => {
    const counts = new Map<SecurityAdvAxis, number>();
    for (const cell of SECURITY_ADV_FIDELITY_GRID) {
      counts.set(cell.axis, (counts.get(cell.axis) ?? 0) + 1);
    }
    for (const [, count] of counts) {
      expect(count).toBe(4);
    }
  });

  it('covers all 4 provider targets', () => {
    const providers = new Set(SECURITY_ADV_FIDELITY_GRID.map((c) => c.provider));
    expect(providers).toEqual(new Set(['istio', 'opa', 'siem-splunk', 'vault']));
  });

  it('covers all 8 advanced axes', () => {
    const axes = new Set(SECURITY_ADV_FIDELITY_GRID.map((c) => c.axis));
    expect(axes.size).toBe(8);
    expect(axes).toEqual(
      new Set([
        'mtls',
        'zero-trust',
        'siem-audit',
        'incident-response',
        'crypto-advanced',
        'container-k8s',
        'supply-chain',
        'web-vitals-security',
      ]),
    );
  });
});

describe('SECURITY_ADV_AXIS_TO_EVENTS', () => {
  it('maps 8 axes each to their neutral events', () => {
    expect(Object.keys(SECURITY_ADV_AXIS_TO_EVENTS)).toHaveLength(8);
    for (const events of Object.values(SECURITY_ADV_AXIS_TO_EVENTS)) {
      expect(events.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('mtls has 4 events', () => {
    expect(SECURITY_ADV_AXIS_TO_EVENTS.mtls).toHaveLength(4);
  });

  it('incident-response has 5 events', () => {
    expect(SECURITY_ADV_AXIS_TO_EVENTS['incident-response']).toHaveLength(5);
  });

  it('crypto-advanced has 6 events', () => {
    expect(SECURITY_ADV_AXIS_TO_EVENTS['crypto-advanced']).toHaveLength(6);
  });

  it('container-k8s has 4 events (2 admission verdicts)', () => {
    expect(SECURITY_ADV_AXIS_TO_EVENTS['container-k8s']).toHaveLength(4);
  });
});

describe('collectAdvFidelityCoverage', () => {
  it('produces 32 rows by default', () => {
    const cov = collectAdvFidelityCoverage();
    expect(cov.rows).toHaveLength(32);
  });

  it('rows have neutralEvents and providerEvents aligned by length', () => {
    const cov = collectAdvFidelityCoverage();
    for (const row of cov.rows) {
      expect(row.neutralEvents.length).toBe(row.providerEvents.length);
    }
  });

  it('providerEvent starts with target prefix', () => {
    const cov = collectAdvFidelityCoverage();
    for (const row of cov.rows) {
      const prefix = row.provider === 'siem-splunk' ? 'splunk' : row.provider;
      for (const event of row.providerEvents) {
        expect(event.startsWith(`${prefix}.`)).toBe(true);
      }
    }
  });

  it('supports custom provider subset', () => {
    const cov = collectAdvFidelityCoverage(['istio']);
    expect(cov.providers).toEqual(['istio']);
    expect(cov.rows).toHaveLength(8);
  });
});

describe('providerAdvEventName', () => {
  it('translates mtls handshake to istio dialect', () => {
    expect(providerAdvEventName('istio', 'mtls.handshake_completed')).toBe(
      'istio.mtls.handshake',
    );
  });

  it('translates crypto pq to vault dialect', () => {
    expect(providerAdvEventName('vault', 'crypto.pq_kem_encapsulated')).toBe(
      'vault.crypto.pq',
    );
  });

  it('translates siem structured to splunk dialect', () => {
    expect(providerAdvEventName('siem-splunk', 'siem.event_structured')).toBe(
      'splunk.siem.structured',
    );
  });

  it('translates admission denied to opa dialect', () => {
    expect(providerAdvEventName('opa', 'k8s.admission_denied')).toBe('opa.k8s.deny');
  });

  it('every neutral event has translation for every provider', () => {
    const allEvents = new Set<string>();
    for (const events of Object.values(SECURITY_ADV_AXIS_TO_EVENTS)) {
      for (const event of events) {
        allEvents.add(event);
      }
    }
    for (const provider of ['istio', 'opa', 'siem-splunk', 'vault'] as const) {
      for (const event of allEvents) {
        const translated = providerAdvEventName(
          provider,
          event as Parameters<typeof providerAdvEventName>[1],
        );
        expect(translated).not.toBe(event);
      }
    }
  });
});
