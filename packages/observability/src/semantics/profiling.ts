import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type ProfilingState = 'idle' | 'cpu-sampled' | 'memory-sampled' | 'off-cpu-sampled' | 'flame-built';

export type ProfileKind = 'cpu' | 'memory' | 'off-cpu';

export interface ProfileSample {
  kind: ProfileKind;
  stack: string[];
  valueBytes: number;
  timestampMs: number;
}

export interface FlameNode {
  frame: string;
  totalValue: number;
  children: Map<string, FlameNode>;
}

export interface ProfilingSession {
  target: ObservabilityTarget;
  serviceName: string;
  state: ProfilingState;
  samples: ProfileSample[];
  flameGraph: FlameNode | null;
  history: AxisStep<ProfilingState>[];
}

export function startProfiling(input: {
  target: ObservabilityTarget;
  serviceName: string;
}): ProfilingSession {
  if (input.serviceName.length === 0) {
    throw new Error('startProfiling: serviceName must not be empty');
  }
  return {
    target: input.target,
    serviceName: input.serviceName,
    state: 'idle',
    samples: [],
    flameGraph: null,
    history: [],
  };
}

export function sampleCpu(
  session: ProfilingSession,
  input: { stack: string[]; valueBytes: number; timestampMs: number },
): AxisStep<ProfilingState> {
  return recordSample(session, 'cpu', input, 'profile.cpu_sampled', 'cpu-sampled');
}

export function sampleMemory(
  session: ProfilingSession,
  input: { stack: string[]; valueBytes: number; timestampMs: number },
): AxisStep<ProfilingState> {
  return recordSample(session, 'memory', input, 'profile.memory_sampled', 'memory-sampled');
}

export function sampleOffCpu(
  session: ProfilingSession,
  input: { stack: string[]; valueBytes: number; timestampMs: number },
): AxisStep<ProfilingState> {
  return recordSample(session, 'off-cpu', input, 'profile.off_cpu_sampled', 'off-cpu-sampled');
}

function recordSample(
  session: ProfilingSession,
  kind: ProfileKind,
  input: { stack: string[]; valueBytes: number; timestampMs: number },
  neutralEvent:
    | 'profile.cpu_sampled'
    | 'profile.memory_sampled'
    | 'profile.off_cpu_sampled',
  nextState: ProfilingState,
): AxisStep<ProfilingState> {
  if (input.stack.length === 0) {
    throw new Error(`${kind} sample: stack must not be empty`);
  }
  if (input.valueBytes < 0) {
    throw new Error(`${kind} sample: valueBytes must be non-negative`);
  }
  session.samples.push({ kind, stack: [...input.stack], valueBytes: input.valueBytes, timestampMs: input.timestampMs });
  session.state = nextState;
  return emit(session, neutralEvent, {
    kind,
    stackDepth: input.stack.length,
    valueBytes: input.valueBytes,
    sampleCount: session.samples.length,
  });
}

export function buildFlameGraph(
  session: ProfilingSession,
  input: { kind: ProfileKind },
): AxisStep<ProfilingState> {
  const kindSamples = session.samples.filter((s) => s.kind === input.kind);
  if (kindSamples.length === 0) {
    throw new Error(`buildFlameGraph: no samples for kind=${input.kind}`);
  }
  const root: FlameNode = { frame: '<root>', totalValue: 0, children: new Map() };
  for (const sample of kindSamples) {
    root.totalValue += sample.valueBytes;
    let node = root;
    for (const frame of sample.stack) {
      let child = node.children.get(frame);
      if (!child) {
        child = { frame, totalValue: 0, children: new Map() };
        node.children.set(frame, child);
      }
      child.totalValue += sample.valueBytes;
      node = child;
    }
  }
  session.flameGraph = root;
  session.state = 'flame-built';
  return emit(session, 'profile.flame_graph_built', {
    kind: input.kind,
    rootValue: root.totalValue,
    sampleCount: kindSamples.length,
    branchCount: root.children.size,
  });
}

export function flattenFlameGraph(node: FlameNode | null): Array<{ frame: string; totalValue: number; depth: number }> {
  if (!node) return [];
  const result: Array<{ frame: string; totalValue: number; depth: number }> = [];
  const walk = (n: FlameNode, depth: number): void => {
    result.push({ frame: n.frame, totalValue: n.totalValue, depth });
    for (const child of n.children.values()) {
      walk(child, depth + 1);
    }
  };
  walk(node, 0);
  return result;
}

function emit(
  session: ProfilingSession,
  neutralEvent: AxisStep<ProfilingState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ProfilingState> {
  const step: AxisStep<ProfilingState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, serviceName: session.serviceName, ...metadata },
  };
  session.history.push(step);
  return step;
}
