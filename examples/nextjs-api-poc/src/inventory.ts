/**
 * 在庫サービス (外部 HTTP API) の client。
 *
 * `integration` layer の対象は **自分の外にある系との繋ぎ目**で、 `api` layer
 * (`src/route.ts`、 自分が公開する API) とは見る場所が違う。 ここでは応答の分類と
 * 失敗の翻訳だけを持ち、 在庫の計算そのものは持たない。
 *
 * `fetch` を直接呼ぶので、 test では msw が外向きの呼出を捕捉する。
 */

const STOCK_API = 'https://stock.example/v1/items';

export interface Stock {
  readonly sku: string;
  readonly available: number;
}

/** 呼出側が分岐できるよう、 失敗の種類を型で分ける。 */
export class StockUnavailableError extends Error {
  constructor(
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(
      status === undefined ? 'stock service unavailable' : `stock service unavailable (${status})`,
      options,
    );
    this.name = 'StockUnavailableError';
  }
}

export class StockResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StockResponseError';
  }
}

/**
 * SKU の在庫を引く。
 *
 * - 200 かつ想定の形 ... `Stock` を返す
 * - 404 ... **在庫サービスが「知らない」 と答えた** ので `null` (呼出側は 0 と区別できる)
 * - 通信失敗 / 429 / 5xx ... `StockUnavailableError` (再試行してよい失敗)
 * - 本体が読めない / 形が違う ... `StockResponseError` (再試行しても直らない)
 */
export async function fetchStock(sku: string): Promise<Stock | null> {
  const url = `${STOCK_API}/${encodeURIComponent(sku)}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new StockUnavailableError(undefined, { cause });
  }

  if (response.status === 404) return null;
  if (response.status === 429 || response.status >= 500) {
    throw new StockUnavailableError(response.status);
  }
  if (!response.ok) throw new StockResponseError(`unexpected status ${response.status}`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new StockResponseError('response body is not JSON');
  }

  const { sku: gotSku, available } = (body ?? {}) as { sku?: unknown; available?: unknown };
  if (typeof gotSku !== 'string' || typeof available !== 'number') {
    throw new StockResponseError('response body has unexpected shape');
  }
  // 負の在庫は上流の欠陥。 そのまま通すと呼出側の計算が静かに狂う。
  if (available < 0) throw new StockResponseError('available must not be negative');

  return { sku: gotSku, available };
}
