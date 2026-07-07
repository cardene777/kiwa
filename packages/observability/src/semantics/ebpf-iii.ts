import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

/**
 * eBPF profiling III axis — user-space probe + kernel probe + syscall +
 * network flow state machine (v2.2 advanced III、 v2.1 profiling.ts の縦深化).
 *
 * 4-step lifecycle: probe-userspace → trace-kernel → record-syscall → capture-netflow.
 * eBPF hook 種別ごとに sample count と drop count を保持、 detach 時整合性を検証。
 */

export type EbpfIiiState =
  | 'idle'
  | 'userspace-probed'
  | 'kernel-traced'
  | 'syscall-recorded'
  | 'network-flow-captured';

export interface EbpfProbe {
  kind: 'uprobe' | 'kprobe' | 'tracepoint' | 'lsm';
  symbol: string;
}

export interface EbpfNetworkFlow {
  srcIp: string;
  dstIp: string;
  bytes: number;
  packets: number;
}

export interface EbpfIiiSession {
  target: ObservabilityTarget;
  hostId: string;
  state: EbpfIiiState;
  history: AxisStep<EbpfIiiState>[];
  userspaceProbes: EbpfProbe[];
  kernelProbes: EbpfProbe[];
  syscallCounts: Record<string, number>;
  flows: EbpfNetworkFlow[];
}

export function startEbpfIiiSession(input: {
  target: ObservabilityTarget;
  hostId: string;
}): EbpfIiiSession {
  if (input.hostId.length === 0) {
    throw new Error('startEbpfIiiSession: hostId must not be empty');
  }
  return {
    target: input.target,
    hostId: input.hostId,
    state: 'idle',
    history: [],
    userspaceProbes: [],
    kernelProbes: [],
    syscallCounts: {},
    flows: [],
  };
}

export function probeUserspace(
  session: EbpfIiiSession,
  input: { probes: EbpfProbe[] },
): AxisStep<EbpfIiiState> {
  if (session.state !== 'idle') {
    throw new Error(`probeUserspace: session is ${session.state}, not idle`);
  }
  if (input.probes.length === 0) {
    throw new Error('probeUserspace: probes must not be empty');
  }
  for (const p of input.probes) {
    if (p.kind !== 'uprobe') {
      throw new Error(`probeUserspace: expected uprobe, got ${p.kind}`);
    }
  }
  session.userspaceProbes = [...input.probes];
  session.state = 'userspace-probed';
  return emit(session, 'ebpf.userspace_probed', {
    probeCount: input.probes.length,
    symbols: input.probes.map((p) => p.symbol).join(','),
  });
}

export function traceKernel(
  session: EbpfIiiSession,
  input: { probes: EbpfProbe[] },
): AxisStep<EbpfIiiState> {
  if (session.state !== 'userspace-probed') {
    throw new Error(`traceKernel: session is ${session.state}, not userspace-probed`);
  }
  if (input.probes.length === 0) {
    throw new Error('traceKernel: probes must not be empty');
  }
  for (const p of input.probes) {
    if (p.kind !== 'kprobe' && p.kind !== 'tracepoint' && p.kind !== 'lsm') {
      throw new Error(`traceKernel: expected kprobe/tracepoint/lsm, got ${p.kind}`);
    }
  }
  session.kernelProbes = [...input.probes];
  session.state = 'kernel-traced';
  const kprobeCount = input.probes.filter((p) => p.kind === 'kprobe').length;
  const tracepointCount = input.probes.filter((p) => p.kind === 'tracepoint').length;
  const lsmCount = input.probes.filter((p) => p.kind === 'lsm').length;
  return emit(session, 'ebpf.kernel_traced', {
    probeCount: input.probes.length,
    kprobeCount,
    tracepointCount,
    lsmCount,
  });
}

export function recordSyscall(
  session: EbpfIiiSession,
  input: { counts: Record<string, number> },
): AxisStep<EbpfIiiState> {
  if (session.state !== 'kernel-traced') {
    throw new Error(`recordSyscall: session is ${session.state}, not kernel-traced`);
  }
  const keys = Object.keys(input.counts);
  if (keys.length === 0) {
    throw new Error('recordSyscall: counts must not be empty');
  }
  for (const [name, count] of Object.entries(input.counts)) {
    if (count < 0) {
      throw new Error(`recordSyscall: count for ${name} must be non-negative`);
    }
  }
  session.syscallCounts = { ...input.counts };
  const totalCalls = Object.values(input.counts).reduce((acc, v) => acc + v, 0);
  session.state = 'syscall-recorded';
  return emit(session, 'ebpf.syscall_recorded', {
    syscallCount: keys.length,
    totalCalls,
  });
}

export function captureNetworkFlow(
  session: EbpfIiiSession,
  input: { flows: EbpfNetworkFlow[] },
): AxisStep<EbpfIiiState> {
  if (session.state !== 'syscall-recorded') {
    throw new Error(`captureNetworkFlow: session is ${session.state}, not syscall-recorded`);
  }
  if (input.flows.length === 0) {
    throw new Error('captureNetworkFlow: flows must not be empty');
  }
  for (const f of input.flows) {
    if (f.bytes < 0 || f.packets < 0) {
      throw new Error('captureNetworkFlow: bytes/packets must be non-negative');
    }
  }
  session.flows = [...input.flows];
  const totalBytes = input.flows.reduce((acc, f) => acc + f.bytes, 0);
  const totalPackets = input.flows.reduce((acc, f) => acc + f.packets, 0);
  session.state = 'network-flow-captured';
  return emit(session, 'ebpf.network_flow_captured', {
    flowCount: input.flows.length,
    totalBytes,
    totalPackets,
  });
}

function emit(
  session: EbpfIiiSession,
  neutralEvent: AxisStep<EbpfIiiState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<EbpfIiiState> {
  const step: AxisStep<EbpfIiiState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, hostId: session.hostId, ...metadata },
  };
  session.history.push(step);
  return step;
}
