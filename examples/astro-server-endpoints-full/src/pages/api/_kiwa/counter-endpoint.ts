// counter-endpoint.ts — multi-method (GET / POST) endpoint + locals injection demo。
//
// /api/counter は context.locals.requestId (middleware で注入される想定) を読んで
// response header に echo する pattern を示し、 invokeEndpoint で locals を seed
// する流れを demo する。

import type { APIRoute } from '@kiwa-lab/astro';

interface CounterState {
  count: number;
}
const state: CounterState = { count: 0 };

export function resetCounterState(value = 0): void {
  state.count = value;
}

export const counterGetEndpoint: APIRoute = async (context) => {
  const requestId = typeof context.locals.requestId === 'string' ? context.locals.requestId : 'unknown';
  return new Response(JSON.stringify({ count: state.count }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-request-id': requestId,
    },
  });
};

export const counterPostEndpoint: APIRoute = async (context) => {
  const requestId = typeof context.locals.requestId === 'string' ? context.locals.requestId : 'unknown';
  const formData = await context.request.formData();
  const deltaRaw = (formData.get('delta') ?? '').toString().trim();
  const delta = Number.parseInt(deltaRaw, 10);
  if (!Number.isFinite(delta)) {
    return new Response(JSON.stringify({ field: 'delta', message: 'delta must be an integer' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  state.count += delta;
  return new Response(JSON.stringify({ count: state.count }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'x-request-id': requestId,
    },
  });
};
