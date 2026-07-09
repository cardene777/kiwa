import {
  assertAnimation,
  finishElementTransition,
  startElementTransition,
  startViewTransitionSession,
  type ComponentTarget,
} from '@kiwa-lab/component';
import {
  commitTransition,
  interruptTransition,
  markTransitionPending,
  startConcurrentTransition,
  startPartialPrerendering,
  renderStaticShell,
  openDynamicHole,
  flushStreamingBoundary,
  completePartialPrerendering,
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

export function runViewTransitionsAxis(): WorkflowResult[] {
  return targets.map((t) => {
    const s = startViewTransitionSession({ target: t, transitionId: `vt-${t}` });
    startElementTransition(s, { elementId: 'article-cover', from: 'list', to: 'detail' });
    finishElementTransition(s, 'article-cover');
    assertAnimation(s, { assertionId: 'anim-1', durationMs: 300, easing: 'ease' });
    return {
      target: t,
      axis: 'view-transitions',
      eventCount: s.history.length,
      completed: s.history.length > 0,
    };
  });
}

export function runConcurrentTransitionsAxis(): WorkflowResult[] {
  return nextTargets.map((t) => {
    const s = startConcurrentTransition({ target: t, transitionId: `ct-${t}` });
    markTransitionPending(s);
    interruptTransition(s);
    markTransitionPending(s);
    commitTransition(s, 'final');
    return {
      target: t,
      axis: 'concurrent-transitions',
      eventCount: s.history.length,
      completed: s.state === 'committed',
    };
  });
}

export function runPartialPrerenderingAxis(): WorkflowResult[] {
  return nextTargets.map((t) => {
    const s = startPartialPrerendering({ target: t, routeId: `ppr-${t}` });
    renderStaticShell(s, '<html>shell</html>');
    openDynamicHole(s, { holeId: 'user-widget', fallback: '<span>loading</span>' });
    flushStreamingBoundary(s, { holeId: 'user-widget', html: '<div>user</div>' });
    completePartialPrerendering(s);
    return {
      target: t,
      axis: 'partial-prerendering',
      eventCount: s.history.length,
      completed: s.state === 'completed',
    };
  });
}

export function runFullWorkflow(): WorkflowResult[] {
  return [
    ...runViewTransitionsAxis(),
    ...runConcurrentTransitionsAxis(),
    ...runPartialPrerenderingAxis(),
  ];
}
