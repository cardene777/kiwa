import { providerEventName, type AxisStep, type ComponentTarget } from './types.js';

export type FormActionState = 'idle' | 'pending' | 'optimistic' | 'enhanced' | 'resolved' | 'rejected';

export interface FormActionSession<TForm extends Record<string, unknown> = Record<string, unknown>> {
  target: ComponentTarget;
  formId: string;
  state: FormActionState;
  form: TForm;
  optimisticPatches: Array<Partial<TForm>>;
  enhanced: boolean;
  history: AxisStep<FormActionState>[];
  error: string | null;
}

export function startFormActionSession<TForm extends Record<string, unknown>>(input: {
  target: ComponentTarget;
  formId: string;
  initial: TForm;
}): FormActionSession<TForm> {
  if (input.formId.length === 0) {
    throw new Error('startFormActionSession: formId must not be empty');
  }
  return {
    target: input.target,
    formId: input.formId,
    state: 'idle',
    form: { ...input.initial },
    optimisticPatches: [],
    enhanced: false,
    history: [],
    error: null,
  };
}

export function markFormStatusPending<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  submitter: string,
): AxisStep<FormActionState> {
  if (session.state === 'pending') {
    throw new Error('markFormStatusPending: form is already pending');
  }
  session.state = 'pending';
  return emit(session, 'form.status_pending', { submitter });
}

export function applyOptimisticUpdate<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  patch: Partial<TForm>,
): AxisStep<FormActionState> {
  if (session.state !== 'pending' && session.state !== 'optimistic') {
    throw new Error(`applyOptimisticUpdate: session is ${session.state}, not pending`);
  }
  session.state = 'optimistic';
  session.optimisticPatches.push(patch);
  session.form = { ...session.form, ...patch };
  return emit(session, 'form.optimistic_applied', {
    patchKeys: Object.keys(patch).join(','),
    patchCount: session.optimisticPatches.length,
  });
}

export function enableProgressiveEnhancement<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  input: { method?: 'post' | 'get'; actionUrl: string },
): AxisStep<FormActionState> {
  if (input.actionUrl.length === 0) {
    throw new Error('enableProgressiveEnhancement: actionUrl must not be empty');
  }
  session.enhanced = true;
  session.state = 'enhanced';
  return emit(session, 'form.progressive_enhanced', {
    method: input.method ?? 'post',
    actionUrl: input.actionUrl,
  });
}

export function resolveFormAction<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  result: Partial<TForm>,
): AxisStep<FormActionState> {
  if (session.state === 'idle') {
    throw new Error('resolveFormAction: action was not submitted');
  }
  session.state = 'resolved';
  session.form = { ...session.form, ...result };
  return emit(session, 'form.action_resolved', {
    resultKeys: Object.keys(result).join(','),
    enhanced: session.enhanced,
  });
}

export function rejectFormAction<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  error: Error | string,
): AxisStep<FormActionState> {
  if (session.state === 'resolved') {
    throw new Error('rejectFormAction: resolved action cannot reject');
  }
  session.state = 'rejected';
  session.error = typeof error === 'string' ? error : error.message;
  return emit(session, 'form.action_resolved', {
    rejected: true,
    error: session.error,
  });
}

function emit<TForm extends Record<string, unknown>>(
  session: FormActionSession<TForm>,
  neutralEvent: AxisStep<FormActionState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<FormActionState> {
  const step: AxisStep<FormActionState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    amountCents: 0,
    metadata: { target: session.target, formId: session.formId, ...metadata },
  };
  session.history.push(step);
  return step;
}
