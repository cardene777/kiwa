import { describe, expect, it } from 'vitest';
import {
  captureNetworkFlow,
  probeUserspace,
  recordSyscall,
  startEbpfIiiSession,
  traceKernel,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('ebpf-iii axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'host-1' });
    probeUserspace(s, {
      probes: [
        { kind: 'uprobe', symbol: 'malloc' },
        { kind: 'uprobe', symbol: 'free' },
      ],
    });
    traceKernel(s, {
      probes: [
        { kind: 'kprobe', symbol: 'sys_read' },
        { kind: 'tracepoint', symbol: 'sched_switch' },
        { kind: 'lsm', symbol: 'inode_permission' },
      ],
    });
    recordSyscall(s, { counts: { read: 1000, write: 500, open: 200 } });
    captureNetworkFlow(s, {
      flows: [
        { srcIp: '10.0.0.1', dstIp: '10.0.0.2', bytes: 4096, packets: 4 },
      ],
    });
    expect(s.state).toBe('network-flow-captured');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'ebpf.userspace_probed',
      'ebpf.kernel_traced',
      'ebpf.syscall_recorded',
      'ebpf.network_flow_captured',
    ]);
  });

  it('probeUserspace counts probes', () => {
    const s = startEbpfIiiSession({ target: 'grafana-oss', hostId: 'h' });
    const step = probeUserspace(s, {
      probes: [
        { kind: 'uprobe', symbol: 'a' },
        { kind: 'uprobe', symbol: 'b' },
      ],
    });
    expect(step.metadata.probeCount).toBe(2);
    expect(step.metadata.symbols).toBe('a,b');
  });

  it('traceKernel counts kprobe/tracepoint/lsm categories', () => {
    const s = startEbpfIiiSession({ target: 'loki', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    const step = traceKernel(s, {
      probes: [
        { kind: 'kprobe', symbol: 'a' },
        { kind: 'kprobe', symbol: 'b' },
        { kind: 'tracepoint', symbol: 'c' },
        { kind: 'lsm', symbol: 'd' },
      ],
    });
    expect(step.metadata.kprobeCount).toBe(2);
    expect(step.metadata.tracepointCount).toBe(1);
    expect(step.metadata.lsmCount).toBe(1);
  });

  it('recordSyscall sums call totals', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    const step = recordSyscall(s, { counts: { read: 100, write: 200, open: 300 } });
    expect(step.metadata.syscallCount).toBe(3);
    expect(step.metadata.totalCalls).toBe(600);
  });

  it('captureNetworkFlow sums bytes and packets', () => {
    const s = startEbpfIiiSession({ target: 'otel-collector', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    recordSyscall(s, { counts: { read: 1 } });
    const step = captureNetworkFlow(s, {
      flows: [
        { srcIp: '10.0.0.1', dstIp: '10.0.0.2', bytes: 1000, packets: 10 },
        { srcIp: '10.0.0.3', dstIp: '10.0.0.4', bytes: 2000, packets: 20 },
      ],
    });
    expect(step.metadata.totalBytes).toBe(3000);
    expect(step.metadata.totalPackets).toBe(30);
    expect(step.metadata.flowCount).toBe(2);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startEbpfIiiSession({ target, hostId: 'h' });
    const step = probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('ebpf-iii axis — invariant guards', () => {
  it('rejects empty hostId', () => {
    expect(() => startEbpfIiiSession({ target: 'prometheus', hostId: '' })).toThrow(/hostId/);
  });

  it('rejects probeUserspace with wrong kind', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    expect(() => probeUserspace(s, { probes: [{ kind: 'kprobe', symbol: 'x' }] })).toThrow(
      /expected uprobe/,
    );
  });

  it('rejects empty probes', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    expect(() => probeUserspace(s, { probes: [] })).toThrow(/must not be empty/);
  });

  it('rejects traceKernel with uprobe', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    expect(() => traceKernel(s, { probes: [{ kind: 'uprobe', symbol: 'y' }] })).toThrow(
      /expected kprobe/,
    );
  });

  it('rejects recordSyscall with negative count', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    expect(() => recordSyscall(s, { counts: { read: -1 } })).toThrow(/non-negative/);
  });

  it('rejects recordSyscall with empty counts', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    expect(() => recordSyscall(s, { counts: {} })).toThrow(/must not be empty/);
  });

  it('rejects captureNetworkFlow with negative bytes', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    recordSyscall(s, { counts: { r: 1 } });
    expect(() =>
      captureNetworkFlow(s, {
        flows: [{ srcIp: 'a', dstIp: 'b', bytes: -1, packets: 0 }],
      }),
    ).toThrow(/non-negative/);
  });

  it('rejects traceKernel before probeUserspace', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    expect(() => traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'x' }] })).toThrow(
      /not userspace-probed/,
    );
  });

  it('rejects captureNetworkFlow before recordSyscall', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    expect(() =>
      captureNetworkFlow(s, { flows: [{ srcIp: 'a', dstIp: 'b', bytes: 0, packets: 0 }] }),
    ).toThrow(/not syscall-recorded/);
  });
});
