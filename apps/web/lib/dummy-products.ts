import type { ProductCardData } from '@/components/shared/product-card';

export interface ProductVariantDetail {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  image_url?: string | null;
  weight_grams?: number | null;
}

export interface DetailedProduct extends ProductCardData {
  description?: string;
  variants?: ProductVariantDetail[];
  images?: string[];
  stock?: number;
  weight_grams?: number | null;
}

const compactImages = (product: DetailedProduct | ProductCardData) => {
  const images = 'images' in product ? product.images : undefined;
  return images?.length ? images : product.imageUrl ? [product.imageUrl] : [];
};

const defaultDescription = (product: ProductCardData) => {
  const category = product.category ? product.category.toLowerCase() : 'binder';
  return `*${product.name}* adalah ${category} pilihan dari Bananasbindery untuk menyimpan foto, notes, kartu, dan memori harian dengan rapi.

· Material dikurasi untuk tampilan premium dan tahan pakai
· Cocok untuk photocard, journaling, hadiah, atau koleksi pribadi
· Stok, warna, dan harga dapat berubah sesuai ketersediaan`;
};

export function toDetailedProduct(product: DetailedProduct | ProductCardData): DetailedProduct {
  const description = 'description' in product ? product.description : undefined;
  const stock = 'stock' in product ? product.stock : undefined;

  return {
    ...product,
    images: compactImages(product),
    description: description ?? defaultDescription(product),
    stock: stock ?? 99,
  };
}

export const DUMMY_PRODUCTS: ProductCardData[] = [
  {
    id: 'binder-slotphone',
    slug: 'binder-slotphone',
    name: 'Binder Slotphone Organizer',
    price: 189000,
    promoPrice: 159000,
    imageUrl: '/images/products/binder-slotphone-01.jpg',
    category: 'Binder Organizer',
    rating: 4.9,
    reviewCount: 128,
    soldCount: 860,
  },
  {
    id: 'binder-rose-blossom',
    slug: 'binder-rose-blossom',
    name: 'Binder Rose Blossom Padlock',
    price: 175000,
    promoPrice: 149000,
    imageUrl: '/images/products/binder-rose-blossom-01.jpg',
    category: 'Binder Aesthetic',
    rating: 4.8,
    reviewCount: 96,
    soldCount: 520,
  },
  {
    id: 'binder-denim-pink-blue',
    slug: 'binder-denim-pink-blue',
    name: 'Binder Denim Pink & Blue',
    price: 165000,
    imageUrl: '/images/products/binder-denim-pink-blue-01.jpg',
    category: 'Binder Aesthetic',
    rating: 4.8,
    reviewCount: 74,
    soldCount: 430,
  },
  {
    id: 'binder-custom-nama',
    slug: 'binder-custom-nama',
    name: 'Binder Custom Nama',
    price: 199000,
    promoPrice: 179000,
    imageUrl: '/images/products/binder-custom-nama-01.jpg',
    category: 'Custom Binder',
    rating: 4.9,
    reviewCount: 142,
    soldCount: 670,
  },
  {
    id: 'binder-butterfly-violet',
    slug: 'binder-butterfly-violet',
    name: 'Binder Butterfly Violet',
    price: 169000,
    imageUrl: '/images/products/binder-butterfly-violet-01.jpg',
    category: 'Binder Aesthetic',
    rating: 4.7,
    reviewCount: 58,
    soldCount: 360,
  },
  {
    id: 'binder-bundling',
    slug: 'binder-bundling',
    name: 'Paket Bundling Binder + Refill',
    price: 249000,
    promoPrice: 219000,
    imageUrl: '/images/products/binder-bundling-01.jpg',
    category: 'Bundling',
    rating: 4.9,
    reviewCount: 211,
    soldCount: 980,
    type: 'parcel',
  },
];

export const DETAILED_PRODUCTS: DetailedProduct[] = [
  {
    ...DUMMY_PRODUCTS[0],
    description: `*Binder Slotphone Organizer* dirancang untuk kamu yang ingin menyatukan notes, photocard, kartu, dan handphone dalam satu binder compact.

· Slot multifungsi untuk kartu dan phone essentials
· Ring binder mudah dibuka-tutup untuk isi ulang
· Cocok untuk daily planner, kuliah, kerja, atau hadiah`,
    variants: [
      { id: 'slotphone-a5-cream', name: 'A5 Cream', price: 189000, promoPrice: 159000, stock: 24 },
      { id: 'slotphone-a5-pink', name: 'A5 Pink', price: 189000, promoPrice: 159000, stock: 18 },
      {
        id: 'slotphone-b5-neutral',
        name: 'B5 Neutral',
        price: 209000,
        promoPrice: null,
        stock: 10,
      },
    ],
    images: ['/images/products/binder-slotphone-01.jpg'],
  },
  {
    ...DUMMY_PRODUCTS[1],
    description: `*Binder Rose Blossom Padlock* punya detail floral lembut dengan aksen padlock untuk tampilan manis dan premium.

· Cover aesthetic untuk koleksi photocard dan journaling
· Ring binder kokoh dan praktis untuk refill
· Pilihan aman untuk gift ulang tahun atau hampers personal`,
    variants: [
      { id: 'rose-a5', name: 'A5 Rose', price: 175000, promoPrice: 149000, stock: 20 },
      { id: 'rose-b5', name: 'B5 Rose', price: 195000, promoPrice: 169000, stock: 12 },
    ],
    images: ['/images/products/binder-rose-blossom-01.jpg'],
  },
  {
    ...DUMMY_PRODUCTS[2],
    description: `*Binder Denim Pink & Blue* menggabungkan tekstur denim playful dengan warna pastel untuk look yang fresh.

· Cover denim-look yang standout
· Ideal untuk photocard, sticker, planner, dan notes
· Ring binder reusable, mudah tambah refill`,
    images: ['/images/products/binder-denim-pink-blue-01.jpg'],
  },
  {
    ...DUMMY_PRODUCTS[3],
    description: `*Binder Custom Nama* dibuat untuk pesanan personal dengan nama, font, dan detail sesuai request.

· Bisa request nama atau wording pendek
· Cocok untuk hadiah personal dan koleksi sendiri
· Konfirmasi detail custom via WhatsApp sebelum produksi`,
    variants: [
      { id: 'custom-a5', name: 'A5 Custom', price: 199000, promoPrice: 179000, stock: 30 },
      { id: 'custom-b5', name: 'B5 Custom', price: 229000, promoPrice: null, stock: 16 },
    ],
    images: ['/images/products/binder-custom-nama-01.jpg'],
  },
  {
    ...DUMMY_PRODUCTS[4],
    description: `*Binder Butterfly Violet* hadir dengan nuansa ungu lembut dan motif butterfly untuk koleksi yang feminin dan dreamy.

· Tampilan premium untuk photocard binder
· Cocok untuk journaling dan memory keeping
· Ring binder reusable dengan refill yang mudah diganti`,
    images: ['/images/products/binder-butterfly-violet-01.jpg'],
  },
  {
    ...DUMMY_PRODUCTS[5],
    description: `*Paket Bundling Binder + Refill* adalah paket lengkap untuk mulai menyusun koleksi foto, photocard, atau notes tanpa perlu beli terpisah.

· Sudah termasuk binder dan refill pilihan
· Lebih hemat untuk starter kit
· Cocok untuk gift set dan kebutuhan koleksi harian`,
    variants: [
      { id: 'bundle-basic', name: 'Basic Bundle', price: 249000, promoPrice: 219000, stock: 22 },
      { id: 'bundle-premium', name: 'Premium Bundle', price: 329000, promoPrice: 299000, stock: 9 },
    ],
    images: ['/images/products/binder-bundling-01.jpg'],
  },
];

const FEATURED_PRODUCT_SLUGS = [
  'binder-slotphone',
  'binder-rose-blossom',
  'binder-custom-nama',
  'binder-bundling',
] as const;

export function getProducts(): ProductCardData[] {
  return DUMMY_PRODUCTS;
}

export function getFeaturedProducts(): ProductCardData[] {
  const productsBySlug = new Map(DUMMY_PRODUCTS.map((product) => [product.slug, product]));

  return FEATURED_PRODUCT_SLUGS.map((slug) => productsBySlug.get(slug)).filter(
    (product): product is ProductCardData => Boolean(product),
  );
}

export function getProductBySlug(slug: string): DetailedProduct | undefined {
  const detailed = DETAILED_PRODUCTS.find((product) => product.slug === slug);
  if (detailed) return detailed;

  const basic = DUMMY_PRODUCTS.find((product) => product.slug === slug);
  return basic ? toDetailedProduct(basic) : undefined;
}

export function getProductStaticParams() {
  return DUMMY_PRODUCTS.map((product) => ({ slug: product.slug }));
}
