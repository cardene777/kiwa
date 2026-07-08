import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

/**
 * v1.49 islands-architecture axis — Astro / Deno Fresh / Solid Start の
 * Islands architecture (partial hydration + selective interactivity) を
 * target-neutral に扱う state machine。
 */
export type IslandsState =
  | 'idle'
  | 'registered'
  | 'hydrating'
  | 'interactive'
  | 'static-verified';

export interface IslandSpec {
  islandId: string;
  loadStrategy: 'load' | 'idle' | 'visible' | 'media' | 'only';
  interactiveBoundary: boolean;
}

export interface IslandsSession {
  target: ComponentTarget;
  routeId: string;
  islands: IslandSpec[];
  state: IslandsState;
  hydratedIslandIds: string[];
  staticBoundaryIds: string[];
  history: AxisStep<IslandsState>[];
}

function emit(
  session: IslandsSession,
  neutralEvent:
    | 'islands.registered'
    | 'islands.hydration_started'
    | 'islands.interactive_ready'
    | 'islands.static_boundary_asserted',
  metadata: Record<string, string | number | boolean>,
): AxisStep<IslandsState> {
  const step: AxisStep<IslandsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { routeId: session.routeId, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function bootstrapIslandsRoute(input: {
  target: ComponentTarget;
  routeId: string;
}): IslandsSession {
  if (input.routeId.length === 0) {
    throw new Error('bootstrapIslandsRoute: routeId must not be empty');
  }
  return {
    target: input.target,
    routeId: input.routeId,
    islands: [],
    state: 'idle',
    hydratedIslandIds: [],
    staticBoundaryIds: [],
    history: [],
  };
}

export function registerIsland(
  session: IslandsSession,
  island: IslandSpec,
): AxisStep<IslandsState> {
  session.islands.push(island);
  session.state = 'registered';
  return emit(session, 'islands.registered', {
    islandId: island.islandId,
    loadStrategy: island.loadStrategy,
    interactiveBoundary: island.interactiveBoundary,
  });
}

export function beginIslandHydration(
  session: IslandsSession,
  islandId: string,
): AxisStep<IslandsState> {
  const island = session.islands.find((i) => i.islandId === islandId);
  if (!island) {
    throw new Error(`beginIslandHydration: island ${islandId} not registered`);
  }
  if (session.state !== 'registered' && session.state !== 'hydrating') {
    throw new Error(`beginIslandHydration: session is ${session.state}`);
  }
  session.state = 'hydrating';
  return emit(session, 'islands.hydration_started', {
    islandId,
    loadStrategy: island.loadStrategy,
  });
}

export function markIslandInteractive(
  session: IslandsSession,
  islandId: string,
): AxisStep<IslandsState> {
  if (session.state !== 'hydrating') {
    throw new Error(`markIslandInteractive: session is ${session.state}`);
  }
  if (session.hydratedIslandIds.includes(islandId)) {
    throw new Error(`markIslandInteractive: island ${islandId} already interactive`);
  }
  session.hydratedIslandIds.push(islandId);
  const allHydrated = session.hydratedIslandIds.length === session.islands.filter((i) => i.interactiveBoundary).length;
  if (allHydrated) {
    session.state = 'interactive';
  }
  return emit(session, 'islands.interactive_ready', {
    islandId,
    hydratedCount: session.hydratedIslandIds.length,
    allInteractiveReady: allHydrated,
  });
}

export function assertStaticBoundary(
  session: IslandsSession,
  boundaryId: string,
): AxisStep<IslandsState> {
  if (session.staticBoundaryIds.includes(boundaryId)) {
    throw new Error(`assertStaticBoundary: boundary ${boundaryId} already asserted`);
  }
  session.staticBoundaryIds.push(boundaryId);
  if (session.state === 'interactive') {
    session.state = 'static-verified';
  }
  return emit(session, 'islands.static_boundary_asserted', {
    boundaryId,
    staticBoundaryCount: session.staticBoundaryIds.length,
  });
}
