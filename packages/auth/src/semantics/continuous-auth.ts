/**
 * v0.7 continuous-auth = 「session 生存中に risk score を 動的評価 して
 * session lifetime + step-up trigger を 動的調整」 する pure state machine。
 *
 * v0.6 の Passwordless UX III 8 axis (risk-based-auth + auth-continuity +
 * session-hijack-detect 等) の 上位 layer として、 それぞれ 独立に 動いていた
 * 3 axis を 「継続的に 合成する」 経路。 3 axis は そのまま 保持、 新規
 * continuous-auth layer で 統合判定 のみ 追加 = shape 契約 preserving。
 *
 * v1.21-v1.22 の 縦深化 pair 第 1 pair (Auth v0.4 → real driver) に続く、
 * v2.2 で depth-7 到達 = Desktop v1.67 の depth-6 candidate と 独立に
 * 進行する Auth pair pioneer record 更新。
 *
 * shape 契約 preserving 絶対維持 = 既存 8 axis semantics 触らず、 新規
 * file の 追加 のみ、 v0.1-v0.6 API 変更 0、 backward compat 絶対維持。
 */

/** continuous-auth 状態遷移 の 5 state。 */
export type ContinuousAuthState =
  | 'monitoring'      // 通常 監視、 risk score 定期評価中
  | 'elevated'        // risk score 上昇、 more frequent 監視
  | 'step-up-required' // step-up MFA 要求中
  | 'session-frozen'  // session 一時凍結 (write op のみ block)
  | 'terminated';     // session 完全終了

/** risk score の 3 段階 category、 evaluateRisk が返す判定単位。 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** continuous-auth session の 状態 envelope。 */
export interface ContinuousAuthSession {
  state: ContinuousAuthState;
  currentRiskLevel: RiskLevel;
  currentRiskScore: number;         // 0.0-1.0、 1.0 が 最大 risk
  monitoringIntervalMs: number;     // 次 評価 までの ms
  stepUpTriggeredCount: number;     // session 生存中 に step-up MFA 発火した回数
  lastEvaluatedAt: string;          // ISO 8601
  events: string[];                 // 状態遷移 log (test verify 用)
}

/**
 * continuous-auth の 監視 開始。 initial risk score を 0 (low) で 初期化、
 * 通常 監視 interval (default 60_000ms = 1 分) で monitoring 状態 に入る。
 */
export function startContinuousAuth(input: {
  initialRiskScore?: number;
  monitoringIntervalMs?: number;
  timestamp: string;
}): ContinuousAuthSession {
  const score = input.initialRiskScore ?? 0;
  return {
    state: 'monitoring',
    currentRiskLevel: scoreToLevel(score),
    currentRiskScore: score,
    monitoringIntervalMs: input.monitoringIntervalMs ?? 60_000,
    stepUpTriggeredCount: 0,
    lastEvaluatedAt: input.timestamp,
    events: ['continuous-auth-started'],
  };
}

/**
 * risk score から level を 判定 する SSOT helper。 v0.6 risk-based-auth と
 * 同じ 4 段階 category、 boundary は inclusive lower。
 * low = [0, 0.3), medium = [0.3, 0.6), high = [0.6, 0.85), critical = [0.85, 1.0]
 */
export function scoreToLevel(score: number): RiskLevel {
  if (score < 0.3) return 'low';
  if (score < 0.6) return 'medium';
  if (score < 0.85) return 'high';
  return 'critical';
}

/**
 * 定期評価。 新 score が 現行 level と 異なる級 に 上がった / 下がった時の
 * 状態遷移 SSOT。 low/medium → monitoring、 high → elevated、 critical →
 * step-up-required に 状態を遷移させる。 timestamp 更新 は 常に 行う。
 */
export function evaluateRisk(input: {
  session: ContinuousAuthSession;
  newScore: number;
  timestamp: string;
}): ContinuousAuthSession {
  const newLevel = scoreToLevel(input.newScore);
  const events = [...input.session.events, `risk-evaluated:${newLevel}:${input.newScore.toFixed(2)}`];
  const nextState: ContinuousAuthState =
    newLevel === 'critical'
      ? 'step-up-required'
      : newLevel === 'high'
        ? 'elevated'
        : 'monitoring';
  // elevated 状態 の monitoring interval は 通常 の 1/4 = 15_000ms、
  // それ以外 の state (monitoring / step-up-required) は 60_000ms に復元。
  const nextInterval = nextState === 'elevated' ? 15_000 : 60_000;
  return {
    ...input.session,
    state: nextState,
    currentRiskLevel: newLevel,
    currentRiskScore: input.newScore,
    monitoringIntervalMs: nextInterval,
    lastEvaluatedAt: input.timestamp,
    events,
  };
}

/**
 * step-up MFA 発火。 step-up-required 状態 で 呼び出され、 step-up 完了で
 * elevated 状態 に降格 (通常 monitoring への 完全復帰 は risk score 低下
 * を 待つ = evaluateRisk で monitoring に 遷移)。 stepUpTriggeredCount 加算。
 */
export function completeStepUp(input: {
  session: ContinuousAuthSession;
  timestamp: string;
}): ContinuousAuthSession {
  if (input.session.state !== 'step-up-required') {
    throw new Error(
      `continuous-auth: cannot complete step-up from state "${input.session.state}" (must be step-up-required)`,
    );
  }
  return {
    ...input.session,
    state: 'elevated',
    stepUpTriggeredCount: input.session.stepUpTriggeredCount + 1,
    lastEvaluatedAt: input.timestamp,
    events: [...input.session.events, 'step-up-completed'],
  };
}

/**
 * session 一時凍結。 write op を block する状態 に 遷移、 read op は継続可。
 * critical risk 検知 + step-up 拒否 の 組合せ で 発火経路、 通常経路は
 * step-up-required → completeStepUp で elevated に戻るのが standard。
 */
export function freezeSession(input: {
  session: ContinuousAuthSession;
  reason: string;
  timestamp: string;
}): ContinuousAuthSession {
  return {
    ...input.session,
    state: 'session-frozen',
    lastEvaluatedAt: input.timestamp,
    events: [...input.session.events, `session-frozen:${input.reason}`],
  };
}

/**
 * session 終了。 terminated 状態 = 完全 revocation、 以降 の event は 全 reject。
 * hijack detect + critical risk + step-up 失敗 の cascade 発火経路。
 */
export function terminateContinuousAuth(input: {
  session: ContinuousAuthSession;
  reason: string;
  timestamp: string;
}): ContinuousAuthSession {
  return {
    ...input.session,
    state: 'terminated',
    lastEvaluatedAt: input.timestamp,
    events: [...input.session.events, `terminated:${input.reason}`],
  };
}
