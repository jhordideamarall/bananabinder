import type { ProductCardData } from '@/components/shared/product-card';

export interface ProductVariantDetail {
  id: string;
  name: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
}

export interface DetailedProduct extends ProductCardData {
  description?: string;
  variants?: ProductVariantDetail[];
  images?: string[];
  stock?: number;
}

const compactImages = (product: DetailedProduct | ProductCardData) => {
  const images = 'images' in product ? product.images : undefined;
  return images?.length ? images : product.imageUrl ? [product.imageUrl] : [];
};

const defaultDescription = (product: ProductCardData) => {
  const category = product.category ? product.category.toLowerCase() : 'produk';
  return `*${product.name}* adalah ${category} pilihan untuk kebutuhan harian peliharaan Anda.\n\n· Produk dikurasi untuk kualitas dan kenyamanan\n· Cocok untuk kebutuhan perawatan rutin\n· Stok dan harga dapat berubah sesuai ketersediaan`;
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
    id: '1',
    slug: 'makanan-kucing-royal-canin',
    name: 'Makanan Kucing Royal Canin',
    price: 350000,
    promoPrice: 280000,
    imageUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80',
    category: 'Makanan',
    rating: 4.8,
    reviewCount: 234,
    soldCount: 1200,
  },
  {
    id: '2',
    slug: 'makanan-anjing-pedigree',
    name: 'Makanan Anjing Pedigree',
    price: 180000,
    imageUrl:
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    category: 'Makanan',
    rating: 4.6,
    reviewCount: 156,
    soldCount: 850,
  },
  {
    id: '3',
    slug: 'frozen-daging-sapi',
    name: 'Frozen Daging Sapi Premium',
    price: 450000,
    promoPrice: 380000,
    imageUrl:
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80',
    category: 'Makanan',
    rating: 4.9,
    reviewCount: 89,
    soldCount: 320,
    type: 'frozen',
  },
  {
    id: '4',
    slug: 'kalung-anjing-kulit',
    name: 'Kalung Anjing Kulit Asli',
    price: 120000,
    imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80',
    category: 'Aksesoris',
    rating: 4.5,
    reviewCount: 67,
    soldCount: 320,
  },
  {
    id: '5',
    slug: 'tali-leash-retractable',
    name: 'Tali Leash Retractable 5m',
    price: 95000,
    imageUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80',
    category: 'Aksesoris',
    rating: 4.4,
    reviewCount: 112,
    soldCount: 540,
  },
  {
    id: '6',
    slug: 'vitamin-kucing-premium',
    name: 'Vitamin Kucing Premium',
    price: 150000,
    promoPrice: 120000,
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
    category: 'Obat & Vitamin',
    rating: 4.7,
    reviewCount: 78,
    soldCount: 410,
  },
  {
    id: '7',
    slug: 'obat-kutu-frontline',
    name: 'Obat Kutu Frontline',
    price: 220000,
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    category: 'Obat & Vitamin',
    rating: 4.8,
    reviewCount: 201,
    soldCount: 890,
  },
  {
    id: '8',
    slug: 'kandang-besi-besar',
    name: 'Kandang Besi Lipat Premium',
    price: 1200000,
    promoPrice: 950000,
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80',
    category: 'Kandang',
    rating: 4.6,
    reviewCount: 45,
    soldCount: 120,
  },
  {
    id: '9',
    slug: 'kandang-plastik-travel',
    name: 'Pet Carrier Travel Box',
    price: 350000,
    imageUrl: 'https://images.unsplash.com/photo-1544161513-0179fe746fd5?w=800&q=80',
    category: 'Kandang',
    rating: 4.5,
    reviewCount: 78,
    soldCount: 240,
  },
  {
    id: '10',
    slug: 'shampoo-anjing-sensitif',
    name: 'Shampoo Organic Aloe Vera',
    price: 85000,
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
    category: 'Grooming',
    rating: 4.7,
    reviewCount: 134,
    soldCount: 620,
  },
  {
    id: '11',
    slug: 'sisir-slicker',
    name: 'Sisir Slicker Premium Wood',
    price: 65000,
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80',
    category: 'Grooming',
    rating: 4.4,
    reviewCount: 89,
    soldCount: 380,
  },
  {
    id: '12',
    slug: 'mainan-kucing-bulu',
    name: 'Mainan Kucing Bulu Interaktif',
    price: 75000,
    promoPrice: 55000,
    imageUrl: 'https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=800&q=80',
    category: 'Mainan',
    rating: 4.6,
    reviewCount: 156,
    soldCount: 710,
  },
];

export const DETAILED_PRODUCTS: DetailedProduct[] = [
  {
    ...DUMMY_PRODUCTS[0],
    description:
      '*Makanan Kucing Royal Canin* diformulasikan khusus untuk memenuhi kebutuhan nutrisi optimal peliharaan Anda.\n\n· Kandungan protein tinggi untuk pertumbuhan optimal\n· Formula sesuai usia dan ukuran\n· Bebas bahan pengawet berbahaya\n· Sertifikasi SNI & BPOM',
    variants: [
      { id: 'v1-1', name: '400g', price: 95000, promoPrice: 80000, stock: 42 },
      { id: 'v1-2', name: '2kg', price: 350000, promoPrice: 280000, stock: 18 },
      { id: 'v1-3', name: '4kg', price: 620000, promoPrice: null, stock: 7 },
      { id: 'v1-4', name: '10kg', price: 1450000, promoPrice: 1350000, stock: 3 },
    ],
    images: [
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80',
      'https://images.unsplash.com/photo-1544568100029-e414f86d993b?w=800&q=80',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    ],
  },
  {
    ...DUMMY_PRODUCTS[1],
    description:
      '*Makanan Anjing Pedigree* mengandung nutrisi seimbang dengan daging ayam pilihan sebagai bahan utama.\n\n· Mengandung omega-6 untuk kesehatan bulu\n· Tekstur kibble yang menjaga kebersihan gigi\n· Kaya akan kalsium untuk tulang kuat',
    variants: [
      { id: 'v2-1', name: '400g', price: 55000, promoPrice: null, stock: 60 },
      { id: 'v2-2', name: '3kg', price: 180000, promoPrice: null, stock: 35 },
      { id: 'v2-3', name: '8kg', price: 420000, promoPrice: 380000, stock: 12 },
    ],
    images: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
    ],
  },
  {
    ...DUMMY_PRODUCTS[4],
    description:
      '*Tali Leash Retractable 5m* memberikan kebebasan bagi anjing Anda untuk bereksplorasi namun tetap dalam kendali penuh.\n\n· Panjang tali maksimal 5 meter\n· Mekanisme pengereman satu tombol yang halus\n· Pegangan ergonomis yang nyaman digenggam',
    images: [
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    ],
  },
  {
    ...DUMMY_PRODUCTS[5],
    description:
      '*Vitamin Kucing Premium* membantu meningkatkan imunitas, kesehatan bulu, dan vitalitas kucing kesayangan Anda.\n\n· Mengandung taurin dan omega-3\n· Tablet kunyah rasa ikan yang disukai kucing\n· Aman untuk konsumsi harian',
    variants: [
      { id: 'v6-1', name: '30 tablet', price: 75000, promoPrice: 60000, stock: 55 },
      { id: 'v6-2', name: '60 tablet', price: 150000, promoPrice: 120000, stock: 28 },
      { id: 'v6-3', name: '120 tablet', price: 280000, promoPrice: 240000, stock: 4 },
    ],
    images: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80',
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
    ],
  },
  {
    ...DUMMY_PRODUCTS[9],
    description:
      '*Shampoo Organic Aloe Vera* formula lembut tanpa SLS, paraben, atau pewarna buatan.\n\n· Menjaga kelembaban alami kulit\n· Aroma segar aloe vera yang tahan lama\n· Cocok untuk hewan dengan kulit sensitif',
    images: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
      'https://images.unsplash.com/photo-1601758124096-e7c1b9aadccf?w=800&q=80',
    ],
  },
  {
    ...DUMMY_PRODUCTS[11],
    description:
      '*Mainan Kucing Bulu Interaktif* didesain untuk merangsang naluri berburu alami kucing Anda.\n\n· Gagang fleksibel dan kuat\n· Bulu warna-warni yang menarik perhatian\n· Dilengkapi lonceng kecil yang nyaring',
    images: [
      'https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=800&q=80',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
    ],
  },
];

const FEATURED_PRODUCT_SLUGS = [
  'makanan-kucing-royal-canin',
  'makanan-anjing-pedigree',
  'vitamin-kucing-premium',
  'kalung-anjing-kulit',
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
