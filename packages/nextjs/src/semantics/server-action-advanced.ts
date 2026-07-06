import { providerEventName, type AxisStep, type NextTarget } from './types.js';

export type ServerActionAdvancedState =
  | 'idle'
  | 'submitted'
  | 'path-revalidated'
  | 'tag-revalidated'
  | 'redirected';

export interface ServerActionAdvancedSession {
  target: NextTarget;
  actionId: string;
  state: ServerActionAdvancedState;
  form: Record<string, string>;
  revalidatedPaths: string[];
  revalidatedTags: string[];
  redirectUrl: string | null;
  history: AxisStep<ServerActionAdvancedState>[];
}

export function startServerActionAdvanced(input: {
  target: NextTarget;
  actionId: string;
}): ServerActionAdvancedSession {
  if (input.actionId.length === 0) {
    throw new Error('startServerActionAdvanced: actionId must not be empty');
  }
  return {
    target: input.target,
    actionId: input.actionId,
    state: 'idle',
    form: {},
    revalidatedPaths: [],
    revalidatedTags: [],
    redirectUrl: null,
    history: [],
  };
}

export function submitFormAction(
  session: ServerActionAdvancedSession,
  form: Record<string, string>,
): AxisStep<ServerActionAdvancedState> {
  if (session.state !== 'idle') {
    throw new Error(`submitFormAction: session is ${session.state}, not idle`);
  }
  session.state = 'submitted';
  session.form = { ...form };
  return emit(session, 'action.form_submitted', {
    fields: Object.keys(form).join(','),
    fieldCount: Object.keys(form).length,
  });
}

export function revalidateActionPath(
  session: ServerActionAdvancedSession,
  path: string,
): AxisStep<ServerActionAdvancedState> {
  if (session.state === 'idle') {
    throw new Error('revalidateActionPath: form action was not submitted');
  }
  if (!path.startsWith('/')) {
    throw new Error('revalidateActionPath: path must start with /');
  }
  session.state = 'path-revalidated';
  session.revalidatedPaths.push(path);
  return emit(session, 'action.revalidate_path', { path, count: session.revalidatedPaths.length });
}

export function revalidateActionTag(
  session: ServerActionAdvancedSession,
  tag: string,
): AxisStep<ServerActionAdvancedState> {
  if (session.state === 'idle') {
    throw new Error('revalidateActionTag: form action was not submitted');
  }
  if (tag.length === 0) {
    throw new Error('revalidateActionTag: tag must not be empty');
  }
  session.state = 'tag-revalidated';
  session.revalidatedTags.push(tag);
  return emit(session, 'action.revalidate_tag', { tag, count: session.revalidatedTags.length });
}

export function redirectAction(
  session: ServerActionAdvancedSession,
  url: string,
): AxisStep<ServerActionAdvancedState> {
  if (session.state === 'idle') {
    throw new Error('redirectAction: form action was not submitted');
  }
  if (url.length === 0) {
    throw new Error('redirectAction: url must not be empty');
  }
  session.state = 'redirected';
  session.redirectUrl = url;
  return emit(session, 'action.redirected', { url });
}

function emit(
  session: ServerActionAdvancedSession,
  neutralEvent: AxisStep<ServerActionAdvancedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ServerActionAdvancedState> {
  const step: AxisStep<ServerActionAdvancedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, actionId: session.actionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
