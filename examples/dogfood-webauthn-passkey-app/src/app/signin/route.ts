/**
 * Next.js 15 App Router route handler for `POST /signin`.
 *
 * Sub-Issue #857 (v1.21-2b) adds the assertion (signin) ceremony that
 * complements #856's `/register`. Like the register handler this is a plain
 * `(req: Request) => Promise<Response>` function — Next.js 15 App Router will
 * mount it via the `src/app/signin/route.ts` convention (§Route Handlers,
 * Next.js 15 docs). Keeping the handler framework-neutral means the dogfood
 * tests exercise it as pure fetch() without booting Next.js, and Playwright
 * e2e in `tests/e2e/passkey-signin.spec.ts` can boot the real runtime.
 *
 * Request shape (JSON) —
 *   { rpId, challenge, allowCredentialIds?, userVerification? }
 * matches {@link SigninInput}. Response shape (JSON) —
 *   { credentialId, clientDataJSON, authenticatorData, signature,
 *     userHandle, signCount, previousSignCount }
 * mirrors what a browser client would receive from a SimpleWebAuthn-shaped
 * RP after `signInResponse.verified === true`.
 *
 * SCOPE BOUNDARY — WebAuthn L3 §7.2 step 12 requires the RP to have generated
 * the challenge and consume it exactly once (challenge single-use). This
 * handler currently accepts caller-supplied challenges without a server-side
 * single-use registry (matches #856's `/register` pattern for symmetry). The
 * `signCount` monotonic guard (WebAuthn L3 §6.1.1, verified by the mock
 * adapter) covers the cloned-authenticator half of the replay defence, but
 * NOT the in-flight-signed-assertion replay half. Full challenge single-use
 * enforcement lands with Sub-Issue #859 (`/manage` — that ceremony introduces
 * a session-scoped challenge store the RP can gate on). Tests in
 * `tests/signin-assertion.spec.ts` skip the challenge-replay axis with a
 * comment pointing at #859.
 */

import {
  DOGFOOD_USER_VERIFICATION_VALUES,
  type SigninInput,
  type WebAuthnRPAdapter,
} from '../../adapters/interface.js';
import { parseUserVerification } from '../register/route.js';

export interface SigninRouteBody {
  rpId: string;
  challenge: string;
  allowCredentialIds?: string[];
  userVerification?: SigninInput['userVerification'];
}

export interface SigninRouteResponse {
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle: string;
  signCount: number;
  previousSignCount: number;
}

/**
 * Build a `POST` handler bound to a specific {@link WebAuthnRPAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const POST = createSigninHandler(adapter)`.
 */
export function createSigninHandler(
  adapter: WebAuthnRPAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: SigninRouteBody;
    try {
      body = (await req.json()) as SigninRouteBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }

    if (!body.rpId || !body.challenge) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'rpId and challenge are required',
      });
    }

    // Sub-Issue #858 — accept `?uv=` query override same as `/register` so
    // both routes carry the userVerification vocabulary consistently. Query
    // wins over body when both are set.
    const url = safeParseSigninUrl(req.url);
    const queryUV = parseUserVerification(url?.searchParams.get('uv') ?? null);
    const bodyUV = parseUserVerification(body.userVerification ?? null);
    if (queryUV === 'invalid' || bodyUV === 'invalid') {
      return jsonResponse(400, {
        error: 'invalid_user_verification',
        message: `userVerification must be one of ${DOGFOOD_USER_VERIFICATION_VALUES.join(', ')}`,
      });
    }
    const effectiveUV = queryUV ?? bodyUV;

    try {
      const input: SigninInput = {
        rpId: body.rpId,
        challenge: body.challenge,
        ...(body.allowCredentialIds ? { allowCredentialIds: body.allowCredentialIds } : {}),
        ...(effectiveUV ? { userVerification: effectiveUV } : {}),
      };
      const result = await adapter.signin(input);
      const responseBody: SigninRouteResponse = {
        credentialId: result.assertionResponse.credentialId,
        clientDataJSON: result.assertionResponse.clientDataJSON,
        authenticatorData: result.assertionResponse.authenticatorData,
        signature: result.assertionResponse.signature,
        userHandle: result.assertionResponse.userHandle,
        signCount: result.assertionResponse.signCount,
        previousSignCount: result.previousSignCount,
      };
      return jsonResponse(200, responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // User-caused failures (unknown credential, no UV support, missing
      // fields) surface as 400 so clients can distinguish "try a different
      // credential" from "the RP is broken". Server-internal failures
      // (env missing, sign count regressed = suspected cloned authenticator,
      // credential lost mid-assertion) stay 500. Aligns with SimpleWebAuthn
      // + fido-conformance guidance for RP HTTP status hygiene.
      const status = classifySigninHttpStatus(message);
      return jsonResponse(status, {
        error: 'signin_failed',
        message,
      });
    }
  };
}

/**
 * Map a `signin` failure message to an HTTP status. Maintained as a
 * string-match against the mock adapter's Error messages because the mock
 * exposes error semantics through message + trace `errorKind` rather than
 * typed exceptions. Once #858 promotes errorKind to a typed field on
 * `SigninResult` the caller will read that directly.
 */
function classifySigninHttpStatus(message: string): number {
  const userErrors = [
    'no credentials are registered',
    'allowCredentials matched no stored credential',
    'no user-present authenticator',
    'userVerification=required',
    // `userVerification=impossible` (Sub-Issue #858) is a client-side bad
    // request — RP asked for a value the WebAuthn spec does not define. Same
    // 400 semantics as the other user errors.
    'userVerification=impossible',
    'rpId is required',
    'challenge is required',
  ];
  for (const needle of userErrors) {
    if (message.includes(needle)) return 400;
  }
  return 500;
}

function safeParseSigninUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
