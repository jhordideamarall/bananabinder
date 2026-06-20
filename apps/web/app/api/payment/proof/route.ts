import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database, Json, TablesInsert } from '@bananasbindery/types/supabase';
import {
  parseManualPaymentSettings,
  resolveManualPaymentDestination,
} from '@bananasbindery/api-client/manual-payment';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BUCKET = 'payment-proofs';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'bukti-transfer'
  );
}

function numericField(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function stringField(value: FormDataEntryValue | null): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Silakan login dulu untuk upload bukti transfer.' },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const orderId = stringField(formData.get('orderId'));
    const destinationId = stringField(formData.get('destinationId'));
    const submittedAmount = numericField(formData.get('submittedAmount'));
    const file = formData.get('file');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib ada.' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File bukti transfer tidak ditemukan.' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Format bukti harus JPG, PNG, WebP, HEIC, HEIF, atau PDF.' },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran bukti maksimal 5MB.' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, payment_status, total, payment_metadata')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Order bukan milik user ini.' }, { status: 403 });
    }
    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order ini sudah dibayar.' }, { status: 409 });
    }
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Bukti transfer hanya bisa diupload untuk order pending.' },
        { status: 409 },
      );
    }

    const { data: latestProof } = await supabaseAdmin
      .from('payment_proofs')
      .select('id, status')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestProof?.status === 'submitted' || latestProof?.status === 'approved') {
      return NextResponse.json(
        { error: 'Bukti transfer sebelumnya masih menunggu review atau sudah disetujui.' },
        { status: 409 },
      );
    }

    const { data: settingsRow } = await supabaseAdmin
      .from('store_settings')
      .select(
        'manual_payment_enabled, manual_payment_qr_image_url, manual_payment_instructions, manual_payment_expires_hours, manual_payment_accounts',
      )
      .limit(1)
      .maybeSingle();
    const manualSettings = parseManualPaymentSettings(settingsRow);
    if (!manualSettings.enabled || !manualSettings.hasActiveDestination) {
      return NextResponse.json(
        { error: 'Payment manual belum dikonfigurasi admin.' },
        { status: 503 },
      );
    }

    const destination = resolveManualPaymentDestination(manualSettings, destinationId);
    if (!destination) {
      return NextResponse.json({ error: 'Tujuan pembayaran tidak valid.' }, { status: 400 });
    }

    const path = `${user.id}/${order.id}/${randomUUID()}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const proofPayload: TablesInsert<'payment_proofs'> = {
      order_id: order.id,
      user_id: user.id,
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      submitted_amount: submittedAmount ?? Number(order.total),
      payment_destination_type: destination.type,
      payment_destination_id: destination.id,
      payment_destination_label: destination.label,
      status: 'submitted',
      metadata: {
        source: 'customer_upload',
        order_total: Number(order.total),
      },
    };

    const { data: proof, error: insertError } = await supabaseAdmin
      .from('payment_proofs')
      .insert(proofPayload)
      .select('id')
      .single();

    if (insertError || !proof) {
      return NextResponse.json(
        { error: insertError?.message || 'Gagal menyimpan bukti transfer.' },
        { status: 500 },
      );
    }

    const now = new Date().toISOString();
    await supabaseAdmin
      .from('orders')
      .update({
        payment_method: 'manual_transfer',
        payment_metadata: {
          ...jsonRecord(order.payment_metadata),
          manual_payment: {
            proof_id: proof.id,
            proof_status: 'submitted',
            submitted_at: now,
            destination,
          },
        } as Json,
        updated_at: now,
      })
      .eq('id', order.id);

    return NextResponse.json({ proofId: proof.id, status: 'submitted' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Internal Server Error');
    console.error('PAYMENT_PROOF_UPLOAD_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
