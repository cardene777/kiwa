import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Conditional UI axis — WebAuthn L3 conditional mediation (`mediation:
 * "conditional"`) + autofill hint + fallback ladder + timeout. When user
 * focuses a form field with `autocomplete="username webauthn"`, the browser
 * silently offers passkeys inline without a modal dialog.
 */
export type ConditionalUiState =
  | 'idle'
  | 'hint-shown'
  | 'autofill-selected'
  | 'fallback-triggered'
  | 'timeout-exceeded';

export interface ConditionalUiSession {
  platform: AuthPlatform;
  formId: string;
  timeoutMs: number;
  elapsedMs: number;
  state: ConditionalUiState;
  history: AxisStep<ConditionalUiState>[];
}

export function startConditionalUi(input: {
  platform: AuthPlatform;
  formId: string;
  timeoutMs?: number;
}): ConditionalUiSession {
  return {
    platform: input.platform,
    formId: input.formId,
    timeoutMs: input.timeoutMs ?? 60_000,
    elapsedMs: 0,
    state: 'idle',
    history: [],
  };
}

export function showHint(session: ConditionalUiSession): AxisStep<ConditionalUiState> {
  if (session.state !== 'idle') {
    throw new Error(`showHint: session is ${session.state}, expected idle`);
  }
  session.state = 'hint-shown';
  const step: AxisStep<ConditionalUiState> = {
    neutralEvent: 'conditional-ui.hint-shown',
    platformEvent: platformEventName(session.platform, 'conditional-ui.hint-shown'),
    state: 'hint-shown',
    platform: session.platform,
    metadata: { formId: session.formId, timeoutMs: session.timeoutMs },
  };
  session.history.push(step);
  return step;
}

export function selectAutofill(
  session: ConditionalUiSession,
  input: { credentialId: string; elapsedMs: number },
): AxisStep<ConditionalUiState> {
  if (session.state !== 'hint-shown') {
    throw new Error(`selectAutofill: session is ${session.state}, expected hint-shown`);
  }
  session.elapsedMs = input.elapsedMs;
  session.state = 'autofill-selected';
  const step: AxisStep<ConditionalUiState> = {
    neutralEvent: 'conditional-ui.autofill-selected',
    platformEvent: platformEventName(session.platform, 'conditional-ui.autofill-selected'),
    state: 'autofill-selected',
    platform: session.platform,
    metadata: {
      formId: session.formId,
      credentialId: input.credentialId,
      elapsedMs: input.elapsedMs,
    },
  };
  session.history.push(step);
  return step;
}

export function triggerFallback(
  session: ConditionalUiSession,
  input: { reason: string; elapsedMs: number },
): AxisStep<ConditionalUiState> {
  if (session.state !== 'hint-shown') {
    throw new Error(`triggerFallback: session is ${session.state}, expected hint-shown`);
  }
  session.elapsedMs = input.elapsedMs;
  session.state = 'fallback-triggered';
  const step: AxisStep<ConditionalUiState> = {
    neutralEvent: 'conditional-ui.fallback-triggered',
    platformEvent: platformEventName(session.platform, 'conditional-ui.fallback-triggered'),
    state: 'fallback-triggered',
    platform: session.platform,
    metadata: {
      formId: session.formId,
      reason: input.reason,
      elapsedMs: input.elapsedMs,
    },
  };
  session.history.push(step);
  return step;
}

export function markTimeout(
  session: ConditionalUiSession,
  input: { nowMs: number },
): AxisStep<ConditionalUiState> {
  if (session.state !== 'hint-shown') {
    throw new Error(`markTimeout: session is ${session.state}, expected hint-shown`);
  }
  if (input.nowMs < session.timeoutMs) {
    throw new Error(`markTimeout: nowMs ${input.nowMs} < timeoutMs ${session.timeoutMs}`);
  }
  session.elapsedMs = input.nowMs;
  session.state = 'timeout-exceeded';
  const step: AxisStep<ConditionalUiState> = {
    neutralEvent: 'conditional-ui.timeout-exceeded',
    platformEvent: platformEventName(session.platform, 'conditional-ui.timeout-exceeded'),
    state: 'timeout-exceeded',
    platform: session.platform,
    metadata: { formId: session.formId, nowMs: input.nowMs, timeoutMs: session.timeoutMs },
  };
  session.history.push(step);
  return step;
}
