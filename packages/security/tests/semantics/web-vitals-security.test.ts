import { describe, expect, it } from 'vitest';
import {
  applyPermissionsPolicy,
  enforceCrossOriginIsolation,
  enforceTrustedTypes,
  startWvsSession,
  verifySri,
} from '../../src/semantics/index.js';

describe('startWvsSession', () => {
  it('creates idle session', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(s.state).toBe('idle');
  });

  it('throws when sessionId is empty', () => {
    expect(() => startWvsSession({ target: 'istio', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('verifySri', () => {
  it('matches sha384 integrity', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    const step = verifySri(s, {
      resourceUrl: 'https://cdn/x.js',
      integrity: 'sha384-abc',
      computedHash: 'abc',
    });
    expect(step.metadata['matched']).toBe(true);
    expect(s.state).toBe('sri-verified');
  });

  it('supports sha256 and sha512', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, {
      resourceUrl: '/lib.js',
      integrity: 'sha256-hash',
      computedHash: 'hash',
    });
    expect(s.state).toBe('sri-verified');
  });

  it('marks failed on mismatch', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    const step = verifySri(s, {
      resourceUrl: '/lib.js',
      integrity: 'sha256-abc',
      computedHash: 'def',
    });
    expect(step.metadata['matched']).toBe(false);
    expect(s.state).toBe('failed');
  });

  it('rejects non-sha integrity', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      verifySri(s, {
        resourceUrl: '/x.js',
        integrity: 'md5-abc',
        computedHash: 'abc',
      }),
    ).toThrow('sha256- / sha384- / sha512-');
  });

  it('rejects empty integrity', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      verifySri(s, {
        resourceUrl: '/x.js',
        integrity: '',
        computedHash: 'abc',
      }),
    ).toThrow('must not be empty');
  });
});

describe('enforceTrustedTypes', () => {
  it('enforces multi-policy config', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, {
      resourceUrl: '/x.js',
      integrity: 'sha256-abc',
      computedHash: 'abc',
    });
    const step = enforceTrustedTypes(s, {
      policyNames: ['default', 'lit-html'],
      requireForScript: true,
      reportOnly: false,
    });
    expect(step.metadata['policyCount']).toBe(2);
    expect(s.state).toBe('trusted-types-enforced');
  });

  it('supports report-only mode', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, {
      resourceUrl: '/x.js',
      integrity: 'sha256-abc',
      computedHash: 'abc',
    });
    const step = enforceTrustedTypes(s, {
      policyNames: ['default'],
      requireForScript: false,
      reportOnly: true,
    });
    expect(step.metadata['reportOnly']).toBe(true);
  });

  it('rejects empty policy list', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    verifySri(s, {
      resourceUrl: '/x.js',
      integrity: 'sha256-abc',
      computedHash: 'abc',
    });
    expect(() =>
      enforceTrustedTypes(s, {
        policyNames: [],
        requireForScript: true,
        reportOnly: false,
      }),
    ).toThrow('one policy name required');
  });

  it('throws when SRI not verified', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      enforceTrustedTypes(s, {
        policyNames: ['x'],
        requireForScript: true,
        reportOnly: false,
      }),
    ).toThrow('SRI must be verified');
  });
});

describe('applyPermissionsPolicy', () => {
  const setup = (s: ReturnType<typeof startWvsSession>) => {
    verifySri(s, {
      resourceUrl: '/x.js',
      integrity: 'sha256-abc',
      computedHash: 'abc',
    });
    enforceTrustedTypes(s, {
      policyNames: ['default'],
      requireForScript: true,
      reportOnly: false,
    });
  };

  it('records feature count and restriction count', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = applyPermissionsPolicy(s, {
      features: [
        { name: 'camera', allowlist: 'none' },
        { name: 'microphone', allowlist: 'none' },
        { name: 'geolocation', allowlist: 'self' },
      ],
    });
    expect(step.metadata['featureCount']).toBe(3);
    expect(step.metadata['restrictedCount']).toBe(2);
    expect(s.state).toBe('permissions-policy-applied');
  });

  it('supports payment and usb features', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    applyPermissionsPolicy(s, {
      features: [
        { name: 'payment', allowlist: 'none' },
        { name: 'usb', allowlist: 'none' },
      ],
    });
    expect(s.state).toBe('permissions-policy-applied');
  });

  it('rejects empty features', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    expect(() => applyPermissionsPolicy(s, { features: [] })).toThrow(
      'one feature required',
    );
  });
});

describe('enforceCrossOriginIsolation', () => {
  const setup = (s: ReturnType<typeof startWvsSession>) => {
    verifySri(s, {
      resourceUrl: '/x.js',
      integrity: 'sha256-abc',
      computedHash: 'abc',
    });
    enforceTrustedTypes(s, {
      policyNames: ['default'],
      requireForScript: true,
      reportOnly: false,
    });
    applyPermissionsPolicy(s, {
      features: [{ name: 'camera', allowlist: 'none' }],
    });
  };

  it('marks isolated when COOP same-origin + COEP require-corp', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = enforceCrossOriginIsolation(s, {
      coop: 'same-origin',
      coep: 'require-corp',
      corp: 'same-origin',
    });
    expect(step.metadata['isolated']).toBe(true);
    expect(s.state).toBe('cross-origin-isolated');
  });

  it('marks isolated with credentialless COEP', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = enforceCrossOriginIsolation(s, {
      coop: 'same-origin',
      coep: 'credentialless',
      corp: 'same-origin',
    });
    expect(step.metadata['isolated']).toBe(true);
  });

  it('marks not isolated with unsafe-none COOP', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    setup(s);
    const step = enforceCrossOriginIsolation(s, {
      coop: 'unsafe-none',
      coep: 'require-corp',
      corp: 'same-origin',
    });
    expect(step.metadata['isolated']).toBe(false);
  });

  it('throws when permissions policy not applied', () => {
    const s = startWvsSession({ target: 'istio', sessionId: 's' });
    expect(() =>
      enforceCrossOriginIsolation(s, {
        coop: 'same-origin',
        coep: 'require-corp',
        corp: 'same-origin',
      }),
    ).toThrow('permissions policy must be applied');
  });
});
