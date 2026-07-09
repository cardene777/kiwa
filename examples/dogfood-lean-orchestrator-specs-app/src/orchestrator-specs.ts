import type { OrchestratorSpec } from '@kiwa-lab/lean';

// Each machine lists the transitions it accepts and rejects everything else.
// `unspecified: "invalid"` says so once, for the whole table, rather than
// repeating 26 rejections per spec. Without it the generator refuses to run:
// a cell nobody mentioned is a cell nobody decided about.

export const TRANSACTION_SPEC: OrchestratorSpec = {
  moduleName: 'TransactionOrchestrator',
  namespace: 'Transaction',
  states: ['beginning', 'active', 'savepoint-nested', 'committing', 'aborted'],
  events: [
    'begin-completed',
    'query-executed',
    'savepoint-created',
    'savepoint-released',
    'commit-requested',
    'commit-succeeded',
    'rollback-requested',
    'timeout',
  ],
  unspecified: 'invalid',
  transitions: [
    { from: 'beginning', event: 'begin-completed', to: 'active' },
    { from: 'beginning', event: 'rollback-requested', to: 'aborted' },
    { from: 'beginning', event: 'timeout', to: 'aborted' },
    { from: 'active', event: 'query-executed', to: 'active' },
    { from: 'active', event: 'savepoint-created', to: 'savepoint-nested' },
    { from: 'active', event: 'commit-requested', to: 'committing' },
    { from: 'active', event: 'rollback-requested', to: 'aborted' },
    { from: 'active', event: 'timeout', to: 'aborted' },
    { from: 'savepoint-nested', event: 'query-executed', to: 'savepoint-nested' },
    { from: 'savepoint-nested', event: 'savepoint-released', to: 'active' },
    { from: 'savepoint-nested', event: 'rollback-requested', to: 'aborted' },
    { from: 'savepoint-nested', event: 'timeout', to: 'aborted' },
    { from: 'committing', event: 'commit-succeeded', to: 'committing' },
    { from: 'committing', event: 'timeout', to: 'aborted' },
  ],
};

export const SESSION_SPEC: OrchestratorSpec = {
  moduleName: 'SessionLifecycleOrchestrator',
  namespace: 'Session',
  states: ['init', 'authed', 'refreshing', 'expired', 'revoked'],
  events: [
    'auth-succeeded',
    'auth-failed',
    'refresh-triggered',
    'refresh-succeeded',
    'refresh-failed',
    'session-expired',
    'revoke-requested',
    'timeout',
  ],
  unspecified: 'invalid',
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'auth-failed', to: 'init' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'refresh-triggered', to: 'refreshing' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'revoke-requested', to: 'revoked' },
    { from: 'authed', event: 'timeout', to: 'expired' },
    { from: 'refreshing', event: 'refresh-succeeded', to: 'authed' },
    { from: 'refreshing', event: 'refresh-failed', to: 'expired' },
    { from: 'refreshing', event: 'revoke-requested', to: 'revoked' },
    { from: 'refreshing', event: 'timeout', to: 'expired' },
    { from: 'expired', event: 'revoke-requested', to: 'revoked' },
  ],
};

export const CACHE_SPEC: OrchestratorSpec = {
  moduleName: 'CacheLifecycleOrchestrator',
  namespace: 'Cache',
  states: ['filling', 'hot', 'expiring', 'stale', 'evicted'],
  events: [
    'write-committed',
    'read-hit',
    'read-miss',
    'ttl-warning',
    'ttl-expired',
    'invalidate-requested',
    'evict-requested',
    'timeout',
  ],
  unspecified: 'invalid',
  transitions: [
    { from: 'filling', event: 'write-committed', to: 'hot' },
    { from: 'filling', event: 'timeout', to: 'evicted' },
    { from: 'hot', event: 'read-hit', to: 'hot' },
    { from: 'hot', event: 'write-committed', to: 'hot' },
    { from: 'hot', event: 'ttl-warning', to: 'expiring' },
    { from: 'hot', event: 'invalidate-requested', to: 'evicted' },
    { from: 'hot', event: 'timeout', to: 'evicted' },
    { from: 'expiring', event: 'read-hit', to: 'expiring' },
    { from: 'expiring', event: 'ttl-expired', to: 'stale' },
    { from: 'expiring', event: 'evict-requested', to: 'evicted' },
    { from: 'expiring', event: 'timeout', to: 'evicted' },
    { from: 'stale', event: 'read-miss', to: 'stale' },
    { from: 'stale', event: 'evict-requested', to: 'evicted' },
    { from: 'stale', event: 'write-committed', to: 'filling' },
    { from: 'stale', event: 'timeout', to: 'evicted' },
  ],
};

export const JOB_SPEC: OrchestratorSpec = {
  moduleName: 'JobLifecycleOrchestrator',
  namespace: 'Job',
  states: ['queued', 'processing', 'retrying', 'dlq', 'completed'],
  events: [
    'enqueue-succeeded',
    'process-started',
    'process-succeeded',
    'process-failed',
    'retry-scheduled',
    'retry-exhausted',
    'dlq-inspected',
    'timeout',
  ],
  unspecified: 'invalid',
  transitions: [
    { from: 'queued', event: 'enqueue-succeeded', to: 'queued' },
    { from: 'queued', event: 'process-started', to: 'processing' },
    { from: 'queued', event: 'timeout', to: 'dlq' },
    { from: 'processing', event: 'process-succeeded', to: 'completed' },
    { from: 'processing', event: 'process-failed', to: 'retrying' },
    { from: 'processing', event: 'timeout', to: 'dlq' },
    { from: 'retrying', event: 'retry-scheduled', to: 'queued' },
    { from: 'retrying', event: 'retry-exhausted', to: 'dlq' },
    { from: 'retrying', event: 'timeout', to: 'dlq' },
    { from: 'dlq', event: 'dlq-inspected', to: 'dlq' },
  ],
};

export const CLI_SPEC: OrchestratorSpec = {
  moduleName: 'CliLifecycleOrchestrator',
  namespace: 'Cli',
  states: ['spawning', 'running', 'signaled', 'exited', 'cleaned'],
  events: [
    'spawn-succeeded',
    'stdout-received',
    'stderr-received',
    'signal-sent',
    'exit-detected',
    'cleanup-requested',
    'zombie-detected',
    'timeout',
  ],
  unspecified: 'invalid',
  transitions: [
    { from: 'spawning', event: 'spawn-succeeded', to: 'running' },
    { from: 'spawning', event: 'timeout', to: 'exited' },
    { from: 'running', event: 'stdout-received', to: 'running' },
    { from: 'running', event: 'stderr-received', to: 'running' },
    { from: 'running', event: 'signal-sent', to: 'signaled' },
    { from: 'running', event: 'exit-detected', to: 'exited' },
    { from: 'running', event: 'timeout', to: 'exited' },
    { from: 'signaled', event: 'exit-detected', to: 'exited' },
    { from: 'signaled', event: 'zombie-detected', to: 'signaled' },
    { from: 'signaled', event: 'timeout', to: 'exited' },
    { from: 'exited', event: 'cleanup-requested', to: 'cleaned' },
    { from: 'exited', event: 'zombie-detected', to: 'exited' },
  ],
};

export const ALL_SPECS = [
  TRANSACTION_SPEC,
  SESSION_SPEC,
  CACHE_SPEC,
  JOB_SPEC,
  CLI_SPEC,
] as const;
