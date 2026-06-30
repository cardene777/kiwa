// items.tsx — Remix UI route。 thin wrapper として _kiwa の pure loader / action を re-invoke する。

import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { itemsLoader } from '../lib/_kiwa/items-loader.js';
import { createItemAction } from '../lib/_kiwa/items-action.js';
import type { CreateItemFailure, CreateItemSuccess } from '../lib/_kiwa/items-action.js';
import type { ItemsLoaderData } from '../lib/_kiwa/items-loader.js';

export const loader = async ({ request, params, context }: LoaderFunctionArgs): Promise<Response> => {
  return itemsLoader({ request, params: params as Record<string, string>, context: context as Record<string, unknown> });
};

export const action = async ({ request, params, context }: ActionFunctionArgs): Promise<Response> => {
  return createItemAction({ request, params: params as Record<string, string>, context: context as Record<string, unknown> });
};

export default function ItemsRoute() {
  const data = useLoaderData<ItemsLoaderData>();
  const result = useActionData<CreateItemSuccess | CreateItemFailure>();
  const successResult = result && 'id' in result ? result : null;
  const failureResult = result && 'field' in result ? result : null;

  return (
    <main>
      <h1>kiwa Remix PoC</h1>
      <p>
        signed in as: <strong>{data.user ?? 'guest'}</strong> ({data.count} items)
      </p>
      <ul>
        {data.items.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong> — tags: {item.tags.join(', ')}
          </li>
        ))}
      </ul>
      <h2>Create new item</h2>
      <Form method="post">
        <label>
          name: <input type="text" name="name" required minLength={2} />
        </label>
        <button type="submit">create</button>
      </Form>
      {successResult ? (
        <p data-testid="create-success">
          created id={successResult.id} name={successResult.name}
        </p>
      ) : null}
      {failureResult ? (
        <p data-testid="create-error">error: {failureResult.message}</p>
      ) : null}
    </main>
  );
}
