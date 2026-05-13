'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Enums, TablesInsert, TablesUpdate } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES: Enums<'user_role'>[] = ['admin', 'owner', 'staff'];

type ProductType = Enums<'product_type'>;
type VoucherType = Enums<'voucher_type'>;
type OrderStatus = Enums<'order_status'>;
type PaymentStatus = Enums<'payment_status'>;

type ProductUpdate = TablesUpdate<'products'>;
type ProductInsert = TablesInsert<'products'>;
type VoucherUpdate = TablesUpdate<'vouchers'>;
type VoucherInsert = TablesInsert<'vouchers'>;
type BannerUpdate = TablesUpdate<'banners'>;
type BannerInsert = TablesInsert<'banners'>;
type OrderUpdate = TablesUpdate<'orders'>;

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function nullableText(formData: FormData, key: string): string | null {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function numberValue(formData: FormData, key: string, fallback = 0): number {
  const raw = text(formData, key);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function checkbox(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function productType(value: string): ProductType {
  return value === 'frozen' || value === 'parcel' ? value : 'normal';
}

function voucherType(value: string): VoucherType {
  return value === 'fixed' ? 'fixed' : 'percentage';
}

function orderStatus(value: string): OrderStatus {
  const allowed: OrderStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'expired',
    'return_requested',
    'returned',
    'refunded',
  ];
  return allowed.includes(value as OrderStatus) ? (value as OrderStatus) : 'pending';
}

function paymentStatus(value: string): PaymentStatus {
  const allowed: PaymentStatus[] = ['unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid'];
  return allowed.includes(value as PaymentStatus) ? (value as PaymentStatus) : 'unpaid';
}

async function getSupabase(): Promise<TypedSupabaseClient> {
  return (await createClient()) as TypedSupabaseClient;
}

async function requireAdmin(supabase: TypedSupabaseClient): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    redirect('/');
  }
}

export async function saveProduct(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const productId = text(formData, 'id');
  const name = text(formData, 'name');
  const slug = text(formData, 'slug') || slugify(name);
  const imageUrl = nullableText(formData, 'image_url');

  if (!name || !slug) {
    throw new Error('Nama produk dan slug wajib diisi.');
  }

  const payload: ProductUpdate = {
    name,
    slug,
    description: nullableText(formData, 'description'),
    category_id: nullableText(formData, 'category_id'),
    type: productType(text(formData, 'type')),
    price: numberValue(formData, 'price'),
    promo_price: nullableNumber(formData, 'promo_price'),
    cost_price: numberValue(formData, 'cost_price'),
    stock: numberValue(formData, 'stock'),
    weight_grams: numberValue(formData, 'weight_grams'),
    is_active: checkbox(formData, 'is_active'),
    updated_at: new Date().toISOString(),
  };

  let savedProductId = productId;

  if (productId) {
    const { error } = await supabase.from('products').update(payload).eq('id', productId);
    if (error) throw new Error(error.message);
  } else {
    const insertPayload: ProductInsert = {
      ...payload,
      name,
      slug,
    };
    const { data, error } = await supabase.from('products').insert(insertPayload).select('id').single();
    if (error) throw new Error(error.message);
    savedProductId = data.id;
  }

  if (imageUrl) {
    await supabase.from('product_images').delete().eq('product_id', savedProductId);
    const { error } = await supabase.from('product_images').insert({
      product_id: savedProductId,
      url: imageUrl,
      alt_text: name,
      sort_order: 0,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function toggleProductStatus(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const productId = text(formData, 'id');
  if (!productId) throw new Error('Product id tidak valid.');

  const { error } = await supabase
    .from('products')
    .update({ is_active: checkbox(formData, 'is_active'), updated_at: new Date().toISOString() })
    .eq('id', productId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function saveVoucher(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const voucherId = text(formData, 'id');
  const code = text(formData, 'code').toUpperCase();
  if (!code) throw new Error('Kode voucher wajib diisi.');

  const payload: VoucherUpdate = {
    code,
    type: voucherType(text(formData, 'type')),
    value: numberValue(formData, 'value'),
    min_order: nullableNumber(formData, 'min_order'),
    max_discount: nullableNumber(formData, 'max_discount'),
    usage_limit: nullableNumber(formData, 'usage_limit'),
    valid_from: text(formData, 'valid_from'),
    valid_until: text(formData, 'valid_until'),
    is_active: checkbox(formData, 'is_active'),
  };

  if (voucherId) {
    const { error } = await supabase.from('vouchers').update(payload).eq('id', voucherId);
    if (error) throw new Error(error.message);
  } else {
    const insertPayload: VoucherInsert = {
      ...payload,
      code,
      type: voucherType(text(formData, 'type')),
      value: numberValue(formData, 'value'),
      valid_from: text(formData, 'valid_from'),
      valid_until: text(formData, 'valid_until'),
    };
    const { error } = await supabase.from('vouchers').insert(insertPayload);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/promos');
}

export async function saveBanner(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const bannerId = text(formData, 'id');
  const title = text(formData, 'title');
  const imageUrl = text(formData, 'image_url');
  if (!title || !imageUrl) throw new Error('Judul banner dan image URL wajib diisi.');

  const payload: BannerUpdate = {
    title,
    image_url: imageUrl,
    type: text(formData, 'type') || 'promo',
    link: nullableText(formData, 'link'),
    priority: numberValue(formData, 'priority'),
    start_date: nullableText(formData, 'start_date'),
    end_date: nullableText(formData, 'end_date'),
    is_active: checkbox(formData, 'is_active'),
  };

  if (bannerId) {
    const { error } = await supabase.from('banners').update(payload).eq('id', bannerId);
    if (error) throw new Error(error.message);
  } else {
    const insertPayload: BannerInsert = {
      ...payload,
      title,
      image_url: imageUrl,
      type: text(formData, 'type') || 'promo',
    };
    const { error } = await supabase.from('banners').insert(insertPayload);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/promos');
  revalidatePath('/');
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const orderId = text(formData, 'id');
  if (!orderId) throw new Error('Order id tidak valid.');

  const status = orderStatus(text(formData, 'status'));
  const now = new Date().toISOString();
  const payload: OrderUpdate = {
    status,
    payment_status: paymentStatus(text(formData, 'payment_status')),
    shipping_tracking: nullableText(formData, 'shipping_tracking'),
    notes: nullableText(formData, 'notes'),
    updated_at: now,
  };

  if (status === 'shipped') payload.shipped_at = now;
  if (status === 'delivered') payload.delivered_at = now;
  if (payload.payment_status === 'paid') payload.paid_at = now;

  const { error } = await supabase.from('orders').update(payload).eq('id', orderId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
}
