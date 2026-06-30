export default function Home() {
  return (
    <main>
      <h1>kiwa Next.js App Router PoC</h1>
      <p>
        This example demonstrates <code>@kiwa-test/nextjs</code> v1.0.x の 3 helper
        (<code>invokeServerAction</code> + <code>invokeMiddleware</code> + <code>renderServerComponent</code>)
        + Route Handler を real Next.js v15 project に統合。
      </p>
      <ul>
        <li>
          <a href="/items">/items</a> — RSC page + Server Action form
        </li>
        <li>
          <a href="/api/items">/api/items</a> — Route Handler (JSON)
        </li>
        <li>
          <a href="/login">/login</a> — set session cookie
        </li>
      </ul>
    </main>
  );
}
