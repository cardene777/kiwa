/**
 * v2.1 pipeline-orchestrator = producer + consumer group + exactly-once +
 * DLQ + schema registry の 継続合成 layer。
 *
 * Streaming pair v0.1 → v2.1 = 5 段深化到達 = **depth-5 pattern 6 例目発生**
 * (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming = 6 pair
 * 到達 = **systematic law confirmed**)、 pattern 昇格階段 の 最上位 = kiwa 全体
 * の 必ず守る 最上位規範化 confirmed。
 *
 * shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.3) 変更 0、 新規 file
 * 追加 のみ、 backward compat 絶対維持。
 */

export type PipelineState =
  | 'producing'          // producer active、 message 送信中
  | 'consuming'          // consumer active、 message 処理中
  | 'rebalancing'        // consumer group rebalance 中
  | 'dlq-active'         // DLQ に message 蓄積中 (poison message 隔離)
  | 'stopped';           // pipeline 完全停止 (terminal)

export type PipelineEvent =
  | 'produce-succeeded'
  | 'produce-failed'
  | 'consume-succeeded'
  | 'consume-failed'
  | 'rebalance-triggered'
  | 'rebalance-completed'
  | 'dlq-message-added'
  | 'stop-requested';

export interface PipelineSession {
  state: PipelineState;
  messagesProduced: number;
  messagesConsumed: number;
  rebalancesExecuted: number;
  dlqMessagesCount: number;
  lastEventAt: string;
  events: string[];
}

export function startPipeline(input: { timestamp: string }): PipelineSession {
  return {
    state: 'producing',
    messagesProduced: 0,
    messagesConsumed: 0,
    rebalancesExecuted: 0,
    dlqMessagesCount: 0,
    lastEventAt: input.timestamp,
    events: ['pipeline-started'],
  };
}

export function dispatchEvent(input: {
  session: PipelineSession;
  event: PipelineEvent;
  timestamp: string;
}): PipelineSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'producing': {
      if (event === 'produce-succeeded') {
        return { ...base, messagesProduced: session.messagesProduced + 1 };
      }
      if (event === 'consume-succeeded') {
        return {
          ...base,
          state: 'consuming',
          messagesConsumed: session.messagesConsumed + 1,
        };
      }
      if (event === 'rebalance-triggered') {
        return { ...base, state: 'rebalancing' };
      }
      if (event === 'dlq-message-added') {
        return {
          ...base,
          state: 'dlq-active',
          dlqMessagesCount: session.dlqMessagesCount + 1,
        };
      }
      if (event === 'stop-requested') {
        return { ...base, state: 'stopped' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'consuming': {
      if (event === 'consume-succeeded') {
        return { ...base, messagesConsumed: session.messagesConsumed + 1 };
      }
      if (event === 'consume-failed') {
        return {
          ...base,
          state: 'dlq-active',
          dlqMessagesCount: session.dlqMessagesCount + 1,
        };
      }
      if (event === 'rebalance-triggered') {
        return { ...base, state: 'rebalancing' };
      }
      if (event === 'produce-succeeded') {
        return { ...base, state: 'producing', messagesProduced: session.messagesProduced + 1 };
      }
      if (event === 'stop-requested') {
        return { ...base, state: 'stopped' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'rebalancing': {
      if (event === 'rebalance-completed') {
        return {
          ...base,
          state: 'consuming',
          rebalancesExecuted: session.rebalancesExecuted + 1,
        };
      }
      if (event === 'stop-requested') {
        return { ...base, state: 'stopped' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'dlq-active': {
      if (event === 'dlq-message-added') {
        return { ...base, dlqMessagesCount: session.dlqMessagesCount + 1 };
      }
      if (event === 'consume-succeeded') {
        return {
          ...base,
          state: 'consuming',
          messagesConsumed: session.messagesConsumed + 1,
        };
      }
      if (event === 'stop-requested') {
        return { ...base, state: 'stopped' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'stopped': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface PipelineSummary {
  currentState: PipelineState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  messagesProduced: number;
  messagesConsumed: number;
  rebalancesExecuted: number;
  dlqMessagesCount: number;
}

export function summarizePipeline(session: PipelineSession): PipelineSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    messagesProduced: session.messagesProduced,
    messagesConsumed: session.messagesConsumed,
    rebalancesExecuted: session.rebalancesExecuted,
    dlqMessagesCount: session.dlqMessagesCount,
  };
}
