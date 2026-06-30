export default function Index() {
  return (
    <main>
      <h1>kiwa Remix PoC</h1>
      <p>
        This example demonstrates <code>@kiwa-test/remix</code> v1.0.x 全 2 helper
        (<code>invokeLoader</code> + <code>invokeAction</code> + <code>invokeResourceRoute</code>)
        on a real Remix v2 project.
      </p>
      <ul>
        <li>
          <a href="/items">/items</a> — UI route loader + action (form)
        </li>
        <li>
          <a href="/api/items">/api/items</a> — Resource Route (JSON)
        </li>
        <li>
          <a href="/login">/login</a> — set session cookie
        </li>
      </ul>
    </main>
  );
}
