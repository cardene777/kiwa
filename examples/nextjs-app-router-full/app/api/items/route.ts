// route.ts — 実 Next.js Route Handler thin wrapper。
//
// pure handler は _kiwa/route-handler.ts に切り出し、 Vitest から fetch API
// 互換で direct invoke できる (Request → Response の純粋 function)。

import { itemsGetHandler } from './_kiwa/route-handler';

export async function GET(request: Request): Promise<Response> {
  return itemsGetHandler(request);
}
