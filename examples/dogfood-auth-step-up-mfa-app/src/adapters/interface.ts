import type { AuthPlatform as AuthAuthPlatform } from '@kiwa-test/auth';
export type AuthPlatform = AuthAuthPlatform;

export type MfaStage = 'step-up' | 'continuity' | 'hijack';

export interface MfaSession {
  sessionId: string;
  platform: AuthPlatform;
  userId: string;
}

export interface MfaStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface AuthStepUpAdapter {
  // step-up axis
  startStepUpFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    currentAal: 'AAL1' | 'AAL2' | 'AAL3';
  }) => Promise<MfaSession>;
  escalateTo: (
    session: MfaSession,
    input: { requiredAal: 'AAL2' | 'AAL3' },
  ) => Promise<MfaStep>;
  satisfyFactor: (
    session: MfaSession,
    input: { level: 'AAL2' | 'AAL3'; factor: string; nowMs: number },
  ) => Promise<MfaStep>;
  closeStepUp: (session: MfaSession) => Promise<void>;
  // continuity axis
  startContinuityFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    refreshToken: string;
    expiresAtMs: number;
  }) => Promise<MfaSession>;
  reauthSeamlessly: (session: MfaSession, input: { nowMs: number }) => Promise<MfaStep>;
  rotateRefreshToken: (
    session: MfaSession,
    input: { newToken: string; nowMs: number },
  ) => Promise<MfaStep>;
  closeContinuity: (session: MfaSession) => Promise<void>;
  // hijack axis
  startHijackWatchFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    baselineFingerprint: string;
    baselineRegion: string;
  }) => Promise<MfaSession>;
  reportDrift: (
    session: MfaSession,
    input: { observedFingerprint: string; distance: number },
  ) => Promise<MfaStep>;
  cascadeLogout: (
    session: MfaSession,
    input: { revokedSessionIds: string[] },
  ) => Promise<MfaStep>;
  closeHijackWatch: (session: MfaSession) => Promise<void>;
}
