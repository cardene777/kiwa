import type { WorkflowClient, WorkflowExecutionResult } from './client.js';
import type { WorkflowDefinition, WorkflowInput } from './steps.js';

export interface EmittedEvent {
  name: string;
  payload: WorkflowInput;
  emittedAt: number;
}

export interface EventTriggerHandle {
  eventName: string;
  workflowName: string;
  handledCount: () => number;
  dispose: () => void;
}

const registry = new WeakMap<WorkflowClient, Map<string, WorkflowDefinition[]>>();
const counters = new WeakMap<WorkflowClient, Map<string, number>>();

/**
 * event 名で workflow を trigger 登録する。 event が emit されると同名の workflow が
 * execute される (Inngest event-driven / AWS EventBridge → SFN の挙動を再現)。
 */
export function eventDrivenTrigger(
  client: WorkflowClient,
  eventName: string,
  workflow: WorkflowDefinition,
): EventTriggerHandle {
  client.register(workflow);
  let map = registry.get(client);
  if (!map) {
    map = new Map();
    registry.set(client, map);
  }
  const existing = map.get(eventName) ?? [];
  existing.push(workflow);
  map.set(eventName, existing);
  let counterMap = counters.get(client);
  if (!counterMap) {
    counterMap = new Map();
    counters.set(client, counterMap);
  }
  const key = `${eventName}::${workflow.name}`;
  counterMap.set(key, 0);
  return {
    eventName,
    workflowName: workflow.name,
    handledCount: () => counterMap!.get(key) ?? 0,
    dispose: () => {
      const cur = map!.get(eventName) ?? [];
      map!.set(eventName, cur.filter((w) => w.name !== workflow.name));
    },
  };
}

/**
 * event を emit して登録済 workflow を全 execute する。 emit 順で workflow 実行が並ぶ。
 */
export async function emitEvent(
  client: WorkflowClient,
  event: EmittedEvent,
): Promise<WorkflowExecutionResult[]> {
  const map = registry.get(client);
  const workflows = map?.get(event.name) ?? [];
  const counterMap = counters.get(client);
  const results: WorkflowExecutionResult[] = [];
  for (const workflow of workflows) {
    const result = await client.execute(workflow.name, event.payload);
    results.push(result);
    if (counterMap) {
      const key = `${event.name}::${workflow.name}`;
      counterMap.set(key, (counterMap.get(key) ?? 0) + 1);
    }
  }
  return results;
}
