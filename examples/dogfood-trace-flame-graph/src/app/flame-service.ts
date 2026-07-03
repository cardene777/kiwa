import type {
  FlameExplorerAdapter,
  FlameExplorerConfig,
  FlameGraphNode,
  FlameNameStats,
  LoadedTrace,
  LogJoinEntry,
} from '../adapters/interface.js';
import { makeMockAdapter } from '../adapters/mock.js';
import { makeRealAdapter } from '../adapters/real.js';
import { seededTraces } from '../traces/index.js';

/**
 * Trace flame graph explorer service — the shape a browser SPA would
 * call into. The dogfood does not ship a running dev server (the
 * workspace stays runtime-agnostic so `pnpm test` never boots Vite),
 * but the file mirrors the module shape a real `App.tsx` context
 * provider would use.
 *
 * The service is the observable surface — the fidelity harness diffs
 * mock vs real by exercising it end-to-end.
 */

export type KiwaMode = 'mock' | 'real';

export function resolveKiwaMode(env: NodeJS.ProcessEnv = process.env): KiwaMode {
  const raw = env.KIWA_MODE?.toLowerCase();
  return raw === 'real' ? 'real' : 'mock';
}

export interface FlameServiceState {
  explorerId: string;
  mode: KiwaMode;
  focusedTraceId: string | null;
  loadedTrace: LoadedTrace | null;
  flame: FlameGraphNode[];
  logs: LogJoinEntry[];
}

export interface FlameService {
  readonly mode: KiwaMode;
  readonly adapter: FlameExplorerAdapter;
  focus(traceId: string): Promise<FlameServiceState>;
  drill(traceId: string, name: string): Promise<FlameGraphNode | null>;
  filter(traceId: string, name: string): Promise<FlameNameStats | null>;
  reset(): Promise<void>;
}

/**
 * Build the service. Defaults pull the 10 canonical seeded traces so a
 * fresh caller has a working set without any hand-rolling.
 */
export function createFlameService(options?: {
  mode?: KiwaMode;
  explorerId?: string;
  config?: FlameExplorerConfig;
  now?: () => number;
}): FlameService {
  const mode = options?.mode ?? resolveKiwaMode();
  const cfg: FlameExplorerConfig = options?.config ?? {
    explorerId: options?.explorerId ?? 'dogfood-trace-flame-graph',
    traces: seededTraces(),
    ...(options?.now ? { now: options.now } : {}),
  };
  const adapter = mode === 'real' ? makeRealAdapter(cfg) : makeMockAdapter(cfg);

  return {
    mode,
    adapter,
    async focus(traceId: string): Promise<FlameServiceState> {
      const loadedTrace = await adapter.loadTrace(traceId);
      const flame = await adapter.renderFlame(traceId);
      const logs = await adapter.joinLogs(traceId);
      return {
        explorerId: cfg.explorerId,
        mode,
        focusedTraceId: traceId,
        loadedTrace,
        flame,
        logs,
      };
    },
    async drill(traceId: string, name: string): Promise<FlameGraphNode | null> {
      return adapter.drillDown(traceId, name);
    },
    async filter(traceId: string, name: string): Promise<FlameNameStats | null> {
      return adapter.filterByName(traceId, name);
    },
    async reset(): Promise<void> {
      await adapter.reset();
    },
  };
}
