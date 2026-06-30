// dashboard.profile.tsx — Remix v2 flat nested route child (/dashboard/profile)。
// thin wrapper として _kiwa の pure loader / headers export を re-invoke する。

import type { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  dashboardProfileLoader,
  dashboardProfileHeaders,
} from '../lib/_kiwa/dashboard-profile-loader.js';

export const loader = async ({ request, params, context }: LoaderFunctionArgs): Promise<unknown> => {
  return dashboardProfileLoader({
    request,
    params: params as Record<string, string>,
    context: context as Record<string, unknown>,
  });
};

export const headers = dashboardProfileHeaders;

export default function DashboardProfile() {
  // Note: defer() の resolved data は real Remix では <Await/> で render するが、
  // PoC では unit test で kiwa の setupRemixNestedRouteEnv + resolveDeferred で
  // 検証する経路を主眼に置く (e2e は別 Issue)。
  const data = useLoaderData<{ username: string; unread: number }>();
  return (
    <section>
      <h2>Profile of {data.username}</h2>
      <p>unread: {data.unread}</p>
    </section>
  );
}
