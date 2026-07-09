import { semantics } from '@kiwa-lab/auth';

type Session = semantics.ContinuousAuthSession;

/**
 * Pattern 1 — startWithBaselineRisk = login 完了直後 の 通常初期化、
 * baseline risk score を 0 (low) に固定して継続監視 開始 の 標準経路。
 */
export function startWithBaselineRisk(input: { timestamp: string }): Session {
  return semantics.startContinuousAuth({
    initialRiskScore: 0,
    monitoringIntervalMs: 60_000,
    timestamp: input.timestamp,
  });
}

/**
 * Pattern 2 — escalateOnRiskSignal = telemetry / hijack detect から新 score を
 * feed して 状態遷移 する 継続経路。 dogfood consumer が periodic evaluator や
 * webhook 受信 で 呼び出す 標準 helper。
 */
export function escalateOnRiskSignal(input: {
  session: Session;
  newScore: number;
  timestamp: string;
}): Session {
  return semantics.evaluateRisk({
    session: input.session,
    newScore: input.newScore,
    timestamp: input.timestamp,
  });
}

/**
 * Pattern 3 — completeStepUpAndDeescalate = step-up-required 状態 で MFA 完了、
 * risk 再評価 で monitoring 復帰まで の 一気 chain。 dogfood consumer が
 * 「MFA 検証成功 → 数分後 risk 再評価」 の 典型 flow を実装する reference。
 */
export function completeStepUpAndDeescalate(input: {
  session: Session;
  postStepUpScore: number;
  stepUpTimestamp: string;
  reEvalTimestamp: string;
}): Session {
  const afterStepUp = semantics.completeStepUp({
    session: input.session,
    timestamp: input.stepUpTimestamp,
  });
  return semantics.evaluateRisk({
    session: afterStepUp,
    newScore: input.postStepUpScore,
    timestamp: input.reEvalTimestamp,
  });
}

/**
 * Pattern 4 — terminateOnHijack = hijack detect signal 受信 で session 完全終了。
 * freezeSession → terminateContinuousAuth の 2 step cascade で write op block +
 * revocation を段階実行、 audit log に freeze / terminate 両 event 残す。
 */
export function terminateOnHijack(input: {
  session: Session;
  hijackReason: string;
  freezeTimestamp: string;
  terminateTimestamp: string;
}): Session {
  const frozen = semantics.freezeSession({
    session: input.session,
    reason: input.hijackReason,
    timestamp: input.freezeTimestamp,
  });
  return semantics.terminateContinuousAuth({
    session: frozen,
    reason: input.hijackReason,
    timestamp: input.terminateTimestamp,
  });
}
