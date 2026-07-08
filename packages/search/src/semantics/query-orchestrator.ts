/**
 * v2.1 query-orchestrator = query DSL + faceted + semantic + geo + relevance
 * の 継続合成 layer。
 *
 * Search pair v0.1 → v2.1 = 5 段深化到達 = **depth-5 pattern 7 例目発生**
 * (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming +
 * Search = 7 pair 到達 = systematic law 継続強化 = 6 pair confirmed 後 の
 * 7 例目適用実証)。
 *
 * shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.3) 変更 0、 新規 file
 * 追加 のみ、 systematic pattern 49 度目適用 (systematic law 継承 第 1 例)。
 */

export type QueryState =
  | 'parsing'          // query DSL parse 中
  | 'searching'        // index 検索実行中
  | 'reranking'        // relevance rerank 実行中
  | 'facet-aggregating' // facet 集計中
  | 'completed';       // 検索完了 (terminal)

export type QueryEvent =
  | 'parse-succeeded'
  | 'parse-failed'
  | 'search-completed'
  | 'rerank-completed'
  | 'facet-computed'
  | 'query-timeout'
  | 'query-canceled';

export interface QuerySession {
  state: QueryState;
  parseAttempts: number;
  searchExecutions: number;
  rerankExecutions: number;
  facetsComputed: number;
  timeoutCount: number;
  lastEventAt: string;
  events: string[];
}

export function startQuery(input: { timestamp: string }): QuerySession {
  return {
    state: 'parsing',
    parseAttempts: 1,
    searchExecutions: 0,
    rerankExecutions: 0,
    facetsComputed: 0,
    timeoutCount: 0,
    lastEventAt: input.timestamp,
    events: ['query-started'],
  };
}

export function dispatchEvent(input: {
  session: QuerySession;
  event: QueryEvent;
  timestamp: string;
}): QuerySession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'parsing': {
      if (event === 'parse-succeeded') {
        return { ...base, state: 'searching' };
      }
      if (event === 'parse-failed') {
        return { ...base, state: 'completed' };
      }
      if (event === 'query-canceled') {
        return { ...base, state: 'completed' };
      }
      if (event === 'query-timeout') {
        return {
          ...base,
          state: 'completed',
          timeoutCount: session.timeoutCount + 1,
        };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'searching': {
      if (event === 'search-completed') {
        return {
          ...base,
          state: 'reranking',
          searchExecutions: session.searchExecutions + 1,
        };
      }
      if (event === 'query-timeout') {
        return {
          ...base,
          state: 'completed',
          timeoutCount: session.timeoutCount + 1,
        };
      }
      if (event === 'query-canceled') {
        return { ...base, state: 'completed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'reranking': {
      if (event === 'rerank-completed') {
        return {
          ...base,
          state: 'facet-aggregating',
          rerankExecutions: session.rerankExecutions + 1,
        };
      }
      if (event === 'query-timeout') {
        return {
          ...base,
          state: 'completed',
          timeoutCount: session.timeoutCount + 1,
        };
      }
      if (event === 'query-canceled') {
        return { ...base, state: 'completed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'facet-aggregating': {
      if (event === 'facet-computed') {
        return {
          ...base,
          state: 'completed',
          facetsComputed: session.facetsComputed + 1,
        };
      }
      if (event === 'query-timeout') {
        return {
          ...base,
          state: 'completed',
          timeoutCount: session.timeoutCount + 1,
        };
      }
      if (event === 'query-canceled') {
        return { ...base, state: 'completed' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'completed': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface QuerySummary {
  currentState: QueryState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  searchExecutions: number;
  rerankExecutions: number;
  facetsComputed: number;
  timeoutCount: number;
}

export function summarizeQuery(session: QuerySession): QuerySummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    searchExecutions: session.searchExecutions,
    rerankExecutions: session.rerankExecutions,
    facetsComputed: session.facetsComputed,
    timeoutCount: session.timeoutCount,
  };
}
