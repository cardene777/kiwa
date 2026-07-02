import { createHmac, randomBytes } from 'node:crypto';
import type { SamlAssertion, SamlAuthnRequest, SamlIdentityProvider } from './types.js';

/**
 * SAML 2.0 mock. Real SAML has cryptographic XML signatures, canonicalization
 * (XML-DSig), and a large surface area — the mock replaces the XML-DSig layer
 * with a deterministic HMAC over the assertion fields, since tests should not
 * be exercising signature parsing behavior.
 */

export function buildAuthnRequest(input: {
  idp: SamlIdentityProvider;
  relayState: string;
  expiresIn: number;
}): SamlAuthnRequest {
  const id = `_${randomBytes(8).toString('hex')}`;
  const now = new Date();
  const params = new URLSearchParams({
    SAMLRequest: Buffer.from(
      `<samlp:AuthnRequest ID="${id}" IssueInstant="${now.toISOString()}" AssertionConsumerServiceURL="${input.idp.entityId}" />`,
    ).toString('base64'),
    RelayState: input.relayState,
  });
  return {
    id,
    idpId: input.idp.id,
    redirectUrl: `${input.idp.ssoUrl}?${params.toString()}`,
    relayState: input.relayState,
    issuedAt: now,
    expiresAt: new Date(now.getTime() + input.expiresIn * 1000),
  };
}

export function signAssertion(input: {
  nameId: string;
  attributes: Record<string, string | string[]>;
  sessionIndex: string;
  issuedAt: Date;
  expiresAt: Date;
  relayState: string;
  signingKey: string;
}): SamlAssertion {
  const attrEncoded = JSON.stringify(input.attributes);
  const canonical = [
    input.nameId,
    attrEncoded,
    input.sessionIndex,
    input.issuedAt.toISOString(),
    input.expiresAt.toISOString(),
    input.relayState,
  ].join('|');
  const signature = createHmac('sha256', input.signingKey).update(canonical).digest('base64');
  return {
    nameId: input.nameId,
    attributes: input.attributes,
    sessionIndex: input.sessionIndex,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt,
    relayState: input.relayState,
    signature,
  };
}

export function verifyAssertion(input: {
  assertion: SamlAssertion;
  signingKey: string;
}): boolean {
  const canonical = [
    input.assertion.nameId,
    JSON.stringify(input.assertion.attributes),
    input.assertion.sessionIndex,
    input.assertion.issuedAt.toISOString(),
    input.assertion.expiresAt.toISOString(),
    input.assertion.relayState,
  ].join('|');
  const expected = createHmac('sha256', input.signingKey).update(canonical).digest('base64');
  return expected === input.assertion.signature;
}

/**
 * Extract user-facing attributes according to the IdP's attribute map.
 */
export function mapAttributes(input: {
  idp: SamlIdentityProvider;
  assertion: SamlAssertion;
}): { email: string; firstName?: string; lastName?: string; groups?: string[] } {
  const emailAttr = input.assertion.attributes[input.idp.attributeMap.email];
  if (typeof emailAttr !== 'string') {
    throw new Error(
      `mapAttributes: missing or non-string email attribute (mapped from '${input.idp.attributeMap.email}')`,
    );
  }
  const out: { email: string; firstName?: string; lastName?: string; groups?: string[] } = {
    email: emailAttr,
  };
  if (input.idp.attributeMap.firstName) {
    const v = input.assertion.attributes[input.idp.attributeMap.firstName];
    if (typeof v === 'string') out.firstName = v;
  }
  if (input.idp.attributeMap.lastName) {
    const v = input.assertion.attributes[input.idp.attributeMap.lastName];
    if (typeof v === 'string') out.lastName = v;
  }
  if (input.idp.attributeMap.groups) {
    const v = input.assertion.attributes[input.idp.attributeMap.groups];
    if (Array.isArray(v)) out.groups = v;
    else if (typeof v === 'string') out.groups = [v];
  }
  return out;
}
