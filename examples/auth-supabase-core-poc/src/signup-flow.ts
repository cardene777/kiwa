import type { SupabaseAuthTestEnv } from '@kiwa-lab/auth';

/**
 * A small signup + email confirmation flow stitched together so the PoC proves
 * the `signUp → magic link → verifyOtp → session` loop end-to-end without
 * booting a real Supabase project. Mirrors what a production Supabase-backed
 * SaaS onboarding pipeline exercises.
 */
export interface SignupResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * Create a new user account, wait for the magic-link OTP delivery, and consume
 * it — returning the authenticated session tokens.
 */
export async function completeSignupFlow(
  env: SupabaseAuthTestEnv,
  input: { email: string; password: string; userMetadata?: Record<string, unknown> },
): Promise<SignupResult> {
  // Step 1 — signUp. Real Supabase returns a null session until the user
  // confirms their email; the PoC mirrors that.
  const signupInput: Parameters<typeof env.auth.signUp>[0] = {
    email: input.email,
    password: input.password,
  };
  if (input.userMetadata) signupInput.options = { data: input.userMetadata };
  const { user, session: signupSession } = await env.auth.signUp(signupInput);
  if (signupSession !== null) {
    throw new Error('completeSignupFlow: expected null session on signup pending email confirm');
  }
  // Step 2 — request a magic link OTP.
  const { otp } = await env.auth.signInWithOtp({
    email: input.email,
    options: { shouldCreateUser: false },
  });
  // Step 3 — consume the OTP → session issued.
  const { session } = await env.auth.verifyOtp({
    email: input.email,
    token: otp.code,
    type: 'magiclink',
  });
  return {
    userId: user.id,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

/**
 * Given a set of OAuth callback params, complete the PKCE exchange and return
 * the authenticated session tokens.
 */
export async function completeOAuthCallback(
  env: SupabaseAuthTestEnv,
  input: { code: string; codeVerifier: string },
): Promise<SignupResult> {
  const { user, session } = await env.auth.exchangeCodeForSession(input);
  return {
    userId: user.id,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
}

/**
 * Verify an incoming bearer token, returning `null` when unauthorized.
 * Mirrors what a Supabase-backed API route would do at the edge.
 */
export async function requireAuthenticatedUser(
  env: SupabaseAuthTestEnv,
  bearerToken: string,
): Promise<{ userId: string; email: string | undefined } | null> {
  try {
    const claims = await env.verifyToken(bearerToken);
    return { userId: claims.sub, email: claims.email };
  } catch {
    return null;
  }
}
