// items.ts — 実 Astro API Route (thin wrapper)。
//
// 純粋ロジックは _kiwa/items-endpoint.ts に切り出し、 kiwa の invokeEndpoint で
// direct invoke できるようにしてある。

import type { APIRoute } from 'astro';
import { itemsGetEndpoint, itemsPostEndpoint } from './_kiwa/items-endpoint.js';

export const GET: APIRoute = (context) =>
  itemsGetEndpoint(context as unknown as Parameters<typeof itemsGetEndpoint>[0]);

export const POST: APIRoute = (context) =>
  itemsPostEndpoint(context as unknown as Parameters<typeof itemsPostEndpoint>[0]);
