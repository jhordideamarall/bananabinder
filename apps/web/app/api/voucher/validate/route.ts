import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface VoucherPreview {
  valid: boolean;
  discount: number;
  code?: string;
  message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Preview voucher untuk cart/checkout.
 * Perhitungan FINAL tetap di create_order_v1 (anti-fraud) — route ini hanya UI preview.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (!isRecord(body) || typeof body.code !== 'string') {
      return NextResponse.json(
        { valid: false, discount: 0, message: 'Kode voucher tidak valid' },
        { status: 400 },
      );
    }

    const code = body.code.trim();
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0;

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('preview_voucher_v1', {
      p_code: code,
      p_subtotal: subtotal,
    });

    if (error) {
      console.error('VOUCHER_VALIDATE_ERROR:', error.message);
      return NextResponse.json(
        { valid: false, discount: 0, message: 'Gagal memeriksa voucher' },
        { status: 500 },
      );
    }

    return NextResponse.json(data as unknown as VoucherPreview);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('VOUCHER_VALIDATE_ERROR:', message);
    return NextResponse.json({ valid: false, discount: 0, message }, { status: 500 });
  }
}
