import { NextResponse } from 'next/server';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import {
  getProductChatThread,
  sendProductChatMessage,
  type ProductChatContext,
} from '@bananasbindery/api-client/chat';
import { createClient } from '@/lib/supabase/server';

interface ChatRequestBody {
  productId?: string;
  productName?: string;
  productSlug?: string | null;
  productImageUrl?: string | null;
  variantId?: string | null;
  variantName?: string | null;
  message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readOptionalString = (value: unknown): string | null | undefined => {
  if (typeof value === 'string') return value;
  if (value === null) return null;
  return undefined;
};

const parseBody = (value: unknown): ChatRequestBody => {
  if (!isRecord(value)) return {};
  return {
    productId: typeof value.productId === 'string' ? value.productId : undefined,
    productName: typeof value.productName === 'string' ? value.productName : undefined,
    productSlug: readOptionalString(value.productSlug),
    productImageUrl: readOptionalString(value.productImageUrl),
    variantId: readOptionalString(value.variantId),
    variantName: readOptionalString(value.variantName),
    message: typeof value.message === 'string' ? value.message : undefined,
  };
};

const getTypedSupabase = async (): Promise<TypedSupabaseClient> =>
  (await createClient()) as unknown as TypedSupabaseClient;

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const supabase = await getTypedSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = new URL(req.url).searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const thread = await getProductChatThread(supabase, user.id, productId);
    return NextResponse.json(thread);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal memuat chat.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const supabase = await getTypedSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = parseBody(await req.json());
    if (!body.productId || !body.productName || !body.message) {
      return NextResponse.json(
        { error: 'Product ID, product name, dan message wajib diisi.' },
        { status: 400 },
      );
    }

    const context: ProductChatContext = {
      productId: body.productId,
      productName: body.productName,
      productSlug: body.productSlug,
      productImageUrl: body.productImageUrl,
      variantId: body.variantId,
      variantName: body.variantName,
    };

    const thread = await sendProductChatMessage(supabase, user.id, context, body.message);
    return NextResponse.json(thread);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengirim chat.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
