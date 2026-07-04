/**
 * `/introspect` route handler shell.
 *
 * RFC 7662 §2.2 mandates unknown / expired / revoked tokens return
 * `{active: false}`. The delegate catches AS-side rejections and
 * returns the sentinel so the resource server sees a stable shape.
 */

import type { IntrospectionResponse } from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';

export function createIntrospectHandler(
  adapter: OAuth21ASAdapter,
): (token: string) => IntrospectionResponse {
  return function introspect(token: string): IntrospectionResponse {
    try {
      return adapter.introspect(token);
    } catch {
      return { active: false };
    }
  };
}
