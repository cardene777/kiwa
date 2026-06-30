// dashboard.tsx — Remix v2 nested route parent (layout)。 thin wrapper として
// _kiwa の pure loader / headers export を re-invoke する。 子 route は
// dashboard.$child.tsx 形式で flat に書く (Remix v2 flat routes 規約)。

import type { LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData } from '@remix-run/react';
import {
  dashboardLayoutLoader,
  dashboardLayoutHeaders,
  type DashboardLayoutData,
} from '../lib/_kiwa/dashboard-layout-loader.js';

export const loader = async ({ request, params, context }: LoaderFunctionArgs): Promise<Response> => {
  return dashboardLayoutLoader({
    request,
    params: params as Record<string, string>,
    context: context as Record<string, unknown>,
  });
};

export const headers = dashboardLayoutHeaders;

export default function DashboardLayout() {
  const data = useLoaderData<DashboardLayoutData>();
  return (
    <main>
      <h1>kiwa Remix nested route PoC</h1>
      <p>
        signed in: <strong>{data.user.id}</strong> ({data.user.role}) — last visit:{' '}
        <time dateTime={data.lastVisitAt}>{data.lastVisitAt}</time>
      </p>
      <Outlet />
    </main>
  );
}
