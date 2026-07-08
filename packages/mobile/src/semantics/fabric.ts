import { providerEventName, type AxisStep, type MobileTarget } from './types.js';

/**
 * v1.52 fabric axis — React Native 0.76+ Fabric renderer (concurrent + priority + shadow tree)。
 */
export type FabricState = 'idle' | 'scheduled' | 'shadow-committed' | 'priority-updated' | 'mounted';

export interface FabricSession {
  target: MobileTarget;
  rootId: string;
  state: FabricState;
  scheduledPriority: 'discrete' | 'continuous' | 'idle' | null;
  shadowNodeCount: number;
  history: AxisStep<FabricState>[];
}

function emit(
  session: FabricSession,
  neutralEvent:
    | 'fabric.render_scheduled'
    | 'fabric.shadow_tree_committed'
    | 'fabric.priority_updated'
    | 'fabric.mount_completed',
  metadata: Record<string, string | number | boolean>,
): AxisStep<FabricState> {
  const step: AxisStep<FabricState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { rootId: session.rootId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function initFabric(input: { target: MobileTarget; rootId: string }): FabricSession {
  if (input.rootId.length === 0) throw new Error('initFabric: rootId must not be empty');
  return {
    target: input.target,
    rootId: input.rootId,
    state: 'idle',
    scheduledPriority: null,
    shadowNodeCount: 0,
    history: [],
  };
}

export function scheduleFabricRender(
  session: FabricSession,
  priority: 'discrete' | 'continuous' | 'idle',
): AxisStep<FabricState> {
  session.scheduledPriority = priority;
  session.state = 'scheduled';
  return emit(session, 'fabric.render_scheduled', { priority });
}

export function commitShadowTree(
  session: FabricSession,
  input: { nodeCount: number },
): AxisStep<FabricState> {
  if (session.state !== 'scheduled' && session.state !== 'priority-updated') {
    throw new Error(`commitShadowTree: session is ${session.state}`);
  }
  if (input.nodeCount < 0) throw new Error('commitShadowTree: nodeCount must be >= 0');
  session.shadowNodeCount = input.nodeCount;
  session.state = 'shadow-committed';
  return emit(session, 'fabric.shadow_tree_committed', { nodeCount: input.nodeCount });
}

export function updateFabricPriority(
  session: FabricSession,
  priority: 'discrete' | 'continuous' | 'idle',
): AxisStep<FabricState> {
  session.scheduledPriority = priority;
  session.state = 'priority-updated';
  return emit(session, 'fabric.priority_updated', { priority });
}

export function completeFabricMount(session: FabricSession): AxisStep<FabricState> {
  if (session.state !== 'shadow-committed') {
    throw new Error(`completeFabricMount: session is ${session.state}`);
  }
  session.state = 'mounted';
  return emit(session, 'fabric.mount_completed', { shadowNodeCount: session.shadowNodeCount });
}
