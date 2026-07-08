/**
 * Provider-neutral passwordless UX surface for the
 * dogfood-auth-passwordless-ux-app.
 *
 * 12-op contract — 3 axes × 4 ops (device-bound / conditional-ui / cross-device).
 */

import type { AuthPlatform as AuthAuthPlatform } from '@kiwa/auth';
export type AuthPlatform = AuthAuthPlatform;

export type UxStage = 'device-bound' | 'conditional-ui' | 'cross-device';

export interface UxSession {
  sessionId: string;
  platform: AuthPlatform;
  userId: string;
}

export interface UxStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface AuthPasswordlessAdapter {
  // device-bound axis
  startDeviceBound: (input: {
    platform: AuthPlatform;
    userId: string;
    credentialId: string;
    deviceId: string;
  }) => Promise<UxSession>;
  bindDevice: (session: UxSession, input: { deviceId: string }) => Promise<UxStep>;
  verifyBinding: (session: UxSession) => Promise<UxStep>;
  closeDeviceBound: (session: UxSession) => Promise<void>;
  // conditional-ui axis
  startConditionalUiFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    formId: string;
  }) => Promise<UxSession>;
  showAutofillHint: (session: UxSession) => Promise<UxStep>;
  completeAutofill: (
    session: UxSession,
    input: { credentialId: string; elapsedMs: number },
  ) => Promise<UxStep>;
  closeConditionalUi: (session: UxSession) => Promise<void>;
  // cross-device axis
  startCrossDeviceFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    requestId: string;
  }) => Promise<UxSession>;
  emitQrForCrossDevice: (
    session: UxSession,
    input: { qrPayload: string },
  ) => Promise<UxStep>;
  completeCrossDevice: (
    session: UxSession,
    input: { assertionSignature: string },
  ) => Promise<UxStep>;
  closeCrossDevice: (session: UxSession) => Promise<void>;
}
