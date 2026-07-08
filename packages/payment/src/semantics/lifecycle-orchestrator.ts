/**
 * v2.1 lifecycle-orchestrator = subscription lifecycle + dunning + retry +
 * revenue-recovery + chargeback の 5 axis を 継続合成 する 上位 layer。
 *
 * 既存 5 axis pure state machine の 上に 「subscription が pause → resume →
 * dunning → chargeback dispute → subscription cancel の 相互作用 を 1 state
 * machine で orchestrate する」 layer を追加。 auth v0.7 continuous-auth pattern
 * の Payment 版、 systematic pattern 45 度目 continuous state machine variant
 * を Payment pair に転用。
 *
 * Payment pair v0.1-v0.4 の 4 段深化 + v2.1 で 5 段深化到達、 4 例目 depth-5
 * 発生 SOP 準拠 (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 + Payment
 * v2.1 = 4 例目 depth-5 到達 = pattern 化 「絶対的 rule」 昇格 の 4 例目実証)。
 *
 * shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.4 全て) 変更 0、
 * 新規 file 追加 のみ、 backward compat 絶対維持。
 */

/**
 * lifecycle-orchestrator の 5 state。 subscription lifecycle と revenue-recovery
 * を 統合 した 生命 サイクル SSOT。
 */
export type LifecycleState =
  | 'active-billing'      // 通常課金中、 全 signal 監視 active
  | 'grace-period'        // 支払い失敗直後、 dunning trigger 待ち
  | 'dunning-active'      // dunning cascade 実行中 (email/SMS/retry)
  | 'chargeback-dispute'  // chargeback 発生、 dispute 対応中
  | 'canceled';           // subscription 完全終了 (voluntary or involuntary)

/** 遷移 trigger event、 evaluate 経路 で 使う。 */
export type LifecycleEvent =
  | 'payment-succeeded'
  | 'payment-failed'
  | 'dunning-succeeded'
  | 'dunning-exhausted'
  | 'chargeback-filed'
  | 'chargeback-won'
  | 'chargeback-lost'
  | 'user-canceled';

export interface LifecycleSession {
  state: LifecycleState;
  billingCyclesCompleted: number;
  failedAttemptCount: number;
  dunningRoundsExecuted: number;
  chargebacksDisputed: number;
  lastEventAt: string;
  events: string[];
}

/**
 * lifecycle orchestrator の 開始。 default で active-billing 状態、
 * subscription 契約成立直後 に 呼出。
 */
export function startLifecycle(input: { timestamp: string }): LifecycleSession {
  return {
    state: 'active-billing',
    billingCyclesCompleted: 0,
    failedAttemptCount: 0,
    dunningRoundsExecuted: 0,
    chargebacksDisputed: 0,
    lastEventAt: input.timestamp,
    events: ['lifecycle-started'],
  };
}

/**
 * event driven state 遷移 SSOT。 5 state × 8 event = 40 セル の 遷移 表を
 * 1 switch で 実装。 無効遷移 は 現 state を保持 + events log に "invalid"
 * 記録 (throw ではなく soft-reject、 v0.7 continuous-auth の guard-throw と
 * 区別 = payment 経路 は event 過剰受信 が normal で、 throw だと dogfood
 * consumer が 例外処理 に多くの コード を割く 必要が出るため soft-reject)。
 */
export function handleEvent(input: {
  session: LifecycleSession;
  event: LifecycleEvent;
  timestamp: string;
}): LifecycleSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'active-billing': {
      if (event === 'payment-succeeded') {
        return { ...base, billingCyclesCompleted: session.billingCyclesCompleted + 1 };
      }
      if (event === 'payment-failed') {
        return {
          ...base,
          state: 'grace-period',
          failedAttemptCount: session.failedAttemptCount + 1,
        };
      }
      if (event === 'chargeback-filed') {
        return {
          ...base,
          state: 'chargeback-dispute',
          chargebacksDisputed: session.chargebacksDisputed + 1,
        };
      }
      if (event === 'user-canceled') {
        return { ...base, state: 'canceled' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'grace-period': {
      if (event === 'payment-succeeded') {
        return {
          ...base,
          state: 'active-billing',
          billingCyclesCompleted: session.billingCyclesCompleted + 1,
        };
      }
      if (event === 'payment-failed') {
        return {
          ...base,
          state: 'dunning-active',
          dunningRoundsExecuted: session.dunningRoundsExecuted + 1,
        };
      }
      if (event === 'user-canceled') {
        return { ...base, state: 'canceled' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'dunning-active': {
      if (event === 'dunning-succeeded') {
        return { ...base, state: 'active-billing' };
      }
      if (event === 'dunning-exhausted') {
        return { ...base, state: 'canceled' };
      }
      if (event === 'chargeback-filed') {
        return {
          ...base,
          state: 'chargeback-dispute',
          chargebacksDisputed: session.chargebacksDisputed + 1,
        };
      }
      if (event === 'user-canceled') {
        return { ...base, state: 'canceled' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'chargeback-dispute': {
      if (event === 'chargeback-won') {
        return { ...base, state: 'active-billing' };
      }
      if (event === 'chargeback-lost') {
        return { ...base, state: 'canceled' };
      }
      if (event === 'user-canceled') {
        return { ...base, state: 'canceled' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'canceled': {
      // terminal state、 全 event は soft-reject
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

/**
 * lifecycle の 統計サマリー生成、 dogfood consumer が 監視 dashboard で
 * 出力する 用途。 total events 数 + valid event 数 + 遷移 経路 の hash。
 */
export interface LifecycleSummary {
  currentState: LifecycleState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  cyclesCompleted: number;
  chargebacksDisputed: number;
}

export function summarizeLifecycle(session: LifecycleSession): LifecycleSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    cyclesCompleted: session.billingCyclesCompleted,
    chargebacksDisputed: session.chargebacksDisputed,
  };
}
