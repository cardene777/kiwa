// api.items.tsx — Remix Resource Route (default component なし)。
//
// loader / action は _kiwa の Resource Route module から re-export する。

import { itemsResourceRoute } from '../lib/_kiwa/items-resource.js';

export const loader = itemsResourceRoute.loader;
export const action = itemsResourceRoute.action;
