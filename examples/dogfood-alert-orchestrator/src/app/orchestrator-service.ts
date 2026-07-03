import type {
  AlertFireEvent,
  AlertOrchestratorAdapter,
  AlertOrchestratorConfig,
  EscalationDelivery,
  MetricSample,
  RouteDecision,
} from '../adapters/interface.js';
import { makeMockAdapter } from '../adapters/mock.js';
import { makeRealAdapter } from '../adapters/real.js';
import { seededRules } from '../rules/index.js';
import { seededRoute } from '../routing/index.js';
import { seededSilences } from '../silence/index.js';
import { seededEscalation } from '../escalation/index.js';

/**
 * Node.js orchestrator service — the shape a real Prometheus
 * AlertManager sidecar would call into. The dogfood does not ship a
 * running HTTP server (the workspace stays runtime-agnostic so
 * `pnpm test` never boots Node http), but the file mirrors the module
 * shape a real `server.ts` express handler would use.
 *
 * The controller is the observable surface — the fidelity harness diffs
 * mock vs real by exercising it end-to-end.
 */

export type KiwaMode = 'mock' | 'real';

export function resolveKiwaMode(env: NodeJS.ProcessEnv = process.env): KiwaMode {
  const raw = env.KIWA_MODE?.toLowerCase();
  return raw === 'real' ? 'real' : 'mock';
}

export interface OrchestratorServiceState {
  orchestratorId: string;
  mode: KiwaMode;
  fires: AlertFireEvent[];
  routeDecisions: RouteDecision[];
  escalationDeliveries: EscalationDelivery[];
}

export interface OrchestratorService {
  readonly mode: KiwaMode;
  readonly adapter: AlertOrchestratorAdapter;
  ingest(samples: MetricSample[]): Promise<void>;
  cycle(): Promise<OrchestratorServiceState>;
  reset(): Promise<void>;
}

/**
 * Build the service. Defaults pull the 10 canonical rules + 3-level
 * routing tree + 2 silences + 3-step escalation ladder so a fresh
 * caller has a working config without any hand-rolling.
 */
export function createOrchestratorService(options?: {
  mode?: KiwaMode;
  orchestratorId?: string;
  config?: AlertOrchestratorConfig;
  now?: () => number;
}): OrchestratorService {
  const mode = options?.mode ?? resolveKiwaMode();
  const now = options?.now ?? (() => Date.now());
  const cfg: AlertOrchestratorConfig = options?.config ?? {
    orchestratorId: options?.orchestratorId ?? 'dogfood-alert-orchestrator',
    rules: seededRules,
    route: seededRoute(),
    silences: seededSilences(now()),
    escalation: seededEscalation(),
    ...(options?.now ? { now: options.now } : {}),
  };
  const adapter = mode === 'real' ? makeRealAdapter(cfg) : makeMockAdapter(cfg);

  return {
    mode,
    adapter,
    async ingest(samples: MetricSample[]): Promise<void> {
      for (const sample of samples) {
        await adapter.emitMetric(sample);
      }
    },
    async cycle(): Promise<OrchestratorServiceState> {
      const fires = await adapter.evaluateRules();
      const routeDecisions: RouteDecision[] = [];
      for (const fire of fires) {
        routeDecisions.push(await adapter.routeAlert(fire));
      }
      const escalationDeliveries = await adapter.advanceEscalation();
      return {
        orchestratorId: cfg.orchestratorId,
        mode,
        fires,
        routeDecisions,
        escalationDeliveries,
      };
    },
    async reset(): Promise<void> {
      await adapter.reset();
    },
  };
}
