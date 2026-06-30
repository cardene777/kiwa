// counter.ts — 実 Astro API Route (thin wrapper)。

import type { APIRoute } from 'astro';
import { counterGetEndpoint, counterPostEndpoint } from './_kiwa/counter-endpoint.js';

export const GET: APIRoute = (context) =>
  counterGetEndpoint(context as unknown as Parameters<typeof counterGetEndpoint>[0]);

export const POST: APIRoute = (context) =>
  counterPostEndpoint(context as unknown as Parameters<typeof counterPostEndpoint>[0]);
