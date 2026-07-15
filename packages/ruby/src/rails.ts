import type { RubyAppEnv, RubyRequest, RubyResponse } from './env.js';

export const RAILS_REDIRECT_SYMBOL = Symbol('rails.redirect');

export interface RailsRedirectSignal {
  readonly [RAILS_REDIRECT_SYMBOL]: true;
  url: string;
  status: number;
}

export interface RailsRenderCall {
  template?: string;
  json?: unknown;
  text?: string;
  status: number;
}

export interface RailsControllerAction {
  render?: (call: Omit<RailsRenderCall, 'status'> & { status?: number }) => RubyResponse;
  redirectTo?: (url: string, status?: number) => never;
  beforeActions?: Array<(req: RubyRequest, env: RubyAppEnv) => void | Promise<void>>;
  action: (req: RubyRequest, env: RubyAppEnv) => RubyResponse | Promise<RubyResponse>;
}

export interface RailsDispatchResult {
  response: RubyResponse;
  redirect?: RailsRedirectSignal;
  renderCalls: RailsRenderCall[];
  beforeActionCount: number;
}

/**
 * Rails controller の dispatch simulation。 before_action → action → render の chain を
 * 順に走らせ、 redirect_to() 相当は throw で捕捉する。 実 Rails の render 経路 (json / text /
 * partial) を統一 shape で捕捉して assertion 用に露出する。
 */
export async function dispatchRailsRequest(
  env: RubyAppEnv,
  req: RubyRequest,
  controller: RailsControllerAction,
): Promise<RailsDispatchResult> {
  const renderCalls: RailsRenderCall[] = [];
  let beforeActionCount = 0;

  for (const before of controller.beforeActions ?? []) {
    await before(req, env);
    beforeActionCount += 1;
  }

  try {
    const response = await controller.action(req, env);
    const result: RailsDispatchResult = { response, renderCalls, beforeActionCount };
    return result;
  } catch (e) {
    if (isRailsRedirect(e)) {
      const response: RubyResponse = {
        status: e.status,
        body: '',
        headers: { location: e.url },
        cookies: { ...env.cookies },
        session: { ...env.session },
      };
      return { response, redirect: e, renderCalls, beforeActionCount };
    }
    throw e;
  }
}

function isRailsRedirect(v: unknown): v is RailsRedirectSignal {
  return typeof v === 'object' && v !== null && (v as Record<symbol, unknown>)[RAILS_REDIRECT_SYMBOL] === true;
}
