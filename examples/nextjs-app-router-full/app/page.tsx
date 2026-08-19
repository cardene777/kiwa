export default function Home() {
  return (
    <main>
      <h1>kiwa Next.js App Router PoC</h1>
      <p>
        This example demonstrates <code>@kiwa-lab/nextjs</code> v2.0.0 の 5 helper + Route
        Handler。Server Actions / middleware / RSC / Route Handler は real Next.js v15 project
        に統合し、Parallel Routes / RSC streaming は pure test seam で扱う。
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
