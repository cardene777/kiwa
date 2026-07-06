import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

export type RscHarnessState = 'idle' | 'rendering' | 'suspended' | 'streaming' | 'completed' | 'errored';

export interface RscHarnessSession {
  target: ComponentTarget;
  componentId: string;
  state: RscHarnessState;
  chunks: string[];
  suspenseFallback: string | null;
  history: AxisStep<RscHarnessState>[];
  error: string | null;
}

export function startRscHarness(input: {
  target: ComponentTarget;
  componentId: string;
  suspenseFallback?: string;
}): RscHarnessSession {
  if (input.componentId.length === 0) {
    throw new Error('startRscHarness: componentId must not be empty');
  }
  return {
    target: input.target,
    componentId: input.componentId,
    state: 'idle',
    chunks: [],
    suspenseFallback: input.suspenseFallback ?? null,
    history: [],
    error: null,
  };
}

export function beginRscRender(session: RscHarnessSession): AxisStep<RscHarnessState> {
  if (session.state !== 'idle') {
    throw new Error(`beginRscRender: session is ${session.state}, not idle`);
  }
  session.state = 'rendering';
  return emit(session, 'rsc.render_started', { componentId: session.componentId });
}

export function enterSuspenseBoundary(
  session: RscHarnessSession,
  fallback: string = session.suspenseFallback ?? '<template data-suspense="pending"></template>',
): AxisStep<RscHarnessState> {
  if (session.state !== 'rendering') {
    throw new Error(`enterSuspenseBoundary: session is ${session.state}, not rendering`);
  }
  session.state = 'suspended';
  session.suspenseFallback = fallback;
  return emit(session, 'rsc.suspense_boundary', { fallback });
}

export function streamHtmlChunk(
  session: RscHarnessSession,
  chunk: string,
): AxisStep<RscHarnessState> {
  if (session.state !== 'rendering' && session.state !== 'suspended' && session.state !== 'streaming') {
    throw new Error(`streamHtmlChunk: session is ${session.state}, cannot stream`);
  }
  if (chunk.length === 0) {
    throw new Error('streamHtmlChunk: chunk must not be empty');
  }
  session.state = 'streaming';
  session.chunks.push(chunk);
  return emit(session, 'rsc.html_chunk_streamed', {
    chunk,
    chunkIndex: session.chunks.length - 1,
    bytes: chunk.length,
  });
}

export function completeRscRender(session: RscHarnessSession): AxisStep<RscHarnessState> {
  if (session.state !== 'rendering' && session.state !== 'suspended' && session.state !== 'streaming') {
    throw new Error(`completeRscRender: session is ${session.state}, cannot complete`);
  }
  session.state = 'completed';
  return emit(session, 'rsc.render_completed', {
    chunkCount: session.chunks.length,
    html: session.chunks.join(''),
  });
}

export function failRscRender(
  session: RscHarnessSession,
  error: Error | string,
): AxisStep<RscHarnessState> {
  if (session.state === 'completed') {
    throw new Error('failRscRender: completed session cannot fail');
  }
  session.state = 'errored';
  session.error = typeof error === 'string' ? error : error.message;
  return emit(session, 'ssr.error_boundary_captured', {
    componentId: session.componentId,
    error: session.error,
  });
}

function emit(
  session: RscHarnessSession,
  neutralEvent: AxisStep<RscHarnessState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<RscHarnessState> {
  const step: AxisStep<RscHarnessState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, ...metadata },
  };
  session.history.push(step);
  return step;
}
