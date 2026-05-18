import type { Tables, TablesInsert, TablesUpdate } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';

type ClientInput =
  | TypedSupabaseClient
  | Promise<TypedSupabaseClient>
  | (() => Promise<TypedSupabaseClient>);

async function client(input: ClientInput): Promise<TypedSupabaseClient> {
  if (typeof input === 'function') {
    return input();
  }
  return input;
}

export interface AdminProductImage {
  url: string;
  sort_order: number | null;
}

export interface AdminProductVariant {
  id?: string;
  name: string;
  stock: number | null;
  price: number;
  promo_price: number | null;
  image_url: string | null;
  weight_grams: number | null;
  sort_order: number | null;
  is_active: boolean | null;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  price: number;
  promo_price: number | null;
  cost_price: number;
  stock: number | null;
  weight_grams: number | null;
  is_active: boolean | null;
  productImages: AdminProductImage[];
  productVariants: AdminProductVariant[];
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  pendingOrders: number;
}

export interface AdminChartDay {
  date: string;
  revenue: number;
}

export interface AdminOrder {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface AdminProductPayload {
  name: string;
  slug: string;
  description: string | null;
  category_id?: string | null;
  base_price: number;
  promo_price?: number | null;
  weight: number;
  is_active: boolean;
  variants: {
    id?: string | null;
    cover_color?: string;
    paper_type?: string;
    ring_size?: string;
    stock: number;
    weight_grams?: number | null;
    price_override?: number | null;
    image_url?: string | null;
  }[];
  images: {
    url: string;
    sort_order: number;
  }[];
}

type ProductRow = Tables<'products'>;
type ProductImageRow = Tables<'product_images'>;
type ProductVariantRow = Tables<'product_variants'>;
type CategoryRow = Tables<'categories'>;
type OrderRow = Tables<'orders'>;
type VoucherRow = Tables<'vouchers'>;

interface ProductRowWithRelations extends ProductRow {
  product_images?: ProductImageRow[] | null;
  product_variants?: ProductVariantRow[] | null;
  categories?: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
}

interface OrderRowWithProfile extends OrderRow {
  profiles?: {
    name: string | null;
    phone: string | null;
  } | null;
}

function toAdminProduct(product: ProductRowWithRelations): AdminProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category_id: product.category_id,
    category: product.categories
      ? {
          id: product.categories.id,
          name: product.categories.name,
          slug: product.categories.slug,
        }
      : null,
    price: product.price,
    promo_price: product.promo_price,
    cost_price: product.cost_price,
    stock: product.stock,
    weight_grams: product.weight_grams,
    is_active: product.is_active,
    productImages: (product.product_images ?? [])
      .map((image) => ({ url: image.url, sort_order: image.sort_order }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    productVariants: (product.product_variants ?? [])
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        stock: variant.stock,
        price: variant.price,
        promo_price: variant.promo_price,
        image_url: variant.image_url,
        weight_grams: variant.weight_grams,
        sort_order: variant.sort_order,
        is_active: variant.is_active,
      }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  };
}

export async function getAdminProducts(supabaseInput: ClientInput): Promise<AdminProduct[]> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('products')
    .select(
      '*, categories(id, name, slug), product_images(url, sort_order), product_variants(id, name, stock, price, promo_price, image_url, weight_grams, sort_order)',
    )
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ProductRowWithRelations[]).map(toAdminProduct);
}

export async function getAdminProductDetail(
  supabaseInput: ClientInput,
  id: string,
): Promise<AdminProduct | null> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('products')
    .select(
      '*, categories(id, name, slug), product_images(url, sort_order), product_variants(id, name, stock, price, promo_price, image_url, weight_grams, sort_order)',
    )
    .eq('id', id)
    .single();

  if (error) return null;
  return toAdminProduct(data as unknown as ProductRowWithRelations);
}

function variantName(variant: AdminProductPayload['variants'][number]): string {
  return (
    [variant.cover_color, variant.paper_type, variant.ring_size].filter(Boolean).join(' / ') ||
    'Default'
  );
}

export async function createAdminProduct(
  supabaseInput: ClientInput,
  payload: AdminProductPayload,
): Promise<{ id: string }> {
  const supabase = await client(supabaseInput);
  const productInsert: TablesInsert<'products'> = {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    category_id: payload.category_id ?? null,
    price: payload.base_price,
    promo_price: payload.promo_price ?? null,
    cost_price: payload.base_price,
    stock: payload.variants.reduce((sum, variant) => sum + variant.stock, 0),
    weight_grams: payload.weight,
    is_active: payload.is_active,
    type: 'normal',
  };

  const { data: product, error } = await supabase
    .from('products')
    .insert(productInsert)
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  await replaceProductRelations(supabase, product.id, payload);
  return { id: product.id };
}

export async function updateAdminProduct(
  supabaseInput: ClientInput,
  id: string,
  payload: AdminProductPayload,
): Promise<{ id: string }> {
  const supabase = await client(supabaseInput);
  const productUpdate: TablesUpdate<'products'> = {
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    category_id: payload.category_id ?? null,
    price: payload.base_price,
    promo_price: payload.promo_price ?? null,
    cost_price: payload.base_price,
    stock: payload.variants.reduce((sum, variant) => sum + variant.stock, 0),
    weight_grams: payload.weight,
    is_active: payload.is_active,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('products').update(productUpdate).eq('id', id);
  if (error) throw new Error(error.message);

  await replaceProductRelations(supabase, id, payload);
  return { id };
}

export async function getAdminCategories(supabaseInput: ClientInput): Promise<CategoryRow[]> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function replaceProductRelations(
  supabaseInput: ClientInput,
  productId: string,
  payload: AdminProductPayload,
): Promise<void> {
  const supabase = await client(supabaseInput);

  // --- IMAGES: aman di-replace, tidak ada FK ke order_items ---
  const { error: imageDeleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId);
  if (imageDeleteError) throw new Error(imageDeleteError.message);

  if (payload.images.length > 0) {
    const images: TablesInsert<'product_images'>[] = payload.images.map((image, index) => ({
      product_id: productId,
      url: image.url,
      alt_text: payload.name,
      sort_order: image.sort_order ?? index,
    }));
    const { error } = await supabase.from('product_images').insert(images);
    if (error) throw new Error(error.message);
  }

  // --- VARIANTS: non-destruktif ---
  // Varian yang sudah punya order_items.variant_id TIDAK BOLEH dihapus
  // (FK + histori order rusak). Strategi:
  //  - punya id  -> UPDATE in place
  //  - tanpa id  -> INSERT baru
  //  - id lama yang tidak dikirim lagi -> hapus kalau belum dipakai order,
  //    kalau sudah dipakai cukup di-nonaktifkan (is_active = false).
  const discountRatio =
    payload.promo_price && payload.base_price > 0 && payload.promo_price < payload.base_price
      ? payload.promo_price / payload.base_price
      : null;

  const buildVariantFields = (variant: AdminProductPayload['variants'][number], index: number) => {
    const price = variant.price_override ?? payload.base_price;
    return {
      product_id: productId,
      name: variantName(variant),
      price,
      cost_price: payload.base_price,
      promo_price: discountRatio ? Math.round(price * discountRatio) : null,
      stock: variant.stock,
      image_url: variant.image_url ?? null,
      sort_order: index,
      weight_grams: variant.weight_grams ?? payload.weight,
      is_active: true,
    };
  };

  // Ambil id varian existing di DB untuk produk ini.
  const { data: existingVariants, error: existingError } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  if (existingError) throw new Error(existingError.message);

  const existingIds = new Set((existingVariants ?? []).map((v) => v.id));
  const incomingIds = new Set(
    payload.variants.map((v) => v.id).filter((id): id is string => Boolean(id)),
  );

  // UPDATE varian yang punya id valid.
  for (let index = 0; index < payload.variants.length; index += 1) {
    const variant = payload.variants[index];
    const fields = buildVariantFields(variant, index);
    if (variant.id && existingIds.has(variant.id)) {
      const { error } = await supabase
        .from('product_variants')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', variant.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from('product_variants')
        .insert(fields as TablesInsert<'product_variants'>);
      if (error) throw new Error(error.message);
    }
  }

  // Varian lama yang dihapus dari form.
  const removedIds = [...existingIds].filter((id) => !incomingIds.has(id));
  if (removedIds.length > 0) {
    const { data: usedRows, error: usedError } = await supabase
      .from('order_items')
      .select('variant_id')
      .in('variant_id', removedIds);
    if (usedError) throw new Error(usedError.message);

    const usedIds = new Set((usedRows ?? []).map((r) => r.variant_id).filter(Boolean));
    const deletableIds = removedIds.filter((id) => !usedIds.has(id));
    const deactivateIds = removedIds.filter((id) => usedIds.has(id));

    if (deletableIds.length > 0) {
      const { error } = await supabase.from('product_variants').delete().in('id', deletableIds);
      if (error) throw new Error(error.message);
    }
    if (deactivateIds.length > 0) {
      // Sudah dipakai order — pertahankan demi histori, cukup sembunyikan.
      const { error } = await supabase
        .from('product_variants')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', deactivateIds);
      if (error) throw new Error(error.message);
    }
  }
}

export async function getAdminStats(supabaseInput: ClientInput): Promise<AdminStats> {
  const supabase = await client(supabaseInput);
  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (orders ?? []) as Pick<OrderRow, 'total' | 'status' | 'created_at'>[];
  const today = new Date().toISOString().slice(0, 10);
  return rows.reduce<AdminStats>(
    (stats, order) => {
      const amount = Number(order.total ?? 0);
      stats.totalRevenue += amount;
      stats.totalOrders += 1;
      if (order.created_at?.startsWith(today)) stats.todayRevenue += amount;
      if (order.status === 'pending') stats.pendingOrders += 1;
      return stats;
    },
    { totalRevenue: 0, totalOrders: 0, todayRevenue: 0, pendingOrders: 0 },
  );
}

export async function getAdminRevenueChart(
  supabaseInput: ClientInput,
  days: number,
): Promise<AdminChartDay[]> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase.from('orders').select('total, created_at');
  if (error) throw new Error(error.message);

  const result: AdminChartDay[] = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    return { date: date.toISOString().slice(0, 10), revenue: 0 };
  });

  const byDate = new Map(result.map((day) => [day.date, day]));
  for (const order of (data ?? []) as Pick<OrderRow, 'total' | 'created_at'>[]) {
    const key = order.created_at?.slice(0, 10);
    const day = key ? byDate.get(key) : undefined;
    if (day) day.revenue += Number(order.total ?? 0);
  }
  return result;
}

export async function getAdminOrders(
  supabaseInput: ClientInput,
  options: { status: string | null; page: number; limit: number },
): Promise<{ data: AdminOrder[]; total: number }> {
  const supabase = await client(supabaseInput);
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  let query = supabase
    .from('orders')
    .select('*, profiles:user_id(name, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options.status) query = query.eq('status', options.status as OrderRow['status']);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    data: ((data ?? []) as unknown as OrderRowWithProfile[]).map((order) => ({
      id: order.id,
      total_amount: Number(order.total ?? 0),
      status: order.status,
      created_at: order.created_at ?? new Date(0).toISOString(),
      user: order.profiles
        ? {
            full_name: order.profiles.name,
            phone: order.profiles.phone,
          }
        : null,
    })),
    total: count ?? 0,
  };
}

export interface AdminCustomOrderDetails {
  size: string;
  material: string;
  personalization: string;
  designNotes?: string | null;
  referenceUrl?: string | null;
  referenceImagePath?: string | null;
  referenceImageUrl?: string | null;
  referenceImageName?: string | null;
  referenceImageType?: string | null;
  referenceImageSize?: number | null;
}

export interface AdminOrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  image_url: string | null;
  custom_details: AdminCustomOrderDetails | null;
}

export interface AdminCustomOrderWhatsApp {
  attempted: boolean;
  success: boolean;
  target?: string;
  provider_ids?: string[];
  reason?: string;
  sent_at: string;
}

export interface AdminOrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  tax: number;
  service_fee: number;
  total: number;
  shipping_courier: string | null;
  shipping_tracking: string | null;
  shipping_metadata: OrderRow['shipping_metadata'];
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  custom_order_whatsapp: AdminCustomOrderWhatsApp | null;
  customer: { name: string | null; phone: string | null; email: string | null } | null;
  address: {
    recipient_name: string | null;
    phone: string | null;
    full_address: string;
    city: string | null;
    district: string | null;
    postal_code: string | null;
  } | null;
  items: AdminOrderItem[];
}

export interface AdminCustomOrderListItem {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  notes: string | null;
  created_at: string;
  customer: { name: string | null; phone: string | null; email: string | null } | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  image_url: string | null;
  custom_details: AdminCustomOrderDetails;
  custom_order_whatsapp: AdminCustomOrderWhatsApp | null;
}

export interface AdminCustomOrderCatalogConfig {
  product: AdminProduct | null;
  productSlug: string;
  materials: string[];
}

function parseCustomDetails(value: unknown): AdminCustomOrderDetails | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.size !== 'string' ||
    typeof record.material !== 'string' ||
    typeof record.personalization !== 'string'
  ) {
    return null;
  }
  return {
    size: record.size,
    material: record.material,
    personalization: record.personalization,
    designNotes: typeof record.designNotes === 'string' ? record.designNotes : null,
    referenceUrl: typeof record.referenceUrl === 'string' ? record.referenceUrl : null,
    referenceImagePath:
      typeof record.referenceImagePath === 'string' ? record.referenceImagePath : null,
    referenceImageUrl:
      typeof record.referenceImageUrl === 'string' ? record.referenceImageUrl : null,
    referenceImageName:
      typeof record.referenceImageName === 'string' ? record.referenceImageName : null,
    referenceImageType:
      typeof record.referenceImageType === 'string' ? record.referenceImageType : null,
    referenceImageSize:
      typeof record.referenceImageSize === 'number' ? record.referenceImageSize : null,
  };
}

function parseCustomOrderWhatsApp(value: unknown): AdminCustomOrderWhatsApp | null {
  if (typeof value !== 'object' || value === null) return null;
  const metadata = value as Record<string, unknown>;
  const whatsapp = metadata.custom_order_whatsapp;
  if (typeof whatsapp !== 'object' || whatsapp === null) return null;
  const record = whatsapp as Record<string, unknown>;
  if (
    typeof record.attempted !== 'boolean' ||
    typeof record.success !== 'boolean' ||
    typeof record.sent_at !== 'string'
  ) {
    return null;
  }

  return {
    attempted: record.attempted,
    success: record.success,
    target: typeof record.target === 'string' ? record.target : undefined,
    provider_ids: Array.isArray(record.provider_ids)
      ? record.provider_ids.filter((item): item is string => typeof item === 'string')
      : undefined,
    reason: typeof record.reason === 'string' ? record.reason : undefined,
    sent_at: record.sent_at,
  };
}

async function withSignedReferenceImage(
  supabaseInput: TypedSupabaseClient,
  details: AdminCustomOrderDetails | null,
): Promise<AdminCustomOrderDetails | null> {
  if (!details?.referenceImagePath) return details;
  const { data } = await supabaseInput.storage
    .from('custom-order-references')
    .createSignedUrl(details.referenceImagePath, 60 * 60);
  return {
    ...details,
    referenceImageUrl: data?.signedUrl ?? details.referenceImageUrl ?? null,
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export async function getAdminCustomOrderCatalogConfig(
  supabaseInput: ClientInput,
): Promise<AdminCustomOrderCatalogConfig> {
  const supabase = await client(supabaseInput);
  const { data: settings } = await supabase
    .from('store_settings')
    .select('custom_order_product_slug, custom_order_materials')
    .limit(1)
    .maybeSingle();

  const productSlug = settings?.custom_order_product_slug || 'binder-custom-nama';
  const materials = parseStringArray(settings?.custom_order_materials);
  const { data: product, error } = await supabase
    .from('products')
    .select(
      '*, categories(id, name, slug), product_images(url, sort_order), product_variants(id, name, stock, price, promo_price, image_url, weight_grams, sort_order, is_active)',
    )
    .eq('slug', productSlug)
    .maybeSingle();

  return {
    product:
      error || !product ? null : toAdminProduct(product as unknown as ProductRowWithRelations),
    productSlug,
    materials:
      materials.length > 0
        ? materials
        : ['Premium Leather', 'Canvas Texture', 'Hardcover Matte', 'Transparent Flexy'],
  };
}

export async function getAdminOrderDetail(
  supabaseInput: ClientInput,
  id: string,
): Promise<AdminOrderDetail | null> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('orders')
    .select(
      '*, profiles:user_id(name, phone, email), addresses:address_id(recipient_name, phone, full_address, city, district, postal_code), order_items(id, product_name, variant_name, quantity, price, subtotal, custom_details, products(product_images(url)))',
    )
    .eq('id', id)
    .single();

  if (error || !data) return null;

  type DetailRow = OrderRow & {
    profiles: { name: string | null; phone: string | null; email: string | null } | null;
    addresses: {
      recipient_name: string | null;
      phone: string | null;
      full_address: string;
      city: string | null;
      district: string | null;
      postal_code: string | null;
    } | null;
    order_items: {
      id: string;
      product_name: string;
      variant_name: string | null;
      quantity: number;
      price: number;
      subtotal: number;
      custom_details: unknown;
      products: { product_images: { url: string }[] | null } | null;
    }[];
  };

  const order = data as unknown as DetailRow;

  const items = await Promise.all(
    (order.order_items ?? []).map(async (item) => ({
      id: item.id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: item.quantity,
      price: Number(item.price),
      subtotal: Number(item.subtotal),
      image_url: item.products?.product_images?.[0]?.url ?? null,
      custom_details: await withSignedReferenceImage(
        supabase,
        parseCustomDetails(item.custom_details),
      ),
    })),
  );

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    payment_method: order.payment_method,
    subtotal: Number(order.subtotal ?? 0),
    discount: Number(order.discount ?? 0),
    shipping_cost: Number(order.shipping_cost ?? 0),
    tax: Number(order.tax ?? 0),
    service_fee: Number(order.service_fee ?? 0),
    total: Number(order.total ?? 0),
    shipping_courier: order.shipping_courier,
    shipping_tracking: order.shipping_tracking,
    shipping_metadata: order.shipping_metadata,
    notes: order.notes,
    created_at: order.created_at ?? new Date(0).toISOString(),
    paid_at: order.paid_at,
    shipped_at: order.shipped_at,
    delivered_at: order.delivered_at,
    custom_order_whatsapp: parseCustomOrderWhatsApp(order.payment_metadata),
    customer: order.profiles,
    address: order.addresses,
    items,
  };
}

export async function getAdminCustomOrders(
  supabaseInput: ClientInput,
  options: { status: string | null; page: number; limit: number },
): Promise<{ data: AdminCustomOrderListItem[]; total: number }> {
  const supabase = await client(supabaseInput);
  const from = (options.page - 1) * options.limit;
  const to = from + options.limit - 1;
  let query = supabase
    .from('orders')
    .select(
      '*, profiles:user_id(name, phone, email), order_items(id, product_name, variant_name, quantity, custom_details, products(product_images(url)))',
      { count: 'exact' },
    )
    .eq('payment_method', 'custom_request')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options.status) query = query.eq('status', options.status as OrderRow['status']);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  type CustomOrderRow = OrderRow & {
    profiles: { name: string | null; phone: string | null; email: string | null } | null;
    order_items: {
      product_name: string;
      variant_name: string | null;
      quantity: number;
      custom_details: unknown;
      products: { product_images: { url: string }[] | null } | null;
    }[];
  };

  const orders = (data ?? []) as unknown as CustomOrderRow[];
  const customOrders: Array<AdminCustomOrderListItem | null> = await Promise.all(
    orders.map(async (order): Promise<AdminCustomOrderListItem | null> => {
      const item = order.order_items?.find((row) => parseCustomDetails(row.custom_details));
      const parsedDetails = item ? parseCustomDetails(item.custom_details) : null;
      const customDetails = await withSignedReferenceImage(supabase, parsedDetails);
      if (!item || !customDetails) return null;

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        total: Number(order.total ?? 0),
        notes: order.notes,
        created_at: order.created_at ?? new Date(0).toISOString(),
        customer: order.profiles,
        product_name: item.product_name,
        variant_name: item.variant_name,
        quantity: item.quantity,
        image_url: item.products?.product_images?.[0]?.url ?? null,
        custom_details: customDetails,
        custom_order_whatsapp: parseCustomOrderWhatsApp(order.payment_metadata),
      };
    }),
  );

  return {
    data: customOrders.filter((order): order is AdminCustomOrderListItem => order !== null),
    total: count ?? 0,
  };
}

export async function updateAdminOrderStatus(
  supabaseInput: ClientInput,
  id: string,
  payload: { status?: string; tracking_number?: string | null; cancel_reason?: string | null },
): Promise<OrderRow | null> {
  const supabase = await client(supabaseInput);
  const update: TablesUpdate<'orders'> = {
    updated_at: new Date().toISOString(),
  };
  if (payload.status) update.status = payload.status as TablesUpdate<'orders'>['status'];
  if (payload.tracking_number !== undefined) update.shipping_tracking = payload.tracking_number;
  if (payload.cancel_reason !== undefined) update.notes = payload.cancel_reason;

  const { data, error } = await supabase
    .from('orders')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAdminCoupons(supabaseInput: ClientInput): Promise<VoucherRow[]> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAdminCoupon(
  supabaseInput: ClientInput,
  payload: TablesInsert<'vouchers'>,
): Promise<VoucherRow> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase.from('vouchers').insert(payload).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateAdminCoupon(
  supabaseInput: ClientInput,
  id: string,
  updates: TablesUpdate<'vouchers'>,
): Promise<VoucherRow> {
  const supabase = await client(supabaseInput);
  const { data, error } = await supabase
    .from('vouchers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAdminCoupon(
  supabaseInput: ClientInput,
  id: string,
): Promise<{ success: true }> {
  const supabase = await client(supabaseInput);
  const { error } = await supabase.from('vouchers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return { success: true };
}
