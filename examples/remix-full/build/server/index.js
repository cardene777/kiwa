import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, redirect as redirect$1 } from "@remix-run/node";
import { RemixServer, Meta, Links, Outlet, ScrollRestoration, Scripts, useLoaderData, useActionData, Form, useSearchParams } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, _loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url, abortDelay: ABORT_DELAY }),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url, abortDelay: ABORT_DELAY }),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
function App() {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width,initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
function redirect(location, status = 302) {
  return new Response(null, { status, headers: { location } });
}
function json(body, init) {
  const headers2 = new Headers(init == null ? void 0 : init.headers);
  if (!headers2.has("content-type")) headers2.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers: headers2 });
}
var DEFERRED_DATA_SYMBOL = /* @__PURE__ */ Symbol.for("kiwa.remix.deferredData");
function defer(data, init) {
  return typeof init === "undefined" ? { [DEFERRED_DATA_SYMBOL]: true, data } : { [DEFERRED_DATA_SYMBOL]: true, data, init };
}
async function dashboardProfileLoader(args) {
  const parent = args.context.parentData;
  if (typeof parent === "undefined" || typeof parent.user === "undefined") {
    return json({ error: "parent layout not loaded" }, { status: 401 });
  }
  const unread = parent.user.role === "admin" ? 7 : 0;
  const badges = (async () => {
    await Promise.resolve();
    return parent.user.role === "admin" ? ["core-contributor", "beta-tester"] : ["newcomer"];
  })();
  return defer({
    username: parent.user.id,
    unread,
    badges
  });
}
const dashboardProfileHeaders = ({
  loaderHeaders,
  parentHeaders
}) => {
  const h = new Headers(parentHeaders);
  const profileVersion = loaderHeaders.get("x-profile-version");
  if (profileVersion !== null) h.set("x-profile-version", profileVersion);
  h.set("x-profile-version", "v1");
  return h;
};
const loader$4 = async ({ request, params, context }) => {
  return dashboardProfileLoader({
    context
  });
};
const headers$1 = dashboardProfileHeaders;
function DashboardProfile() {
  const data = useLoaderData();
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsxs("h2", { children: [
      "Profile of ",
      data.username
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "unread: ",
      data.unread
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DashboardProfile,
  headers: headers$1,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
function readSessionCookie(request) {
  const cookie = request.headers.get("cookie");
  if (cookie === null) return null;
  const match = /(?:^|;\s*)session=([^;]+)/.exec(cookie);
  return match !== null && typeof match[1] === "string" ? decodeURIComponent(match[1]) : null;
}
function resolveUser(request) {
  const session = readSessionCookie(request);
  if (session === null) return null;
  if (session === "admin") return { id: "u1", role: "admin" };
  if (session === "banned") return { id: "u2", role: "banned" };
  return { id: "guest", role: "guest" };
}
const state = { count: 0 };
async function loader$3(args) {
  const user = resolveUser(args.request);
  if (user === null) return json({ error: "unauthenticated" }, { status: 401 });
  if (user.role === "banned") return json({ error: "banned" }, { status: 403 });
  return json({ count: state.count, user: user.id });
}
async function action$3(args) {
  const user = resolveUser(args.request);
  if (user === null) return json({ error: "unauthenticated" }, { status: 401 });
  if (user.role === "banned") return json({ error: "banned" }, { status: 403 });
  const formData = await args.request.formData();
  const deltaRaw = (formData.get("delta") ?? "").toString().trim();
  const delta = Number.parseInt(deltaRaw, 10);
  if (!Number.isFinite(delta)) {
    return json({ field: "delta", message: "delta must be an integer" }, { status: 400 });
  }
  state.count += delta;
  return json({ count: state.count, user: user.id });
}
const itemsResourceRoute = { loader: loader$3, action: action$3 };
const loader$2 = itemsResourceRoute.loader;
const action$2 = itemsResourceRoute.action;
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function dashboardLayoutLoader(args) {
  const user = resolveUser(args.request);
  if (user === null) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date(args.request.headers.get("x-test-now") ?? "2026-06-30T00:00:00Z").toISOString();
  const data = { user: { id: user.id, role: user.role }, lastVisitAt: now };
  return json(data, {
    headers: {
      "cache-control": "private, max-age=30",
      // /dashboard を訪問するたびに last-visit cookie を更新 (子 route まで持ち越す)
      "set-cookie": `lastVisit=${encodeURIComponent(now)}; Path=/dashboard; HttpOnly`
    }
  });
}
const dashboardLayoutHeaders = ({
  loaderHeaders,
  parentHeaders
}) => {
  const h = new Headers(parentHeaders);
  const cc = loaderHeaders.get("cache-control");
  if (cc !== null) h.set("cache-control", cc);
  return h;
};
const loader$1 = async ({ request, params, context }) => {
  return dashboardLayoutLoader({
    request
  });
};
const headers = dashboardLayoutHeaders;
function DashboardLayout() {
  const data = useLoaderData();
  return /* @__PURE__ */ jsxs("main", { children: [
    /* @__PURE__ */ jsx("h1", { children: "kiwa Remix nested route PoC" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "signed in: ",
      /* @__PURE__ */ jsx("strong", { children: data.user.id }),
      " (",
      data.user.role,
      ") — last visit:",
      " ",
      /* @__PURE__ */ jsx("time", { dateTime: data.lastVisitAt, children: data.lastVisitAt })
    ] }),
    /* @__PURE__ */ jsx(Outlet, {})
  ] });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: DashboardLayout,
  headers,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
function Index() {
  return /* @__PURE__ */ jsxs("main", { children: [
    /* @__PURE__ */ jsx("h1", { children: "kiwa Remix PoC" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "This example demonstrates ",
      /* @__PURE__ */ jsx("code", { children: "@kiwa-test/remix" }),
      " v1.0.x 全 2 helper (",
      /* @__PURE__ */ jsx("code", { children: "invokeLoader" }),
      " + ",
      /* @__PURE__ */ jsx("code", { children: "invokeAction" }),
      " + ",
      /* @__PURE__ */ jsx("code", { children: "invokeResourceRoute" }),
      ") on a real Remix v2 project."
    ] }),
    /* @__PURE__ */ jsxs("ul", { children: [
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("a", { href: "/items", children: "/items" }),
        " — UI route loader + action (form)"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("a", { href: "/api/items", children: "/api/items" }),
        " — Resource Route (JSON)"
      ] }),
      /* @__PURE__ */ jsxs("li", { children: [
        /* @__PURE__ */ jsx("a", { href: "/login", children: "/login" }),
        " — set session cookie"
      ] })
    ] })
  ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
const ITEMS = [
  { id: 1, name: "kiwa", tags: ["test", "framework"] },
  { id: 2, name: "remix", tags: ["framework", "react"] },
  { id: 3, name: "vite", tags: ["runtime", "bundler"] }
];
async function itemsLoader(args) {
  const url = new URL(args.request.url);
  const user = resolveUser(args.request);
  if (user === null) {
    return redirect(`/login?from=${encodeURIComponent(url.pathname)}`, 302);
  }
  if (user.role === "banned") {
    return json({ error: "banned" }, { status: 403 });
  }
  const tagParams = url.searchParams.getAll("tag");
  let filtered = ITEMS;
  if (tagParams.length > 0) {
    filtered = ITEMS.filter((item) => tagParams.some((t) => item.tags.includes(t)));
  }
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw !== null ? Number.parseInt(limitRaw, 10) : Number.NaN;
  if (Number.isFinite(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  const data = { items: filtered, count: filtered.length, user: user.id };
  return json(data, { headers: { "cache-control": "public, max-age=60" } });
}
async function createItemAction(args) {
  const user = resolveUser(args.request);
  if (user === null) {
    return redirect("/login", 302);
  }
  if (user.role === "banned") {
    return json({ error: "banned" }, { status: 403 });
  }
  const formData = await args.request.formData();
  const name = (formData.get("name") ?? "").toString().trim();
  if (name.length === 0) {
    const fail = { field: "name", message: "name is required" };
    return json(fail, { status: 400 });
  }
  if (name.length < 2) {
    const fail = { field: "name", message: "name must be at least 2 characters" };
    return json(fail, { status: 400 });
  }
  if (name === "danger") {
    throw new Error("danger forbidden");
  }
  const url = new URL(args.request.url);
  const seedRaw = url.searchParams.get("seed") ?? "100";
  const seed = Number.parseInt(seedRaw, 10);
  const baseSeed = Number.isFinite(seed) ? seed : 100;
  const id = baseSeed + name.length;
  const result = { id, name };
  return json(result, {
    headers: { "set-cookie": `last-created=${id}; Path=/` }
  });
}
const loader = async ({ request, params, context }) => {
  return itemsLoader({ request });
};
const action$1 = async ({ request, params, context }) => {
  return createItemAction({ request });
};
function ItemsRoute() {
  const data = useLoaderData();
  const result = useActionData();
  const successResult = result && "id" in result ? result : null;
  const failureResult = result && "field" in result ? result : null;
  return /* @__PURE__ */ jsxs("main", { children: [
    /* @__PURE__ */ jsx("h1", { children: "kiwa Remix PoC" }),
    /* @__PURE__ */ jsxs("p", { children: [
      "signed in as: ",
      /* @__PURE__ */ jsx("strong", { children: data.user ?? "guest" }),
      " (",
      data.count,
      " items)"
    ] }),
    /* @__PURE__ */ jsx("ul", { children: data.items.map((item) => /* @__PURE__ */ jsxs("li", { children: [
      /* @__PURE__ */ jsx("strong", { children: item.name }),
      " — tags: ",
      item.tags.join(", ")
    ] }, item.id)) }),
    /* @__PURE__ */ jsx("h2", { children: "Create new item" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "name: ",
        /* @__PURE__ */ jsx("input", { type: "text", name: "name", required: true, minLength: 2 })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", children: "create" })
    ] }),
    successResult ? /* @__PURE__ */ jsxs("p", { "data-testid": "create-success", children: [
      "created id=",
      successResult.id,
      " name=",
      successResult.name
    ] }) : null,
    failureResult ? /* @__PURE__ */ jsxs("p", { "data-testid": "create-error", children: [
      "error: ",
      failureResult.message
    ] }) : null
  ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  default: ItemsRoute,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const action = async ({ request }) => {
  const url = new URL(request.url);
  const formData = await request.formData();
  const session = (formData.get("session") ?? "guest").toString();
  const from = url.searchParams.get("from") ?? "/";
  return redirect$1(from, {
    headers: { "set-cookie": `session=${encodeURIComponent(session)}; Path=/` }
  });
};
function Login() {
  const [params] = useSearchParams();
  const from = params.get("from") ?? "/";
  return /* @__PURE__ */ jsxs("main", { children: [
    /* @__PURE__ */ jsx("h1", { children: "Login (kiwa PoC)" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", children: [
      /* @__PURE__ */ jsxs("label", { children: [
        "session value: ",
        /* @__PURE__ */ jsx("input", { type: "text", name: "session", defaultValue: "admin" })
      ] }),
      /* @__PURE__ */ jsx("input", { type: "hidden", name: "from", value: from }),
      /* @__PURE__ */ jsx("button", { type: "submit", children: "login" })
    ] })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Login
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-EG3bRcJT.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CINUL_JZ.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] }, "routes/dashboard.profile": { "id": "routes/dashboard.profile", "parentId": "routes/dashboard", "path": "profile", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard.profile-DPHIz-P7.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] }, "routes/api.items": { "id": "routes/api.items", "parentId": "root", "path": "api/items", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/api.items-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard-eIbZx8Gs.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-DufK84eu.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js"], "css": [] }, "routes/items": { "id": "routes/items", "parentId": "root", "path": "items", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/items-e_w6RJ1V.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/login-DcMnQ6e1.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-BTLEhIi7.js"], "css": [] } }, "url": "/assets/manifest-8e77c715.js", "version": "8e77c715" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": false, "v3_relativeSplatPath": false, "v3_throwAbortReason": false, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/dashboard.profile": {
    id: "routes/dashboard.profile",
    parentId: "routes/dashboard",
    path: "profile",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/api.items": {
    id: "routes/api.items",
    parentId: "root",
    path: "api/items",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route4
  },
  "routes/items": {
    id: "routes/items",
    parentId: "root",
    path: "items",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
