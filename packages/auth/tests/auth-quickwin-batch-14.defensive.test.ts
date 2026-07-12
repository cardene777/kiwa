import { describe, expect, it } from 'vitest';
import {
  dynamicClientRegistration,
  mintSoftwareStatement,
} from '../src/oidc/dcr.js';
import { createAuthorizationServer } from '../src/oauth21/authorization-server.js';

describe('oidc/dcr defensive branches', () => {
  it('mintSoftwareStatement accepts headerOverrides = undefined', () => {
    const jwt = mintSoftwareStatement(
      { software_id: 'sw-1', software_version: '1.0' },
      'trust-anchor-secret',
    );
    const headerB64 = jwt.split('.')[0] ?? '';
    const decoded = JSON.parse(
      Buffer.from(
        headerB64.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf-8'),
    );
    expect(decoded.alg).toBe('HS256');
  });

  it('mintSoftwareStatement applies headerOverrides when provided', () => {
    const jwt = mintSoftwareStatement(
      { software_id: 'sw-1' },
      'trust-anchor-secret',
      { alg: 'none' },
    );
    const headerB64 = jwt.split('.')[0] ?? '';
    const decoded = JSON.parse(
      Buffer.from(
        headerB64.replace(/-/g, '+').replace(/_/g, '/'),
        'base64',
      ).toString('utf-8'),
    );
    expect(decoded.alg).toBe('none');
  });

  it('dynamicClientRegistration refuses unknown token_endpoint_auth_method', () => {
    const server = createAuthorizationServer({ issuer: 'https://op.example' });
    expect(() =>
      dynamicClientRegistration(
        { server },
        {
          redirect_uris: ['https://rp.example/cb'],
          token_endpoint_auth_method: 'unknown_method' as never,
        },
      ),
    ).toThrow(/token_endpoint_auth_method .* refused/);
  });
});
