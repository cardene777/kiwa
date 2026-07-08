import type { AuthPlatform as AuthAuthPlatform } from '@kiwa/auth';
export type AuthPlatform = AuthAuthPlatform;

export type RiskStage = 'risk' | 'telemetry' | 'hijack';

export interface RiskSession {
  sessionId: string;
  platform: AuthPlatform;
  userId: string;
}

export interface RiskStep {
  op: string;
  outcome: 'success' | 'env-missing' | 'error';
  metadata: Record<string, string | number | boolean>;
}

export interface RiskAdapter {
  // risk axis
  startRiskFlow: (input: {
    platform: AuthPlatform;
    userId: string;
  }) => Promise<RiskSession>;
  evaluateScoreOp: (
    session: RiskSession,
    input: {
      deviceScore: number;
      ipReputation: number;
      geoAnomaly: number;
      velocityScore: number;
      behavioralScore: number;
    },
  ) => Promise<RiskStep>;
  applyPolicyOp: (session: RiskSession) => Promise<RiskStep>;
  closeRisk: (session: RiskSession) => Promise<void>;
  // telemetry axis
  startTelemetryFlow: (input: {
    platform: AuthPlatform;
    userId: string;
    endpointId: string;
  }) => Promise<RiskSession>;
  recordAttemptOp: (
    session: RiskSession,
    input: { success: boolean; latencyMs: number },
  ) => Promise<RiskStep>;
  detectAbuseOp: (
    session: RiskSession,
    input: { failureRateThreshold: number; ipAddress: string },
  ) => Promise<RiskStep>;
  closeTelemetry: (session: RiskSession) => Promise<void>;
  // hijack axis (concurrent + geo variant)
  startConcurrentWatch: (input: {
    platform: AuthPlatform;
    userId: string;
    baselineRegion: string;
  }) => Promise<RiskSession>;
  reportGeoAnomalyOp: (
    session: RiskSession,
    input: { observedRegion: string; km: number; withinMinutes: number },
  ) => Promise<RiskStep>;
  reportConcurrentOp: (
    session: RiskSession,
    input: { concurrentSessionCount: number },
  ) => Promise<RiskStep>;
  closeConcurrentWatch: (session: RiskSession) => Promise<void>;
}
