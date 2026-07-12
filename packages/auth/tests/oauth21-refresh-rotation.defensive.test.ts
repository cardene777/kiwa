import { describe, expect, it } from 'vitest';
import {
  mintAccessToken,
  mintRefreshToken,
  rotateRefreshToken,
  __resetTokenCounters,
} from '../src/oauth21/refresh-rotation.js';

const NOW = () => 1_700_000_000_000;

describe('oauth21 mintAccessToken defensive branches', () => {
  it('sets tokenType Bearer when dpopJkt is undefined', () => {
    __resetTokenCounters();
    const at = mintAccessToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 3600,
      now: NOW,
    });
    expect(at.tokenType).toBe('Bearer');
    expect((at as { dpopJkt?: string }).dpopJkt).toBeUndefined();
  });

  it('sets tokenType DPoP when dpopJkt is provided', () => {
    __resetTokenCounters();
    const at = mintAccessToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 3600,
      now: NOW,
      dpopJkt: 'jkt-abc',
    });
    expect(at.tokenType).toBe('DPoP');
    expect((at as { dpopJkt?: string }).dpopJkt).toBe('jkt-abc');
  });

  it('includes resource when provided', () => {
    __resetTokenCounters();
    const at = mintAccessToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 3600,
      now: NOW,
      resource: 'https://api.example.com',
    });
    expect((at as { resource?: string }).resource).toBe('https://api.example.com');
  });
});

describe('oauth21 mintRefreshToken defensive branches', () => {
  it('defaults rotationCount to 0 when omitted', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
    });
    expect(rt.rotationCount).toBe(0);
  });

  it('preserves explicit rotationCount', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      rotationCount: 5,
    });
    expect(rt.rotationCount).toBe(5);
  });

  it('includes dpopJkt and resource when provided', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      dpopJkt: 'jkt-xyz',
      resource: 'https://api.example.com',
    });
    expect((rt as { dpopJkt?: string }).dpopJkt).toBe('jkt-xyz');
    expect((rt as { resource?: string }).resource).toBe('https://api.example.com');
  });
});

describe('oauth21 rotateRefreshToken defensive branches', () => {
  it('throws when previous token is revoked', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
    });
    rt.revoked = true;
    expect(() => rotateRefreshToken(rt, 86400, NOW)).toThrow(/already revoked/);
  });

  it('increments rotationCount and preserves client/subject on rotation', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
    });
    const next = rotateRefreshToken(rt, 86400, NOW);
    expect(next.rotationCount).toBe(1);
    expect(next.clientId).toBe('c1');
    expect(next.subject).toBe('u1');
  });

  it('applies scope override when provided', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
    });
    const next = rotateRefreshToken(rt, 86400, NOW, { scope: 'openid email' });
    expect(next.scope).toBe('openid email');
  });

  it('inherits dpopJkt from previous when override undefined', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      dpopJkt: 'inherited-jkt',
    });
    const next = rotateRefreshToken(rt, 86400, NOW);
    expect((next as { dpopJkt?: string }).dpopJkt).toBe('inherited-jkt');
  });

  it('override dpopJkt supersedes previous', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      dpopJkt: 'old-jkt',
    });
    const next = rotateRefreshToken(rt, 86400, NOW, { dpopJkt: 'new-jkt' });
    expect((next as { dpopJkt?: string }).dpopJkt).toBe('new-jkt');
  });

  it('inherits resource from previous when override undefined', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      resource: 'inherited-resource',
    });
    const next = rotateRefreshToken(rt, 86400, NOW);
    expect((next as { resource?: string }).resource).toBe('inherited-resource');
  });

  it('override resource supersedes previous', () => {
    __resetTokenCounters();
    const rt = mintRefreshToken({
      clientId: 'c1',
      subject: 'u1',
      scope: 'openid',
      lifetimeSec: 86400,
      now: NOW,
      resource: 'old-resource',
    });
    const next = rotateRefreshToken(rt, 86400, NOW, { resource: 'new-resource' });
    expect((next as { resource?: string }).resource).toBe('new-resource');
  });
});
