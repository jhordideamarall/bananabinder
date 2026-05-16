import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

interface PaymentCreateBody {
  orderId?: string;
}

interface OrderItemWithProduct {
  product_name?: string | null;
  quantity: number;
  price: number;
  products?: {
    name: string | null;
    weight_grams: number | null;
  } | null;
}

interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  amount: number;
  expiry_date?: string;
}

interface XenditErrorResponse {
  error_code?: string;
  message?: string;
  errors?: unknown[];
}

const XENDIT_URL = 'https://api.xendit.co/v2/invoices';

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createAdminClient(url, key);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parsePaymentCreateBody = (value: unknown): PaymentCreateBody => {
  if (!isRecord(value)) return {};
  return typeof value.orderId === 'string' ? { orderId: value.orderId } : {};
};

export async function POST(req: Request) {
  try {
    const xenditSecretKey = process.env.XENDIT_SECRET_KEY;
    if (!xenditSecretKey) {
      return NextResponse.json({ error: 'Payment provider is not configured' }, { status: 503 });
    }

    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 503 });
    }

    const { orderId } = parsePaymentCreateBody(await req.json());
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('ORDER_FETCH_ERROR:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.payment_status === 'paid' || order.status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 409 });
    }

    if (order.payment_metadata?.invoice_url && order.payment_id) {
      return NextResponse.json({
        token: order.payment_id,
        invoice_url: order.payment_metadata.invoice_url,
      });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, name, phone')
      .eq('id', order.user_id)
      .single();

    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('*, products(name, weight_grams)')
      .eq('order_id', order.id);

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Order items not found' }, { status: 400 });
    }

    const items = (orderItems as unknown as OrderItemWithProduct[]).map((item) => ({
      name: (item.products?.name || item.product_name || 'Produk Bananasbindery').slice(0, 255),
      quantity: item.quantity,
      price: Math.round(Number(item.price)),
    }));

    if (order.shipping_cost && Number(order.shipping_cost) > 0) {
      items.push({
        name: `Ongkir (${order.shipping_courier || 'Kurir'})`,
        quantity: 1,
        price: Math.round(Number(order.shipping_cost)),
      });
    }

    if (order.discount && Number(order.discount) > 0) {
      items.push({ name: 'Diskon', quantity: 1, price: -Math.round(Number(order.discount)) });
    }

    const customerEmail = profile?.email || user.email || 'customer@bananasbindery.com';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host');
    const dynamicBaseUrl = host
      ? `${protocol}://${host}`
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const xenditPayload = {
      external_id: order.order_number,
      amount: Math.round(Number(order.total)),
      payer_email: customerEmail,
      description: `Pembayaran Pesanan ${order.order_number} - Bananasbindery`,
      customer: {
        given_names: profile?.name || user.email?.split('@')[0] || 'Customer',
        email: customerEmail,
        mobile_number: profile?.phone || '',
      },
      items,
      success_redirect_url: `${dynamicBaseUrl}/checkout/success?order_id=${order.id}`,
      failure_redirect_url: `${dynamicBaseUrl}/account/orders`,
      currency: 'IDR',
      reminder_time: 1,
    };

    const authString = Buffer.from(`${xenditSecretKey}:`).toString('base64');
    const response = await fetch(XENDIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(xenditPayload),
    });

    const responseJson = (await response.json()) as XenditInvoiceResponse | XenditErrorResponse;

    if (!response.ok) {
      console.error('XENDIT_CREATE_ERROR:', responseJson);
      return NextResponse.json(
        { error: 'Xendit Error', details: responseJson },
        { status: response.status },
      );
    }

    const invoice = responseJson as XenditInvoiceResponse;

    await supabaseAdmin.from('transactions').insert({
      order_id: order.id,
      amount: Number(order.total),
      provider: 'xendit',
      provider_transaction_id: invoice.id,
      external_id: invoice.external_id,
      status: invoice.status.toLowerCase(),
      raw_response: invoice,
    });

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        payment_id: invoice.id,
        payment_metadata: {
          invoice_url: invoice.invoice_url,
          external_id: invoice.external_id,
          status: invoice.status,
          expiry_date: invoice.expiry_date,
        },
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('PAYMENT_ORDER_UPDATE_ERROR:', updateError);
    }

    return NextResponse.json({ token: invoice.id, invoice_url: invoice.invoice_url });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Internal Server Error');
    console.error('PAYMENT_CREATE_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
