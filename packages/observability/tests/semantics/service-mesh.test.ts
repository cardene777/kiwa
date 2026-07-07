import { describe, expect, it } from 'vitest';
import {
  applyTrafficSplit,
  handshakeMtls,
  injectSidecar,
  startMeshSession,
  tripCircuitBreaker,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('service-mesh axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'prod-mesh' });
    handshakeMtls(s, {
      clientSpiffe: 'spiffe://cluster/ns/default/sa/web',
      serverSpiffe: 'spiffe://cluster/ns/default/sa/api',
      cipherSuite: 'TLS_AES_128_GCM_SHA256',
    });
    injectSidecar(s, {
      injections: [
        { pod: 'web-1', namespace: 'default', proxy: 'envoy' },
        { pod: 'web-2', namespace: 'default', proxy: 'envoy' },
      ],
    });
    tripCircuitBreaker(s, { failures: 40, total: 100, failureThreshold: 0.3 });
    applyTrafficSplit(s, {
      splits: [
        { service: 'api-v1', weight: 80 },
        { service: 'api-v2', weight: 20 },
      ],
    });
    expect(s.state).toBe('traffic-split-applied');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'mesh.mtls_handshaked',
      'mesh.sidecar_injected',
      'mesh.circuit_breaker_tripped',
      'mesh.traffic_split_applied',
    ]);
  });

  it('handshakeMtls stores SPIFFE IDs', () => {
    const s = startMeshSession({ target: 'grafana-oss', meshName: 'x' });
    const step = handshakeMtls(s, {
      clientSpiffe: 'spiffe://ex/a',
      serverSpiffe: 'spiffe://ex/b',
      cipherSuite: 'TLS_CHACHA20_POLY1305_SHA256',
    });
    expect(step.metadata.client).toBe('spiffe://ex/a');
    expect(step.metadata.server).toBe('spiffe://ex/b');
    expect(step.metadata.cipherSuite).toBe('TLS_CHACHA20_POLY1305_SHA256');
  });

  it('injectSidecar counts envoy vs linkerd2-proxy', () => {
    const s = startMeshSession({ target: 'loki', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    const step = injectSidecar(s, {
      injections: [
        { pod: 'a', namespace: 'ns', proxy: 'envoy' },
        { pod: 'b', namespace: 'ns', proxy: 'envoy' },
        { pod: 'c', namespace: 'ns', proxy: 'linkerd2-proxy' },
      ],
    });
    expect(step.metadata.envoyCount).toBe(2);
    expect(step.metadata.linkerdCount).toBe(1);
    expect(step.metadata.sidecarCount).toBe(3);
  });

  it('tripCircuitBreaker trips above threshold', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    const step = tripCircuitBreaker(s, { failures: 50, total: 100, failureThreshold: 0.4 });
    expect(step.metadata.tripped).toBe(true);
    expect(step.metadata.failureRate).toBe(0.5);
    expect(s.circuitBreakerOpen).toBe(true);
  });

  it('tripCircuitBreaker does not trip below threshold', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    const step = tripCircuitBreaker(s, { failures: 5, total: 100, failureThreshold: 0.5 });
    expect(step.metadata.tripped).toBe(false);
    expect(s.circuitBreakerOpen).toBe(false);
  });

  it('applyTrafficSplit stores weights when sum is 100', () => {
    const s = startMeshSession({ target: 'grafana-oss', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    tripCircuitBreaker(s, { failures: 0, total: 100, failureThreshold: 0.5 });
    const step = applyTrafficSplit(s, {
      splits: [
        { service: 'v1', weight: 30 },
        { service: 'v2', weight: 30 },
        { service: 'v3', weight: 40 },
      ],
    });
    expect(step.metadata.serviceCount).toBe(3);
    expect(step.metadata.totalWeight).toBe(100);
    expect(s.trafficSplits).toHaveLength(3);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startMeshSession({ target, meshName: 'x' });
    const step = handshakeMtls(s, {
      clientSpiffe: 'spiffe://x/a',
      serverSpiffe: 'spiffe://x/b',
      cipherSuite: 'c',
    });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('service-mesh axis — invariant guards', () => {
  it('rejects empty meshName', () => {
    expect(() => startMeshSession({ target: 'prometheus', meshName: '' })).toThrow(/meshName/);
  });

  it('rejects non-spiffe client URI', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() =>
      handshakeMtls(s, { clientSpiffe: 'http://foo', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' }),
    ).toThrow(/spiffe:\/\//);
  });

  it('rejects non-spiffe server URI', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() =>
      handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'not-a-uri', cipherSuite: 'c' }),
    ).toThrow(/spiffe:\/\//);
  });

  it('rejects injectSidecar before handshake', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() =>
      injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] }),
    ).toThrow(/not mtls-handshaked/);
  });

  it('rejects injectSidecar with empty injections', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    expect(() => injectSidecar(s, { injections: [] })).toThrow(/must not be empty/);
  });

  it('rejects tripCircuitBreaker with zero total', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    expect(() => tripCircuitBreaker(s, { failures: 0, total: 0, failureThreshold: 0.5 })).toThrow(
      /positive/,
    );
  });

  it('rejects tripCircuitBreaker with failures > total', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    expect(() => tripCircuitBreaker(s, { failures: 200, total: 100, failureThreshold: 0.5 })).toThrow(
      /within/,
    );
  });

  it('rejects applyTrafficSplit before circuit breaker', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() => applyTrafficSplit(s, { splits: [{ service: 'a', weight: 100 }] })).toThrow(
      /not circuit-breaker-tripped/,
    );
  });

  it('rejects traffic splits that do not sum to 100', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    tripCircuitBreaker(s, { failures: 0, total: 100, failureThreshold: 0.5 });
    expect(() =>
      applyTrafficSplit(s, {
        splits: [
          { service: 'a', weight: 60 },
          { service: 'b', weight: 20 },
        ],
      }),
    ).toThrow(/sum to 100/);
  });

  it('rejects individual weight > 100', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, { clientSpiffe: 'spiffe://x/a', serverSpiffe: 'spiffe://x/b', cipherSuite: 'c' });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    tripCircuitBreaker(s, { failures: 0, total: 100, failureThreshold: 0.5 });
    expect(() =>
      applyTrafficSplit(s, {
        splits: [
          { service: 'a', weight: 150 },
          { service: 'b', weight: -50 },
        ],
      }),
    ).toThrow();
  });
});
