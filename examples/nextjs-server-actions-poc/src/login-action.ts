// Server Action under test (Pattern A from skill references/server-action-seam.md).
//
// In a real Next.js project the file would start with 'use server' and the
// default env would import from 'next/navigation' / 'next/headers'. We omit
// the directive + the real Next.js bindings here because the PoC is a pure
// Vitest workspace — but the runtime shape is identical.

import { REDIRECT_SYMBOL } from '@kiwa/nextjs';

export interface LoginEnv {
  redirect: (url: string) => never;
  cookies: { set: (name: string, value: string) => void };
}

export const defaultLoginEnv: LoginEnv = {
  redirect: (url) => {
    // In production this would call `next/navigation`'s redirect(). Here we
    // throw the kiwa signal so even ad-hoc usage stays predictable.
    throw {
      [REDIRECT_SYMBOL]: true,
      url,
      type: 'replace' as const,
    };
  },
  cookies: {
    set: () => {
      // In production this would call cookies().set(). The PoC does not
      // persist anywhere — tests pass their own seam.
    },
  },
};

export async function login(formData: FormData, env: LoginEnv = defaultLoginEnv) {
  const email = formData.get('email');
  if (typeof email !== 'string' || email.length === 0) {
    throw new Error('email required');
  }
  if (!email.includes('@')) {
    throw new Error('invalid email');
  }
  env.cookies.set('session', `sid_${email}`);
  env.redirect('/dashboard');
  // Unreachable in normal flow; kept so TS inference stays happy.
  return { ok: true } as const;
}
