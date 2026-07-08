import { describe, expect, it } from 'vitest';
import {
  grantFsPermission,
  logFsPermissionAudit,
  requestFsPermission,
  revokeFsPermission,
} from '../../src/index.js';

describe('fs-permissions axis semantics (v0.2)', () => {
  it('request → grant → revoke → audit full path', () => {
    const s = requestFsPermission({
      target: 'macos',
      path: '/Users/alice/Documents',
      scope: 'read-write',
    });
    grantFsPermission(s, 'read');
    grantFsPermission(s, 'write');
    revokeFsPermission(s, 'read');
    logFsPermissionAudit(s, 'user-revoke');
    expect(s.state).toBe('audited');
    expect(s.grantedScopes).toEqual(['write']);
    expect(s.auditEntries).toBe(1);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'fs-permissions.request_submitted',
      'fs-permissions.permission_granted',
      'fs-permissions.permission_granted',
      'fs-permissions.permission_revoked',
      'fs-permissions.audit_logged',
    ]);
  });

  it('rejects revoke of ungranted scope', () => {
    const s = requestFsPermission({ target: 'linux', path: '/tmp', scope: 'read' });
    expect(() => revokeFsPermission(s, 'write')).toThrow(/not granted/);
  });

  it('rejects empty inputs', () => {
    expect(() =>
      requestFsPermission({ target: 'macos', path: '', scope: 'read' }),
    ).toThrow(/path/);
    const s = requestFsPermission({ target: 'macos', path: '/x', scope: 'read' });
    expect(() => logFsPermissionAudit(s, '')).toThrow(/reason/);
  });

  it('provider dialect maps per target', () => {
    const mac = requestFsPermission({ target: 'macos', path: '/x', scope: 'read' });
    const win = requestFsPermission({ target: 'windows', path: '/x', scope: 'read' });
    const lin = requestFsPermission({ target: 'linux', path: '/x', scope: 'read' });
    expect(mac.history[0]?.providerEvent).toContain('macos.tcc');
    expect(win.history[0]?.providerEvent).toContain('windows.uac');
    expect(lin.history[0]?.providerEvent).toContain('linux.xdgPortal');
  });

  it('multiple grants accumulate', () => {
    const s = requestFsPermission({
      target: 'windows',
      path: '/x',
      scope: 'read-write',
    });
    grantFsPermission(s, 'read');
    grantFsPermission(s, 'write');
    grantFsPermission(s, 'execute');
    expect(s.grantedScopes).toEqual(['read', 'write', 'execute']);
  });
});
