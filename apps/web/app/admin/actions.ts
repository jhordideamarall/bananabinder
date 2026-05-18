'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Enums, Json, TablesInsert, TablesUpdate } from '@bananasbindery/types/supabase';
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
type CategoryUpdate = TablesUpdate<'categories'>;
type CategoryInsert = TablesInsert<'categories'>;
type StoreSettingsUpdate = TablesUpdate<'store_settings'>;
type StoreSettingsInsert = TablesInsert<'store_settings'>;
type OrderUpdate = TablesUpdate<'orders'>;
type ProductVariantUpdate = TablesUpdate<'product_variants'>;
type ProductVariantInsert = TablesInsert<'product_variants'>;

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

function indexedBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on' || formData.get(key) === 'true';
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
  return value === 'parcel' ? value : 'normal';
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
    const { data, error } = await supabase
      .from('products')
      .insert(insertPayload)
      .select('id')
      .single();
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
    subtitle: nullableText(formData, 'subtitle'),
    description: nullableText(formData, 'description'),
    cta_label: nullableText(formData, 'cta_label'),
    bg_gradient: nullableText(formData, 'bg_gradient'),
    accent_color: nullableText(formData, 'accent_color'),
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

export async function saveCategory(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const categoryId = text(formData, 'id');
  const name = text(formData, 'name');
  const slug = text(formData, 'slug') || slugify(name);
  if (!name || !slug) {
    throw new Error('Nama kategori dan slug wajib diisi.');
  }

  const parentId = nullableText(formData, 'parent_id');

  const payload: CategoryUpdate = {
    name,
    slug,
    description: nullableText(formData, 'description'),
    image_url: nullableText(formData, 'image_url'),
    parent_id: parentId && parentId !== categoryId ? parentId : null,
    sort_order: numberValue(formData, 'sort_order'),
    is_active: checkbox(formData, 'is_active'),
  };

  if (categoryId) {
    const { error } = await supabase.from('categories').update(payload).eq('id', categoryId);
    if (error) throw new Error(error.message);
  } else {
    const insertPayload: CategoryInsert = { ...payload, name, slug };
    const { error } = await supabase.from('categories').insert(insertPayload);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
  revalidatePath('/products');
}

export async function toggleCategoryStatus(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const categoryId = text(formData, 'id');
  if (!categoryId) throw new Error('Category id tidak valid.');

  const { error } = await supabase
    .from('categories')
    .update({ is_active: checkbox(formData, 'is_active') })
    .eq('id', categoryId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/categories');
  revalidatePath('/products');
}

export async function saveStoreSettings(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  // Form label home & form origin pengiriman dipisah — masing-masing hanya
  // meng-update field-nya sendiri supaya tidak saling menimpa.
  const payload: StoreSettingsUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (formData.has('home_banner_promo_label')) {
    payload.home_banner_promo_label = text(formData, 'home_banner_promo_label') || 'Banner Promo';
    payload.home_banner_pilihan_label =
      text(formData, 'home_banner_pilihan_label') || 'Banner Pilihan';
  }

  // Origin pengiriman — origin_area_id dipakai Biteship untuk hitung ongkir
  // berbasis jarak dari toko. lat/lng wajib untuk kurir instant (Gojek/Grab).
  if (formData.has('origin_area_id')) {
    payload.origin_area_id = text(formData, 'origin_area_id') || 'IDNP6M3K2W1';
    payload.origin_address = nullableText(formData, 'origin_address');
    payload.origin_latitude = nullableNumber(formData, 'origin_latitude');
    payload.origin_longitude = nullableNumber(formData, 'origin_longitude');
  }

  // store_settings is a single-row table
  const { data: existing } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('store_settings').update(payload).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const insertPayload: StoreSettingsInsert = payload;
    const { error } = await supabase.from('store_settings').insert(insertPayload);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/admin/promos');
  revalidatePath('/admin/settings');
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
  revalidatePath('/admin/custom-orders');
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function updateCustomOrderControl(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const orderId = text(formData, 'id');
  if (!orderId) throw new Error('Order id tidak valid.');

  const status = orderStatus(text(formData, 'status'));
  const nextPaymentStatus = paymentStatus(text(formData, 'payment_status'));
  const finalTotal = numberValue(formData, 'total');
  const productName = text(formData, 'product_name');
  const variantName = nullableText(formData, 'variant_name');
  const material = text(formData, 'material');
  const personalization = text(formData, 'personalization');
  const notes = nullableText(formData, 'notes');
  const now = new Date().toISOString();

  const payload: OrderUpdate = {
    status,
    payment_status: nextPaymentStatus,
    notes,
    updated_at: now,
  };

  if (finalTotal > 0) {
    payload.subtotal = finalTotal;
    payload.total = finalTotal;
  }
  if (status === 'shipped') payload.shipped_at = now;
  if (status === 'delivered') payload.delivered_at = now;
  if (nextPaymentStatus === 'paid') payload.paid_at = now;

  const { error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', orderId)
    .eq('payment_method', 'custom_request');
  if (error) throw new Error(error.message);

  const { data: items, error: itemReadError } = await supabase
    .from('order_items')
    .select('id, quantity, product_name, variant_name, custom_details')
    .eq('order_id', orderId)
    .limit(1);
  if (itemReadError) throw new Error(itemReadError.message);

  type EditableCustomItem = {
    id: string;
    quantity: number;
    custom_details?: unknown;
  };
  const item = items?.[0] as unknown as EditableCustomItem | undefined;
  if (item) {
    const previousDetails =
      typeof item.custom_details === 'object' && item.custom_details !== null
        ? (item.custom_details as Record<string, unknown>)
        : {};
    const nextDetails: Record<string, unknown> = {
      ...previousDetails,
    };
    if (material) nextDetails.material = material;
    if (personalization) nextDetails.personalization = personalization;

    const quantity = Math.max(1, Number(item.quantity ?? 1));
    const itemPayload: Record<string, unknown> = {
      custom_details: nextDetails as Json,
    };
    if (productName) itemPayload.product_name = productName;
    if (variantName !== undefined) itemPayload.variant_name = variantName;
    if (finalTotal > 0) {
      itemPayload.price = Math.round(finalTotal / quantity);
      itemPayload.subtotal = finalTotal;
    }

    const { error: itemUpdateError } = await supabase
      .from('order_items')
      .update(itemPayload as never)
      .eq('id', item.id);
    if (itemUpdateError) throw new Error(itemUpdateError.message);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/custom-orders');
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/account/orders');
  revalidatePath(`/account/orders/${orderId}`);
}

export async function saveCustomOrderCatalog(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const productId = text(formData, 'product_id');
  const productName = text(formData, 'product_name');
  const productSlug =
    text(formData, 'product_slug') || slugify(productName || 'binder-custom-nama');
  const basePrice = numberValue(formData, 'base_price');
  const productWeight = numberValue(formData, 'product_weight', 500);
  const materialCount = numberValue(formData, 'material_count');
  const rawMaterials =
    materialCount > 0
      ? Array.from({ length: materialCount }, (_, index) => text(formData, `material_${index}`))
          .map((item) => item.trim())
          .filter(Boolean)
      : text(formData, 'materials')
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);
  const seenMaterials = new Set<string>();
  const materials = rawMaterials.filter((item) => {
    const key = item.toLowerCase();
    if (seenMaterials.has(key)) return false;
    seenMaterials.add(key);
    return true;
  });
  const variantCount = numberValue(formData, 'variant_count');

  if (!productId || !productName || !productSlug) {
    throw new Error('Produk custom tidak valid.');
  }
  if (basePrice <= 0) {
    throw new Error('Harga dasar custom harus lebih dari 0.');
  }
  if (materials.length === 0) {
    throw new Error('Minimal 1 bahan custom wajib diisi.');
  }

  const productUpdate: ProductUpdate = {
    name: productName,
    slug: productSlug,
    price: basePrice,
    cost_price: basePrice,
    weight_grams: productWeight,
    is_active: checkbox(formData, 'product_active'),
    updated_at: new Date().toISOString(),
  };

  const { error: productError } = await supabase
    .from('products')
    .update(productUpdate)
    .eq('id', productId);
  if (productError) throw new Error(productError.message);

  const { data: existingVariants, error: existingVariantsError } = await supabase
    .from('product_variants')
    .select('id, name')
    .eq('product_id', productId);
  if (existingVariantsError) throw new Error(existingVariantsError.message);

  const existingVariantIdByName = new Map<string, string>();
  for (const variant of existingVariants ?? []) {
    const key = variant.name.trim().toLowerCase();
    if (key && !existingVariantIdByName.has(key)) {
      existingVariantIdByName.set(key, variant.id);
    }
  }

  const submittedVariantNames = new Set<string>();
  const now = new Date().toISOString();

  for (let index = 0; index < variantCount; index += 1) {
    const id = text(formData, `variant_id_${index}`);
    const name = text(formData, `variant_name_${index}`);
    const price = numberValue(formData, `variant_price_${index}`);
    const promoPrice = nullableNumber(formData, `variant_promo_price_${index}`);
    const stock = numberValue(formData, `variant_stock_${index}`);
    const weight = numberValue(formData, `variant_weight_${index}`, productWeight);
    const isActive = indexedBoolean(formData, `variant_active_${index}`);
    const shouldDelete = indexedBoolean(formData, `variant_delete_${index}`);

    if (shouldDelete && id) {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false, updated_at: now })
        .eq('id', id);
      if (error) throw new Error(error.message);
      continue;
    }

    if (!name) continue;

    const normalizedName = name.toLowerCase();
    if (submittedVariantNames.has(normalizedName)) {
      if (id) {
        const { error } = await supabase
          .from('product_variants')
          .update({ is_active: false, updated_at: now })
          .eq('id', id);
        if (error) throw new Error(error.message);
      }
      continue;
    }
    submittedVariantNames.add(normalizedName);

    const targetVariantId = id || existingVariantIdByName.get(normalizedName) || '';

    if (targetVariantId) {
      const update: ProductVariantUpdate = {
        name,
        price: price > 0 ? price : basePrice,
        promo_price: promoPrice,
        stock,
        weight_grams: weight,
        cost_price: basePrice,
        sort_order: index,
        is_active: isActive,
        updated_at: now,
      };
      const { error } = await supabase
        .from('product_variants')
        .update(update)
        .eq('id', targetVariantId);
      if (error) throw new Error(error.message);
    } else if (!shouldDelete) {
      const insert: ProductVariantInsert = {
        product_id: productId,
        name,
        price: price > 0 ? price : basePrice,
        promo_price: promoPrice,
        stock,
        weight_grams: weight,
        cost_price: basePrice,
        sort_order: index,
        is_active: isActive,
      };
      const { error } = await supabase.from('product_variants').insert(insert);
      if (error) throw new Error(error.message);
    }
  }

  const payload: StoreSettingsUpdate = {
    custom_order_product_slug: productSlug,
    custom_order_materials: materials as unknown as Json,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('store_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('store_settings').update(payload).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('store_settings').insert(payload as StoreSettingsInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath('/custom');
  revalidatePath('/admin/custom-orders');
  revalidatePath('/admin/products');
  revalidatePath(`/products/${productSlug}`);
}

export async function toggleBannerActive(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const bannerId = text(formData, 'id');
  if (!bannerId) throw new Error('Banner id tidak valid.');

  const { error } = await supabase
    .from('banners')
    .update({ is_active: checkbox(formData, 'is_active') })
    .eq('id', bannerId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/promos');
  revalidatePath('/');
}

export async function toggleVoucherActive(formData: FormData): Promise<void> {
  const supabase = await getSupabase();
  await requireAdmin(supabase);

  const voucherId = text(formData, 'id');
  if (!voucherId) throw new Error('Voucher id tidak valid.');

  const { error } = await supabase
    .from('vouchers')
    .update({ is_active: checkbox(formData, 'is_active') })
    .eq('id', voucherId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/promos');
}
