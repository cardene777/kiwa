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

import type { RegisterInput, WebAuthnRPAdapter } from '../../adapters/interface.js';

export interface RegisterRouteBody {
  rp: RegisterInput['rp'];
  user: RegisterInput['user'];
  challenge: string;
  attestation?: RegisterInput['attestation'];
  authenticatorSelection?: RegisterInput['authenticatorSelection'];
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

    try {
      const input: RegisterInput = {
        rp: body.rp,
        user: body.user,
        challenge: body.challenge,
        ...(body.attestation ? { attestation: body.attestation } : {}),
        ...(body.authenticatorSelection
          ? { authenticatorSelection: body.authenticatorSelection }
          : {}),
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
      return jsonResponse(500, {
        error: 'register_failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
