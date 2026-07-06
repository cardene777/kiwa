import { providerEventName, type AxisStep, type NextTarget } from './types.js';

export type PartialPrerenderingState = 'idle' | 'static-shell' | 'dynamic-hole' | 'streaming' | 'completed';

export interface PartialPrerenderingSession {
  target: NextTarget;
  routeId: string;
  state: PartialPrerenderingState;
  shellHtml: string | null;
  dynamicHoles: Map<string, string>;
  streamedBoundaries: string[];
  history: AxisStep<PartialPrerenderingState>[];
}

export function startPartialPrerendering(input: {
  target: NextTarget;
  routeId: string;
}): PartialPrerenderingSession {
  if (input.routeId.length === 0) {
    throw new Error('startPartialPrerendering: routeId must not be empty');
  }
  return {
    target: input.target,
    routeId: input.routeId,
    state: 'idle',
    shellHtml: null,
    dynamicHoles: new Map(),
    streamedBoundaries: [],
    history: [],
  };
}

export function renderStaticShell(
  session: PartialPrerenderingSession,
  html: string,
): AxisStep<PartialPrerenderingState> {
  if (session.state !== 'idle') {
    throw new Error(`renderStaticShell: session is ${session.state}, not idle`);
  }
  if (html.length === 0) {
    throw new Error('renderStaticShell: html must not be empty');
  }
  session.state = 'static-shell';
  session.shellHtml = html;
  return emit(session, 'ppr.static_shell_rendered', { bytes: html.length });
}

export function openDynamicHole(
  session: PartialPrerenderingSession,
  input: { holeId: string; fallback: string },
): AxisStep<PartialPrerenderingState> {
  if (session.shellHtml === null) {
    throw new Error('openDynamicHole: static shell must be rendered first');
  }
  if (input.holeId.length === 0) {
    throw new Error('openDynamicHole: holeId must not be empty');
  }
  session.state = 'dynamic-hole';
  session.dynamicHoles.set(input.holeId, input.fallback);
  return emit(session, 'ppr.dynamic_hole_opened', {
    holeId: input.holeId,
    fallback: input.fallback,
    holeCount: session.dynamicHoles.size,
  });
}

export function flushStreamingBoundary(
  session: PartialPrerenderingSession,
  input: { holeId: string; html: string },
): AxisStep<PartialPrerenderingState> {
  if (!session.dynamicHoles.has(input.holeId)) {
    throw new Error(`flushStreamingBoundary: ${input.holeId} is not an open dynamic hole`);
  }
  if (input.html.length === 0) {
    throw new Error('flushStreamingBoundary: html must not be empty');
  }
  session.state = 'streaming';
  session.streamedBoundaries.push(input.holeId);
  session.dynamicHoles.set(input.holeId, input.html);
  return emit(session, 'ppr.streaming_boundary_flushed', {
    holeId: input.holeId,
    bytes: input.html.length,
  });
}

export function completePartialPrerendering(
  session: PartialPrerenderingSession,
): AxisStep<PartialPrerenderingState> {
  if (session.shellHtml === null) {
    throw new Error('completePartialPrerendering: static shell was not rendered');
  }
  session.state = 'completed';
  return emit(session, 'ppr.completed', {
    holeCount: session.dynamicHoles.size,
    streamedCount: session.streamedBoundaries.length,
  });
}

function emit(
  session: PartialPrerenderingSession,
  neutralEvent: AxisStep<PartialPrerenderingState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<PartialPrerenderingState> {
  const step: AxisStep<PartialPrerenderingState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, routeId: session.routeId, ...metadata },
  };
  session.history.push(step);
  return step;
}
