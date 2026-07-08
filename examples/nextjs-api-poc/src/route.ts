import type { ApiHandlerSource } from '@kiwa/api';

export interface Item {
  id: number;
  name: string;
}

export function createItemsHandler(): ApiHandlerSource {
  const items: Item[] = [];
  let nextId = 1;

  return {
    kind: 'fetch',
    handler: async (req) => {
      const url = new URL(req.url);
      if (url.pathname !== '/api/items') {
        return new Response('not found', { status: 404 });
      }

      if (req.method === 'GET') {
        return Response.json(items);
      }

      if (req.method === 'POST') {
        let body: { name?: string };
        try {
          body = (await req.json()) as { name?: string };
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 });
        }
        if (!body.name || typeof body.name !== 'string' || body.name.length === 0) {
          return Response.json({ error: 'name required' }, { status: 400 });
        }
        if (body.name.length > 100) {
          return Response.json({ error: 'name too long' }, { status: 422 });
        }
        const created: Item = { id: nextId++, name: body.name };
        items.push(created);
        return Response.json(created, { status: 201 });
      }

      return new Response('method not allowed', { status: 405 });
    },
  };
}
