// login.tsx — test fixture 用 login page。 form submit で session cookie を set し、 from に redirect。

import { type ActionFunctionArgs, redirect } from '@remix-run/node';
import { Form, useSearchParams } from '@remix-run/react';

export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  const url = new URL(request.url);
  const formData = await request.formData();
  const session = (formData.get('session') ?? 'guest').toString();
  const from = url.searchParams.get('from') ?? '/';
  return redirect(from, {
    headers: { 'set-cookie': `session=${encodeURIComponent(session)}; Path=/` },
  });
};

export default function Login() {
  const [params] = useSearchParams();
  const from = params.get('from') ?? '/';
  return (
    <main>
      <h1>Login (kiwa PoC)</h1>
      <Form method="post">
        <label>
          session value: <input type="text" name="session" defaultValue="admin" />
        </label>
        <input type="hidden" name="from" value={from} />
        <button type="submit">login</button>
      </Form>
    </main>
  );
}
