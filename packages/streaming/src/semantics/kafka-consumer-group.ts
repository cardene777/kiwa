// Kafka consumer-group semantics — rebalance protocol + static membership
// (KIP-345) + cooperative (KIP-429) incremental rebalance + heartbeat
// tracking. Complements the KafkaMock `consumer(groupId)` API by exposing the
// coordinator's view of members / assignments so tests can validate rebalance
// behavior directly.
//
// Modeled after the JoinGroup / SyncGroup / Heartbeat / LeaveGroup RPC pairs
// in the Kafka group coordinator, without wire encoding.

export const KAFKA_CONSUMER_GROUP_SYMBOL = Symbol.for('kiwa.streaming.semantics.kafka-consumer-group');

export type RebalanceProtocol = 'eager' | 'cooperative';

export interface KafkaConsumerGroupConfig {
  readonly groupId: string;
  /** `sessionTimeoutMs` from KIP-32 — heartbeat expiry window. Default 30_000. */
  readonly sessionTimeoutMs?: number;
  /** Rebalance protocol — `cooperative` = KIP-429 incremental. Default `eager`. */
  readonly protocol?: RebalanceProtocol;
}

export interface GroupMember {
  readonly memberId: string;
  /** Group instance id from KIP-345. Present ⇒ member is "static". */
  readonly groupInstanceId: string | undefined;
  readonly subscribedTopics: readonly string[];
  lastHeartbeatAt: number;
  assignedPartitions: Map<string, number[]>;
}

export interface RebalanceResult {
  readonly generationId: number;
  readonly protocol: RebalanceProtocol;
  readonly assignments: ReadonlyMap<string, ReadonlyMap<string, readonly number[]>>;
  /** Members whose assignments changed compared to the previous generation. */
  readonly reassignedMembers: readonly string[];
}

export interface KafkaConsumerGroup {
  readonly [KAFKA_CONSUMER_GROUP_SYMBOL]: true;
  readonly groupId: string;
  readonly config: Required<KafkaConsumerGroupConfig>;

  /** Register topic partition counts so the coordinator can compute assignments. */
  registerTopic(topic: string, numPartitions: number): void;

  /** JoinGroup RPC — returns the assigned memberId. Blocks until SyncGroup. */
  joinGroup(input: {
    readonly subscribedTopics: readonly string[];
    readonly groupInstanceId?: string;
  }): { readonly memberId: string; readonly generationId: number };

  /** LeaveGroup RPC — removes the member and triggers a rebalance. */
  leaveGroup(memberId: string): void;

  /** Heartbeat — extend the member's liveness. Throws if the member is unknown. */
  heartbeat(memberId: string, now?: number): void;

  /**
   * Detect expired members (no heartbeat within `sessionTimeoutMs`) and remove
   * them. Returns removed member ids. Callers typically loop this on a timer.
   */
  expireDeadMembers(now: number): readonly string[];

  /** Force a rebalance — recomputes assignments across the current member set. */
  rebalance(): RebalanceResult;

  /** Current generation id. */
  generation(): number;

  listMembers(): readonly GroupMember[];

  reset(): void;
}

interface InternalMember {
  readonly memberId: string;
  readonly groupInstanceId: string | undefined;
  readonly subscribedTopics: readonly string[];
  lastHeartbeatAt: number;
  assignedPartitions: Map<string, number[]>;
}

/**
 * Create a coordinator-side consumer-group model. Static members
 * (`groupInstanceId` set) survive a re-join without triggering a rebalance —
 * this is the KIP-345 flow that keeps assignments sticky across pod restarts.
 * Cooperative protocol emits `reassignedMembers` = only those whose partitions
 * moved, so tests can assert incremental behavior.
 */
export function createKafkaConsumerGroup(config: KafkaConsumerGroupConfig): KafkaConsumerGroup {
  const cfg: Required<KafkaConsumerGroupConfig> = {
    groupId: config.groupId,
    sessionTimeoutMs: config.sessionTimeoutMs ?? 30_000,
    protocol: config.protocol ?? 'eager',
  };

  const members = new Map<string, InternalMember>();
  const topics = new Map<string, number>();
  let generationId = 0;
  let nextMemberIdSeq = 0;
  let previousAssignments = new Map<string, Map<string, number[]>>();

  function assignRange(topic: string, memberIds: readonly string[]): Map<string, number[]> {
    const partitionCount = topics.get(topic) ?? 0;
    const out = new Map<string, number[]>();
    for (const id of memberIds) out.set(id, []);
    if (memberIds.length === 0 || partitionCount === 0) return out;
    const perMember = Math.ceil(partitionCount / memberIds.length);
    for (let i = 0; i < memberIds.length; i += 1) {
      const memberId = memberIds[i];
      if (memberId === undefined) continue;
      const start = i * perMember;
      const end = Math.min(start + perMember, partitionCount);
      const bucket = out.get(memberId) ?? [];
      for (let p = start; p < end; p += 1) bucket.push(p);
      out.set(memberId, bucket);
    }
    return out;
  }

  function computeAssignments(): Map<string, Map<string, number[]>> {
    // Group topics by their subscribers so we can range-assign per topic.
    const topicSubscribers = new Map<string, string[]>();
    for (const member of members.values()) {
      for (const t of member.subscribedTopics) {
        const list = topicSubscribers.get(t) ?? [];
        list.push(member.memberId);
        topicSubscribers.set(t, list);
      }
    }
    const perMember = new Map<string, Map<string, number[]>>();
    for (const id of members.keys()) perMember.set(id, new Map());
    for (const [topic, subs] of topicSubscribers) {
      subs.sort();
      const assignment = assignRange(topic, subs);
      for (const [memberId, partitions] of assignment) {
        const bucket = perMember.get(memberId) ?? new Map();
        bucket.set(topic, partitions);
        perMember.set(memberId, bucket);
      }
    }
    return perMember;
  }

  function serializeAssignment(assignment: Map<string, Map<string, number[]>>): string {
    const parts: string[] = [];
    for (const [memberId, perTopic] of [...assignment].sort((a, b) => a[0].localeCompare(b[0]))) {
      for (const [topic, partitions] of [...perTopic].sort((a, b) => a[0].localeCompare(b[0]))) {
        parts.push(`${memberId}|${topic}|${[...partitions].sort((a, b) => a - b).join(',')}`);
      }
    }
    return parts.join(';');
  }

  function performRebalance(): RebalanceResult {
    generationId += 1;
    const newAssignments = computeAssignments();
    // Detect reassigned members by comparing per-member serialization.
    const reassigned: string[] = [];
    for (const [memberId, perTopic] of newAssignments) {
      const previous = previousAssignments.get(memberId) ?? new Map<string, number[]>();
      const before = serializeAssignment(new Map([[memberId, previous]]));
      const after = serializeAssignment(new Map([[memberId, perTopic]]));
      if (before !== after) reassigned.push(memberId);
    }
    previousAssignments = newAssignments;
    // Apply to member records.
    for (const [memberId, perTopic] of newAssignments) {
      const member = members.get(memberId);
      if (!member) continue;
      member.assignedPartitions = perTopic;
    }
    const publicView = new Map<string, ReadonlyMap<string, readonly number[]>>();
    for (const [memberId, perTopic] of newAssignments) {
      const inner = new Map<string, readonly number[]>();
      for (const [topic, partitions] of perTopic) inner.set(topic, [...partitions]);
      publicView.set(memberId, inner);
    }
    reassigned.sort();
    return { generationId, protocol: cfg.protocol, assignments: publicView, reassignedMembers: reassigned };
  }

  const group: KafkaConsumerGroup = {
    [KAFKA_CONSUMER_GROUP_SYMBOL]: true,
    groupId: cfg.groupId,
    config: cfg,
    registerTopic(topic: string, numPartitions: number): void {
      topics.set(topic, numPartitions);
    },
    joinGroup(input) {
      // Static-member reconnect — reuse the existing memberId + skip rebalance.
      if (input.groupInstanceId) {
        for (const existing of members.values()) {
          if (existing.groupInstanceId === input.groupInstanceId) {
            existing.lastHeartbeatAt = Date.now();
            return { memberId: existing.memberId, generationId };
          }
        }
      }
      const memberId = `${cfg.groupId}-member-${nextMemberIdSeq++}`;
      const member: InternalMember = {
        memberId,
        groupInstanceId: input.groupInstanceId,
        subscribedTopics: [...input.subscribedTopics],
        lastHeartbeatAt: Date.now(),
        assignedPartitions: new Map(),
      };
      members.set(memberId, member);
      const result = performRebalance();
      return { memberId, generationId: result.generationId };
    },
    leaveGroup(memberId: string): void {
      if (!members.has(memberId)) return;
      members.delete(memberId);
      performRebalance();
    },
    heartbeat(memberId: string, now: number = Date.now()): void {
      const member = members.get(memberId);
      if (!member) throw new Error(`kafka consumer-group: unknown member ${memberId}`);
      member.lastHeartbeatAt = now;
    },
    expireDeadMembers(now: number): readonly string[] {
      const expired: string[] = [];
      for (const [memberId, member] of members) {
        if (now - member.lastHeartbeatAt > cfg.sessionTimeoutMs) expired.push(memberId);
      }
      if (expired.length === 0) return expired;
      for (const id of expired) members.delete(id);
      performRebalance();
      return expired;
    },
    rebalance(): RebalanceResult {
      return performRebalance();
    },
    generation(): number {
      return generationId;
    },
    listMembers(): readonly GroupMember[] {
      const out: GroupMember[] = [];
      for (const m of members.values()) {
        out.push({
          memberId: m.memberId,
          groupInstanceId: m.groupInstanceId,
          subscribedTopics: [...m.subscribedTopics],
          lastHeartbeatAt: m.lastHeartbeatAt,
          assignedPartitions: new Map(m.assignedPartitions),
        });
      }
      return out;
    },
    reset(): void {
      members.clear();
      topics.clear();
      generationId = 0;
      nextMemberIdSeq = 0;
      previousAssignments = new Map();
    },
  };
  return group;
}

/** Type guard: recognize a KafkaConsumerGroup. */
export function isKafkaConsumerGroup(value: unknown): value is KafkaConsumerGroup {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [KAFKA_CONSUMER_GROUP_SYMBOL]?: true })[KAFKA_CONSUMER_GROUP_SYMBOL] === true
  );
}
