import type { RouteNode } from '../adapters/interface.js';

/**
 * 3-level routing tree — severity → team → channel. The deepest match
 * wins, so a `critical / platform / pagerduty` fire lands on
 * `pagerduty-platform`, while a `critical` fire without a team lands
 * on the fallback `pagerduty` root.
 *
 * The tree is deliberately balanced with 6 leaves so every seeded rule
 * has a distinct receiver, and the fidelity harness can assert on
 * receiver identity rather than routing "worked".
 *
 * ```
 * root (default)
 * ├── severity=critical
 * │   ├── team=platform → pagerduty-platform
 * │   ├── team=infra    → pagerduty-infra
 * │   └── (fallback)    → pagerduty
 * ├── severity=warn
 * │   ├── team=platform → slack-platform
 * │   ├── team=data     → slack-data
 * │   ├── team=infra    → slack-infra
 * │   └── (fallback)    → slack
 * └── severity=info     → slack-info
 * ```
 */
export function seededRoute(): RouteNode {
  return {
    match: {},
    receiver: 'default',
    routes: [
      {
        match: { severity: 'critical' },
        receiver: 'pagerduty',
        routes: [
          { match: { team: 'platform' }, receiver: 'pagerduty-platform' },
          { match: { team: 'infra' }, receiver: 'pagerduty-infra' },
        ],
      },
      {
        match: { severity: 'warn' },
        receiver: 'slack',
        routes: [
          { match: { team: 'platform' }, receiver: 'slack-platform' },
          { match: { team: 'data' }, receiver: 'slack-data' },
          { match: { team: 'infra' }, receiver: 'slack-infra' },
        ],
      },
      {
        match: { severity: 'info' },
        receiver: 'slack-info',
      },
    ],
  };
}

/**
 * Provider-neutral routing walk — deepest match wins, matching the
 * observability package `AlertRouter` internal walkRoute semantics.
 * Kept here so the real adapter can walk the same tree client-side
 * without depending on the mock.
 */
export function walkRoute(
  node: RouteNode,
  labels: Record<string, string>,
): string | null {
  if (!matchesLabels(node.match, labels)) return null;
  if (node.routes && node.routes.length > 0) {
    for (const child of node.routes) {
      const deep = walkRoute(child, labels);
      if (deep) return deep;
    }
  }
  return node.receiver;
}

function matchesLabels(
  match: Record<string, string>,
  labels: Record<string, string>,
): boolean {
  for (const [k, v] of Object.entries(match)) {
    if (labels[k] !== v) return false;
  }
  return true;
}
