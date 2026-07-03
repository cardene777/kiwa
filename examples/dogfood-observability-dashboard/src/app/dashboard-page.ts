import type {
  DashboardAdapter,
  DashboardAdapterConfig,
  PanelDef,
  PanelRenderResult,
} from '../adapters/interface.js';
import { makeMockAdapter } from '../adapters/mock.js';
import { makeRealAdapter } from '../adapters/real.js';
import { seededPanels } from '../panels/index.js';

/**
 * Next.js App Router-style dashboard page controller. The dogfood does
 * not ship a running Next.js server (the workspace stays runtime-agnostic
 * so `pnpm test` never boots Node http), but the file mirrors the module
 * shape a real `app/dashboard/page.tsx` server component would use —
 *
 * ```tsx
 * export default async function DashboardPage() {
 *   const controller = createDashboardPageController();
 *   const initial = await controller.load();
 *   return <DashboardView initial={initial} />;
 * }
 * ```
 *
 * The controller is the observable surface — the fidelity harness diffs
 * mock vs real by exercising it end-to-end.
 */

export type KiwaMode = 'mock' | 'real';

export function resolveKiwaMode(env: NodeJS.ProcessEnv = process.env): KiwaMode {
  const raw = env.KIWA_MODE?.toLowerCase();
  return raw === 'real' ? 'real' : 'mock';
}

export interface DashboardPageState {
  dashboardId: string;
  title: string;
  mode: KiwaMode;
  panels: PanelRenderResult[];
  refreshCount: number;
}

export interface DashboardPageController {
  readonly mode: KiwaMode;
  readonly panels: PanelDef[];
  readonly adapter: DashboardAdapter;
  load(): Promise<DashboardPageState>;
  refresh(): Promise<DashboardPageState>;
  reset(): Promise<void>;
}

/**
 * Build the controller. `panels` defaults to the 5 canonical panels
 * (`seededPanels`) so the dashboard page renders 1 panel per chart_type.
 */
export function createDashboardPageController(options?: {
  mode?: KiwaMode;
  panels?: PanelDef[];
  dashboardId?: string;
  title?: string;
  now?: () => number;
}): DashboardPageController {
  const mode = options?.mode ?? resolveKiwaMode();
  const panels = options?.panels ?? seededPanels;
  const cfg: DashboardAdapterConfig = {
    dashboardId: options?.dashboardId ?? 'dogfood-observability-dashboard',
    title: options?.title ?? 'kiwa observability dogfood',
    panels,
    ...(options?.now ? { now: options.now } : {}),
  };
  const adapter = mode === 'real' ? makeRealAdapter(cfg) : makeMockAdapter(cfg);

  return {
    mode,
    panels,
    adapter,
    async load(): Promise<DashboardPageState> {
      const rendered = await adapter.refreshDashboard();
      return {
        dashboardId: cfg.dashboardId,
        title: cfg.title,
        mode,
        panels: rendered,
        refreshCount: adapter.getRefreshCount(),
      };
    },
    async refresh(): Promise<DashboardPageState> {
      const rendered = await adapter.refreshDashboard();
      return {
        dashboardId: cfg.dashboardId,
        title: cfg.title,
        mode,
        panels: rendered,
        refreshCount: adapter.getRefreshCount(),
      };
    },
    async reset(): Promise<void> {
      await adapter.reset();
    },
  };
}
