import { NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, defineChain, http, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { userOperationFromJson, type UserOperationJson } from '@/lib/aa';
import { sendUserOperation } from '@/lib/server-bundler';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { userOp?: UserOperationJson };
    if (!payload.userOp) {
      return NextResponse.json({ error: 'userOp is required' }, { status: 400 });
    }

    const port = Number(process.env.NEXT_PUBLIC_ANVIL_PORT ?? 8545);
    const chain = defineChain({
      id: 31337,
      name: 'Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [`http://127.0.0.1:${port}`] } },
    });
    const bundler = privateKeyToAccount(requireEnv('BUNDLER_PRIVATE_KEY') as `0x${string}`);
    const entryPoint = requireEnv('NEXT_PUBLIC_ENTRY_POINT') as Address;
    const publicClient = createPublicClient({ chain, transport: http() });
    const walletClient = createWalletClient({
      account: bundler,
      chain,
      transport: http(),
    });

    const hash = await sendUserOperation(
      walletClient,
      publicClient,
      entryPoint,
      userOperationFromJson(payload.userOp),
    );

    return NextResponse.json({ hash });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
