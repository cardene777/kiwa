// dashboard-profile-loader.ts — child route loader (Issue #561, v1.3-4)。
//
// /dashboard.profile = /dashboard/profile の nested child loader。 parent
// (dashboardLayoutLoader) の data を `context.parentData` 経由で受け取り、
// 自身は profile-specific な情報 (notification count + defer() で重い query) を
// 返す。 cache-control は parent から bubble up、 Set-Cookie の `lastVisit` も
// parent → child の Cookie header に乗る (kiwa の setupRemixNestedRouteEnv で
// 自動 propagate)。

import { json, defer, type SimulatedRouteArgs } from '@kiwa/remix';
import type { DashboardLayoutData } from './dashboard-layout-loader.js';

export interface DashboardProfileData {
  readonly username: string;
  readonly unread: number;
  readonly badges: Promise<ReadonlyArray<string>>;
}

/**
 * /dashboard.profile loader。 parent の DashboardLayoutData が必須 (= 親 loader が
 * 走ってない or unauthorized 時は 401 を返す)。 badges は重い query を defer() で
 * stream する。
 */
export async function dashboardProfileLoader(args: SimulatedRouteArgs): Promise<unknown> {
  const parent = (args.context as { parentData?: unknown }).parentData as DashboardLayoutData | undefined;
  if (typeof parent === 'undefined' || typeof parent.user === 'undefined') {
    return json({ error: 'parent layout not loaded' }, { status: 401 });
  }
  const unread = parent.user.role === 'admin' ? 7 : 0;
  const badges = (async (): Promise<ReadonlyArray<string>> => {
    // 「重い query」 を simulate
    await Promise.resolve();
    return parent.user.role === 'admin' ? ['core-contributor', 'beta-tester'] : ['newcomer'];
  })();
  return defer({
    username: parent.user.id,
    unread,
    badges,
  });
}

// child route の Headers は parent の cache-control を尊重しつつ、
// profile 専用 header (x-profile-version) を足す。
export const dashboardProfileHeaders = ({
  loaderHeaders,
  parentHeaders,
}: {
  loaderHeaders: Headers;
  parentHeaders: Headers;
}): Headers => {
  const h = new Headers(parentHeaders);
  const profileVersion = loaderHeaders.get('x-profile-version');
  if (profileVersion !== null) h.set('x-profile-version', profileVersion);
  h.set('x-profile-version', 'v1');
  return h;
};
