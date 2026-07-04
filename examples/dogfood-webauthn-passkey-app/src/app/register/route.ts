/**
 * Next.js 15 App Router route handler for `POST /register`.
 *
 * The Next.js runtime is not imported here — the handler is a plain
 * `(req: Request) => Promise<Response>` function that Next.js 15 will
 * mount when `src/app/register/route.ts` is picked up by the App Router
 * convention (§Route Handlers, Next.js 15 docs). Keeping the handler
 * framework-neutral lets the dogfood tests exercise it as pure fetch()
 * without booting Next.js — Sub-Issue #857 adds Playwright e2e that
 * boots the actual Next.js runtime.
 *
 * Request shape (JSON) —
 *   { rp, user, challenge, attestation?, authenticatorSelection? }
 * matches {@link RegisterInput}. Response shape (JSON) —
 *   { credentialId, attestationObject, clientDataJSON, discoverable,
 *     signCount, transports }
 * mirrors what a browser client would receive from a SimpleWebAuthn-shaped
 * RP.
 */

import {
  DOGFOOD_USER_VERIFICATION_VALUES,
  type DogfoodUserVerification,
  type RegisterInput,
  type WebAuthnRPAdapter,
} from '../../adapters/interface.js';

export interface RegisterRouteBody {
  rp: RegisterInput['rp'];
  user: RegisterInput['user'];
  challenge: string;
  attestation?: RegisterInput['attestation'];
  authenticatorSelection?: RegisterInput['authenticatorSelection'];
}

/**
 * Validate + narrow a raw query / body userVerification value. Sub-Issue
 * #858 — `?uv=xxx` or a body `userVerification` must be one of the four
 * dogfood values; anything else surfaces as `invalid_user_verification`
 * (400).
 */
export function parseUserVerification(
  raw: string | null | undefined,
): DogfoodUserVerification | null | 'invalid' {
  if (raw === null || raw === undefined || raw === '') return null;
  return (DOGFOOD_USER_VERIFICATION_VALUES as readonly string[]).includes(raw)
    ? (raw as DogfoodUserVerification)
    : 'invalid';
}

export interface RegisterRouteResponse {
  credentialId: string;
  attestationObject: string;
  clientDataJSON: string;
  signCount: number;
  discoverable: boolean;
  transports: string[];
}

/**
 * Build a `POST` handler bound to a specific {@link WebAuthnRPAdapter}
 * instance. The Next.js 15 App Router entry point wires this up as
 * `export const POST = createRegisterHandler(adapter)`.
 */
export function createRegisterHandler(
  adapter: WebAuthnRPAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: RegisterRouteBody;
    try {
      body = (await req.json()) as RegisterRouteBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }

    if (!body.rp?.id || !body.user?.id || !body.challenge) {
      return jsonResponse(400, {
        error: 'missing_fields',
        message: 'rp.id, user.id and challenge are required',
      });
    }

    // Sub-Issue #858 — accept `?uv=required|preferred|discouraged|impossible`
    // as a query override in addition to the body's authenticatorSelection.
    // Query param wins when both are set so a browser-side toggle can flip
    // userVerification without re-encoding the whole body. Any non-empty
    // value that is not one of the four dogfood patterns fails fast with 400.
    const url = safeParseUrl(req.url);
    const queryUV = parseUserVerification(url?.searchParams.get('uv') ?? null);
    const bodyUV = parseUserVerification(
      body.authenticatorSelection?.userVerification ?? null,
    );
    if (queryUV === 'invalid' || bodyUV === 'invalid') {
      return jsonResponse(400, {
        error: 'invalid_user_verification',
        message: `userVerification must be one of ${DOGFOOD_USER_VERIFICATION_VALUES.join(', ')}`,
      });
    }
    const effectiveUV = queryUV ?? bodyUV;

    try {
      // Merge the effective userVerification back into authenticatorSelection
      // so downstream `adapter.register` sees a single canonical shape. When
      // no UV is supplied on either side the field is omitted entirely so
      // kiwa's default (`preferred`) applies.
      const authenticatorSelection = effectiveUV
        ? { ...(body.authenticatorSelection ?? {}), userVerification: effectiveUV }
        : body.authenticatorSelection;
      const input: RegisterInput = {
        rp: body.rp,
        user: body.user,
        challenge: body.challenge,
        ...(body.attestation ? { attestation: body.attestation } : {}),
        ...(authenticatorSelection ? { authenticatorSelection } : {}),
      };
      const result = await adapter.register(input);
      const responseBody: RegisterRouteResponse = {
        credentialId: result.credential.credentialId,
        attestationObject: result.attestationResponse.attestationObject,
        clientDataJSON: result.attestationResponse.clientDataJSON,
        signCount: result.credential.signCount,
        discoverable: result.credential.discoverable,
        transports: result.credential.transports,
      };
      return jsonResponse(200, responseBody);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // `userVerification=impossible` is a user-caused request (client asked
      // for a spec-invalid value) and belongs in 400, not 500. Other adapter
      // failures (env missing / persistence errors) stay 500.
      const status = message.includes('userVerification=impossible') ? 400 : 500;
      return jsonResponse(status, {
        error: 'register_failed',
        message,
      });
    }
  };
}

/**
 * Best-effort parse of the request URL. Route handler tests sometimes hand in
 * a relative URL (`http://localhost/register`) which `new URL()` handles;
 * malformed URLs are rare in practice but a guard keeps the handler from
 * crashing on caller mistakes.
 */
function safeParseUrl(raw: string): URL | null {
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
