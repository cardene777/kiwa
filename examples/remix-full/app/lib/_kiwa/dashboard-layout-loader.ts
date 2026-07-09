// dashboard-layout-loader.ts — parent (layout) route loader (Issue #561, v1.3-4)。
//
// /dashboard 配下の nested route layout として共通 user info を解決し、
// `cache-control` + Set-Cookie (last-visit timestamp) を発行する pure loader。
// 子 (/dashboard.profile / /dashboard.settings) は Remix の useMatches で
// この loader 結果を読む or kiwa の setupRemixNestedRouteEnv で context.parentData
// として受け取って unit test できる。

import { json, type SimulatedRouteArgs } from '@kiwa-lab/remix';
import { resolveUser } from '../../utils/_kiwa/auth.js';

export interface DashboardLayoutData {
  readonly user: { readonly id: string; readonly role: string };
  readonly lastVisitAt: string;
}

export async function dashboardLayoutLoader(args: SimulatedRouteArgs): Promise<Response> {
  const user = resolveUser(args.request);
  if (user === null) {
    return json({ error: 'unauthorized' }, { status: 401 });
  }
  const now = new Date(args.request.headers.get('x-test-now') ?? '2026-06-30T00:00:00Z').toISOString();
  const data: DashboardLayoutData = { user: { id: user.id, role: user.role }, lastVisitAt: now };
  return json(data, {
    headers: {
      'cache-control': 'private, max-age=30',
      // /dashboard を訪問するたびに last-visit cookie を更新 (子 route まで持ち越す)
      'set-cookie': `lastVisit=${encodeURIComponent(now)}; Path=/dashboard; HttpOnly`,
    },
  });
}

// Remix `headers()` export — child の loader header + parent loader header を merge し、
// cache-control を leaf まで bubble up させる。
export const dashboardLayoutHeaders = ({
  loaderHeaders,
  parentHeaders,
}: {
  loaderHeaders: Headers;
  parentHeaders: Headers;
}): Headers => {
  const h = new Headers(parentHeaders);
  const cc = loaderHeaders.get('cache-control');
  if (cc !== null) h.set('cache-control', cc);
  return h;
};
