import { providerEventName, type AxisStep, type DesktopTarget } from './types.js';

/**
 * File-system permissions axis (v0.2) — request + grant + revoke + audit の 4 step 遷移。
 * macOS TCC + Windows UAC + Linux xdg-portal の 3 target を uniform state machine で扱う。
 */
export type FsPermissionsState = 'idle' | 'requested' | 'granted' | 'revoked' | 'audited';

export type FsPermissionScope = 'read' | 'write' | 'read-write' | 'execute';

export interface FsPermissionsSession {
  target: DesktopTarget;
  path: string;
  scope: FsPermissionScope;
  state: FsPermissionsState;
  grantedScopes: FsPermissionScope[];
  auditEntries: number;
  history: AxisStep<FsPermissionsState>[];
}

function emit(
  session: FsPermissionsSession,
  neutralEvent:
    | 'fs-permissions.request_submitted'
    | 'fs-permissions.permission_granted'
    | 'fs-permissions.permission_revoked'
    | 'fs-permissions.audit_logged',
  metadata: Record<string, string | number | boolean>,
): AxisStep<FsPermissionsState> {
  const step: AxisStep<FsPermissionsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    metadata: { path: session.path, scope: session.scope, ...metadata },
  };
  session.history.push(step);
  return step;
}

export function requestFsPermission(input: {
  target: DesktopTarget;
  path: string;
  scope: FsPermissionScope;
}): FsPermissionsSession {
  if (input.path.length === 0) throw new Error('requestFsPermission: path must not be empty');
  const session: FsPermissionsSession = {
    target: input.target,
    path: input.path,
    scope: input.scope,
    state: 'requested',
    grantedScopes: [],
    auditEntries: 0,
    history: [],
  };
  emit(session, 'fs-permissions.request_submitted', { target: input.target });
  return session;
}

export function grantFsPermission(
  session: FsPermissionsSession,
  scope: FsPermissionScope,
): AxisStep<FsPermissionsState> {
  if (session.state === 'idle') throw new Error('grantFsPermission: no request pending');
  if (!session.grantedScopes.includes(scope)) session.grantedScopes.push(scope);
  session.state = 'granted';
  return emit(session, 'fs-permissions.permission_granted', {
    grantedScope: scope,
    grantedCount: session.grantedScopes.length,
  });
}

export function revokeFsPermission(
  session: FsPermissionsSession,
  scope: FsPermissionScope,
): AxisStep<FsPermissionsState> {
  if (!session.grantedScopes.includes(scope)) {
    throw new Error(`revokeFsPermission: ${scope} not granted`);
  }
  session.grantedScopes = session.grantedScopes.filter((s) => s !== scope);
  session.state = 'revoked';
  return emit(session, 'fs-permissions.permission_revoked', {
    revokedScope: scope,
    remaining: session.grantedScopes.length,
  });
}

export function logFsPermissionAudit(
  session: FsPermissionsSession,
  reason: string,
): AxisStep<FsPermissionsState> {
  if (reason.length === 0) throw new Error('logFsPermissionAudit: reason must not be empty');
  session.auditEntries += 1;
  session.state = 'audited';
  return emit(session, 'fs-permissions.audit_logged', {
    reason,
    auditCount: session.auditEntries,
  });
}
