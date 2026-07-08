import {
  applyReactActionOptimistic,
  beginActionTransition,
  beginRscRender,
  completeRscRender,
  enterSuspenseBoundary,
  initializeReactActions,
  resolveAction,
  startRscHarness,
  streamHtmlChunk,
  type ComponentTarget,
} from '@kiwa-test/component';
import {
  redirectAction,
  revalidateActionPath,
  startServerActionAdvanced,
  submitFormAction,
  type NextTarget,
} from '@kiwa-test/nextjs';

/**
 * v1.49-2 RSC + Server Actions v2 workflow — 3 axis (RSC harness + React 19 Actions
 * + Server Action advanced) × 3 target × mock/real fidelity harness。
 */
export interface WorkflowResult {
  target: string;
  axis: string;
  eventCount: number;
  completed: boolean;
}

const targets: ComponentTarget[] = ['storybook8', 'playwright-ct', 'chromatic'];
const nextTargets: NextTarget[] = ['app-router', 'pages-router', 'edge-runtime'];

export function runRscHarnessAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startRscHarness({ target: t, componentId: `card-${t}` });
    beginRscRender(s);
    enterSuspenseBoundary(s);
    streamHtmlChunk(s, '<html-chunk-1>');
    completeRscRender(s);
    return {
      target: t,
      axis: 'rsc-harness',
      eventCount: s.history.length,
      completed: s.state === 'completed',
    };
  });
}

export function runReactActionsAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = initializeReactActions({ target: t, actionId: `submit-${t}` });
    beginActionTransition(s);
    applyReactActionOptimistic(s, 'draft');
    resolveAction(s, 'final');
    return {
      target: t,
      axis: 'react-19-actions',
      eventCount: s.history.length,
      completed: s.state === 'resolved',
    };
  });
}

export function runServerActionAdvancedAxis(): WorkflowResult[] {
  return nextTargets.map((t) => {
    const s = startServerActionAdvanced({ target: t, actionId: `action-${t}` });
    submitFormAction(s, { formName: 'contact', payload: 'ok' } as Record<string, string>);
    revalidateActionPath(s, '/contact');
    redirectAction(s, '/thanks');
    return {
      target: t,
      axis: 'server-action-advanced',
      eventCount: s.history.length,
      completed: s.state === 'redirected',
    };
  });
}

export function runFullWorkflow(): WorkflowResult[] {
  return [
    ...runRscHarnessAxis(),
    ...runReactActionsAxis(),
    ...runServerActionAdvancedAxis(),
  ];
}
