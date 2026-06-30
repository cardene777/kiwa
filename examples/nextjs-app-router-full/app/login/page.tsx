// /login — Server Action 経由で session cookie を set し from に redirect。

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function loginAction(formData: FormData) {
  'use server';
  const session = (formData.get('session') ?? 'guest').toString();
  const from = (formData.get('from') ?? '/').toString();
  const store = await cookies();
  store.set('session', session, { path: '/' });
  redirect(from);
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from ?? '/';
  return (
    <main>
      <h1>Login (kiwa Next.js PoC)</h1>
      <form action={loginAction}>
        <label>
          session value: <input type="text" name="session" defaultValue="admin" />
        </label>
        <input type="hidden" name="from" value={from} />
        <button type="submit">login</button>
      </form>
    </main>
  );
}
