import type { TypedSupabaseClient } from './types';

declare const console: { error: (...args: unknown[]) => void };

/** Banner ready for rendering on the storefront. */
export interface HomeBanner {
  id: string;
  title: string;
  type: string;
  imageUrl: string;
  link: string | null;
  priority: number;
  /** Hero banner — small eyebrow/tag above title. */
  subtitle: string | null;
  /** Hero banner — body description under title. */
  description: string | null;
  /** Hero banner — CTA button label. */
  ctaLabel: string | null;
  /** Hero banner — optional CSS background gradient. */
  bgGradient: string | null;
  /** Hero banner — optional accent color hex/rgba. */
  accentColor: string | null;
}

interface BannerRow {
  id: string;
  title: string;
  type: string;
  image_url: string;
  link: string | null;
  priority: number | null;
  start_date: string | null;
  end_date: string | null;
  subtitle: string | null;
  description: string | null;
  cta_label: string | null;
  bg_gradient: string | null;
  accent_color: string | null;
}

/**
 * Fetch active banners managed from the admin panel (`/admin/promos`).
 * Filters by schedule window and sorts by priority ascending.
 * Platform-agnostic: accepts the Supabase client so web and mobile can share it.
 */
export async function getActiveBanners(
  supabase: TypedSupabaseClient,
  type?: string,
): Promise<HomeBanner[]> {
  const query = supabase
    .from('banners')
    .select(
      'id, title, type, image_url, link, priority, start_date, end_date, is_active, subtitle, description, cta_label, bg_gradient, accent_color',
    )
    .eq('is_active', true)
    .order('priority', { ascending: true });

  const { data, error } = type ? await query.eq('type', type) : await query;

  if (error) {
    console.error('BANNERS_FETCH_ERROR:', error.message);
    return [];
  }

  const nowIso = new Date().toISOString();

  return ((data as unknown as BannerRow[]) || [])
    .filter(
      (banner) =>
        (!banner.start_date || banner.start_date <= nowIso) &&
        (!banner.end_date || banner.end_date >= nowIso),
    )
    .map((banner) => ({
      id: banner.id,
      title: banner.title,
      type: banner.type,
      imageUrl: banner.image_url,
      link: banner.link,
      priority: banner.priority ?? 0,
      subtitle: banner.subtitle,
      description: banner.description,
      ctaLabel: banner.cta_label,
      bgGradient: banner.bg_gradient,
      accentColor: banner.accent_color,
    }));
}
