import type { RubyAppEnv, RubyRequest, RubyResponse } from './env.js';

export interface GenericDispatchResult {
  response: RubyResponse;
  matched: boolean;
  framework: RubyAppEnv['framework'];
}

/**
 * Sinatra / Roda / Hanami の統一 request dispatch。 routes を lookup し、 matched なら
 * handler 実行、 unmatched なら 404 相当 default response を返す。
 */
export async function dispatchGenericRequest(
  env: RubyAppEnv,
  req: RubyRequest,
): Promise<GenericDispatchResult> {
  const route = env.matchRoute(req.method, req.path);
  if (!route) {
    const response: RubyResponse = {
      status: 404,
      body: 'Not Found',
      headers: { 'content-type': 'text/plain' },
      cookies: { ...env.cookies },
      session: { ...env.session },
    };
    return { response, matched: false, framework: env.framework };
  }
  const response = await route.handler(req, env);
  return { response, matched: true, framework: env.framework };
}
