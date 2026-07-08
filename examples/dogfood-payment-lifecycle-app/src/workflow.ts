import {
  handleEvent,
  startLifecycle,
  summarizeLifecycle,
  type LifecycleEvent,
  type LifecycleSession,
  type LifecycleSummary,
} from '@kiwa/payment';

/** Pattern 1 — 通常契約成立 で lifecycle 初期化。 */
export function bootstrapSubscription(input: { timestamp: string }): LifecycleSession {
  return startLifecycle({ timestamp: input.timestamp });
}

/** Pattern 2 — event stream から batch 遷移、 webhook consumer の reference。 */
export function processEventBatch(input: {
  session: LifecycleSession;
  events: { event: LifecycleEvent; timestamp: string }[];
}): LifecycleSession {
  return input.events.reduce<LifecycleSession>(
    (acc, e) => handleEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

/** Pattern 3 — subscription 統計 dashboard、 admin panel の reference。 */
export function reportDashboard(session: LifecycleSession): LifecycleSummary {
  return summarizeLifecycle(session);
}

/** Pattern 4 — dunning recovery 経路のみ 抽出、 revenue team の analysis 用。 */
export function extractDunningPath(session: LifecycleSession): {
  totalDunningEvents: number;
  succeededRecoveries: number;
  exhaustedCancellations: number;
} {
  const dunningEvents = session.events.filter((e) => e.includes('dunning'));
  const succeeded = session.events.filter((e) => e === 'event:dunning-succeeded').length;
  const exhausted = session.events.filter((e) => e === 'event:dunning-exhausted').length;
  return {
    totalDunningEvents: dunningEvents.length,
    succeededRecoveries: succeeded,
    exhaustedCancellations: exhausted,
  };
}
