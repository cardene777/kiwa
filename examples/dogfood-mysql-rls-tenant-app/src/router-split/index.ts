/**
 * Router split flow driver — wraps orm v0.10 `createPoolAdvancedSession`
 * + 4 state-transition primitives (`runPoolHealthCheck`,
 * `warmPoolConnections`, `drainPoolGracefully`, `exportPoolMetrics`)
 * into a single dogfood run that walks the MySQL Router R/W split
 * lifecycle (cold → healthy → warmed-up → draining → metrics-exported).
 *
 * v1.32-3 scope: 1 pool × 8 warmed connections × N read + M write route
 * hits classified by the input's read/write shape. The mock semantics
 * enforce state ordering + connection count >= min-warm + non-negative
 * pool metrics; the real driver defers to a MySQL Router-managed
 * ProxySQL / mysql-router client wired via `MYSQL_KEY` (v1.32-6 scope).
 */

import {
  createPoolAdvancedSession,
  drainPoolGracefully,
  exportPoolMetrics,
  runPoolHealthCheck,
  warmPoolConnections,
  type PoolAdvancedSession,
} from '@kiwa-lab/orm';
import type { RouterSplitObservation } from '../adapters/interface.js';

export interface DriveRouterSplitInput {
  readonly poolId?: string;
  readonly minWarmConnections?: number;
  readonly warmedConnections?: number;
  readonly healthLatencyMs?: number;
  readonly drainDeadlineMs?: number;
  readonly routeHits?: readonly ('read' | 'write')[];
  readonly finalMetrics?: { active: number; idle: number; waiting: number };
}

const DEFAULTS = {
  poolId: 'mysql_router_rw_pool_v2',
  minWarmConnections: 4,
  warmedConnections: 8,
  healthLatencyMs: 3,
  drainDeadlineMs: 200,
  routeHits: [
    'write',
    'read',
    'read',
    'read',
    'write',
    'read',
  ] as readonly ('read' | 'write')[],
  finalMetrics: { active: 2, idle: 6, waiting: 0 },
};

export interface DriveRouterSplitResult {
  observation: RouterSplitObservation;
  session: PoolAdvancedSession;
}

/**
 * Walk health-check → warm → drain → metrics-export while classifying
 * every entry in `routeHits` as either a read (goes to a read-only
 * replica behind the Router) or a write (goes to the elected primary).
 * The observation surfaces the read / write route counts so the fidelity
 * harness can assert the splitter accounted every request.
 */
export function driveRouterSplitFlow(
  input: DriveRouterSplitInput = {},
): DriveRouterSplitResult {
  const cfg = { ...DEFAULTS, ...input };

  const session = createPoolAdvancedSession({
    poolId: cfg.poolId,
    provider: 'prisma',
    backend: 'mysql',
    minWarmConnections: cfg.minWarmConnections,
  });

  runPoolHealthCheck(session, {
    latencyMs: cfg.healthLatencyMs,
    ok: true,
  });

  warmPoolConnections(session, {
    connectionCount: cfg.warmedConnections,
  });

  let readHits = 0;
  let writeHits = 0;
  for (const route of cfg.routeHits) {
    if (route === 'read') readHits += 1;
    else writeHits += 1;
  }

  drainPoolGracefully(session, { deadlineMs: cfg.drainDeadlineMs });
  exportPoolMetrics(session, cfg.finalMetrics);

  const observation: RouterSplitObservation = {
    poolId: session.poolId,
    readHits,
    writeHits,
    warmedConnections: cfg.warmedConnections,
    finalState: session.state,
  };

  return { observation, session };
}
