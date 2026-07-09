import {
  assertStaticBoundary,
  beginIslandHydration,
  bootstrapIslandsRoute,
  enableProgressiveEnhancement,
  markIslandInteractive,
  markFormStatusPending,
  registerIsland,
  resolveFormAction,
  startFormActionSession,
  type ComponentTarget,
} from '@kiwa-lab/component';
import {
  applyHmrPatch,
  completeFastRefresh,
  findHmrBoundary,
  markModuleUpdated,
  startTurbopackHmr,
  type NextTarget,
} from '@kiwa-lab/nextjs';

export interface WorkflowResult {
  target: string;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: ComponentTarget[] = ['storybook8', 'playwright-ct', 'chromatic'];
const nextTargets: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'];

export function runIslandsArchitectureAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = bootstrapIslandsRoute({ target: t, routeId: `/${t}` });
    registerIsland(s, { islandId: 'nav', loadStrategy: 'load', interactiveBoundary: true });
    registerIsland(s, { islandId: 'chat', loadStrategy: 'idle', interactiveBoundary: true });
    beginIslandHydration(s, 'nav');
    markIslandInteractive(s, 'nav');
    beginIslandHydration(s, 'chat');
    markIslandInteractive(s, 'chat');
    assertStaticBoundary(s, 'footer');
    return {
      target: t,
      axis: 'islands-architecture',
      eventCount: s.history.length,
      completed: s.state === 'static-verified',
    };
  });
}

export function runTurbopackHmrAxis(): WorkflowResult[] {
  return nextTargets.map((t) => {
    const s = startTurbopackHmr({ target: t, sessionId: `hmr-${t}` });
    markModuleUpdated(s, 'src/page.tsx');
    findHmrBoundary(s, 'src/layout.tsx');
    applyHmrPatch(s);
    completeFastRefresh(s);
    return {
      target: t,
      axis: 'turbopack-hmr',
      eventCount: s.history.length,
      completed: s.state === 'refresh-completed',
    };
  });
}

export function runProgressiveEnhancementAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startFormActionSession<{ name: string }>({ target: t, formId: `pe-${t}`, initial: { name: 'x' } });
    enableProgressiveEnhancement(s, { actionUrl: '/submit', method: 'post' });
    markFormStatusPending(s, 'user-btn');
    resolveFormAction(s, { name: 'ok' });
    return {
      target: t,
      axis: 'progressive-enhancement',
      eventCount: s.history.length,
      completed: s.history.length > 0,
    };
  });
}

export function runFullWorkflow(): WorkflowResult[] {
  return [
    ...runIslandsArchitectureAxis(),
    ...runTurbopackHmrAxis(),
    ...runProgressiveEnhancementAxis(),
  ];
}
