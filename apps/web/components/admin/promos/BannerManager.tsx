'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import {
  Plus as IconPlus,
  ImageIcon,
  ArrowUpRight as IconExternalLink,
  Check as IconCheck,
} from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { saveBanner, toggleBannerActive } from '@/app/admin/actions';

type BannerRow = Tables<'banners'>;

type SectionId = 'hero' | 'promo' | 'category';

interface SectionMeta {
  id: SectionId;
  label: string;
  description: string;
  homeHint: string;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'hero',
    label: 'Hero Carousel',
    description: 'Banner besar di paling atas halaman home — geser otomatis.',
    homeHint: 'Muncul paling atas, di atas semua produk.',
  },
  {
    id: 'promo',
    label: 'Banner Promo',
    description: 'Strip iklan di atas section "Best Seller".',
    homeHint: 'Muncul di atas Best Seller.',
  },
  {
    id: 'category',
    label: 'Banner Pilihan',
    description: 'Strip iklan di bawah section "Best Seller".',
    homeHint: 'Muncul di bawah Best Seller.',
  },
];

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

function dateValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function NewIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
      <IconPlus className="h-5 w-5" strokeWidth={2} />
    </div>
  );
}

function ActiveToggle({ banner }: { banner: BannerRow }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(banner.is_active ?? false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.checked;
    setOptimistic(next);

    const formData = new FormData();
    formData.set('id', banner.id);
    if (next) formData.set('is_active', 'on');

    startTransition(async () => {
      try {
        await toggleBannerActive(formData);
      } catch {
        setOptimistic(!next);
      }
    });
  };

  return (
    <label
      className="relative inline-flex h-6 w-10 cursor-pointer items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={optimistic}
        onChange={handleToggle}
        disabled={pending}
        aria-label={optimistic ? 'Nonaktifkan banner' : 'Aktifkan banner'}
      />
      <span className="h-6 w-10 rounded-full bg-black/[0.12] transition-colors peer-checked:bg-primary peer-disabled:opacity-50" />
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          optimistic ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </label>
  );
}

interface BannerEditorProps {
  banner: BannerRow | null;
  section: SectionMeta;
  onSaved: () => void;
}

function BannerEditor({ banner, section, onSaved }: BannerEditorProps) {
  const isNew = banner === null;
  const isHero = section.id === 'hero';

  return (
    <form
      key={banner?.id ?? `new-${section.id}`}
      action={async (formData) => {
        await saveBanner(formData);
        onSaved();
      }}
      className="flex flex-col"
    >
      <input type="hidden" name="id" value={banner?.id ?? ''} />
      <input type="hidden" name="type" value={section.id} />

      <div className="space-y-5 p-6">
        <header>
          <p className={labelClass}>
            {isNew ? 'Banner baru' : 'Edit banner'} · {section.label}
          </p>
          <h3 className="mt-0.5 text-[20px] font-semibold tracking-tight text-[#1D1D1F]">
            {isNew ? 'Tambah banner ke section ini' : banner?.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#86868B]">{section.homeHint}</p>
        </header>

        <div>
          <span className={labelClass}>Gambar banner</span>
          <div className="mt-1.5 overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAFAFA]">
            {banner?.image_url ? (
              <div className="relative aspect-[16/7] w-full">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 720px, 100vw"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/7] items-center justify-center text-[#C7C7CC]">
                <ImageIcon className="h-10 w-10" strokeWidth={1.25} />
              </div>
            )}
            <div className="border-t border-black/[0.06] bg-white p-4">
              <ImageUploadField
                bucket="banners"
                name="image_url"
                label={banner?.image_url ? 'Ganti gambar' : 'Upload gambar banner'}
                defaultValue={banner?.image_url ?? ''}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[#86868B]">
            Rasio rekomendasi 16:7 (mis. 1280×560 px). JPG/PNG.
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className={labelClass}>
            Judul banner
            {isHero ? null : (
              <span className="ml-2 text-[10px] font-medium text-[#86868B]">
                (cuma untuk identifikasi di admin)
              </span>
            )}
          </span>
          <input
            name="title"
            required
            defaultValue={banner?.title ?? ''}
            className={inputClass}
            placeholder={isHero ? 'Diskon hingga 50%' : 'Flash Sale Binder A5'}
          />
          {isHero ? (
            <span className="block text-[11px] text-[#86868B]">
              Judul utama yang tampil besar di hero carousel home.
            </span>
          ) : (
            <span className="block text-[11px] text-[#86868B]">
              Strip banner: judul ini muncul kecil di overlay gambar.
            </span>
          )}
        </label>

        {isHero ? (
          <div className="space-y-4 rounded-xl border border-black/[0.06] bg-primary/[0.06] p-4">
            <p className="text-[12px] font-semibold text-[#1D1D1F]">Teks hero carousel</p>
            <p className="text-[11px] leading-relaxed text-[#86868B]">
              Semua teks di banner hero diatur di sini — tag kecil, deskripsi, dan tombol CTA. Boleh
              dikosongkan kalau tidak dipakai.
            </p>

            <label className="block space-y-1.5">
              <span className={labelClass}>Tag / eyebrow (kecil, di atas judul)</span>
              <input
                name="subtitle"
                defaultValue={banner?.subtitle ?? ''}
                className={inputClass}
                placeholder="Flash Sale"
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>Deskripsi (di bawah judul)</span>
              <input
                name="description"
                defaultValue={banner?.description ?? ''}
                className={inputClass}
                placeholder="Koleksi binder premium untuk produktivitasmu"
              />
            </label>

            <label className="block space-y-1.5">
              <span className={labelClass}>Label tombol CTA</span>
              <input
                name="cta_label"
                defaultValue={banner?.cta_label ?? ''}
                className={inputClass}
                placeholder="Belanja sekarang"
              />
              <span className="block text-[11px] text-[#86868B]">
                Kosongkan jika tidak mau tampilkan tombol.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className={labelClass}>Background gradient (opsional)</span>
                <input
                  name="bg_gradient"
                  defaultValue={banner?.bg_gradient ?? ''}
                  className={`${inputClass} font-mono text-[12px]`}
                  placeholder="linear-gradient(135deg, #1A1714 0%, #3D2F1E 100%)"
                />
                <span className="block text-[11px] text-[#86868B]">
                  CSS gradient string. Kosongkan = gambar saja.
                </span>
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Warna accent (opsional)</span>
                <input
                  name="accent_color"
                  defaultValue={banner?.accent_color ?? ''}
                  className={`${inputClass} font-mono`}
                  placeholder="#FFD54C"
                />
                <span className="block text-[11px] text-[#86868B]">
                  Untuk glow & badge di banner.
                </span>
              </label>
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="subtitle" value="" />
            <input type="hidden" name="description" value="" />
            <input type="hidden" name="cta_label" value="" />
            <input type="hidden" name="bg_gradient" value="" />
            <input type="hidden" name="accent_color" value="" />
          </>
        )}

        <label className="block space-y-1.5">
          <span className={labelClass}>Link saat banner diklik</span>
          <input
            name="link"
            defaultValue={banner?.link ?? ''}
            className={inputClass}
            placeholder="/products atau https://..."
          />
          <span className="block text-[11px] text-[#86868B]">
            Kosongkan jika banner tidak bisa diklik.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className={labelClass}>Urutan tampil</span>
            <input
              name="priority"
              type="number"
              defaultValue={banner?.priority ?? 0}
              className={inputClass}
              placeholder="0"
            />
            <span className="block text-[11px] text-[#86868B]">Angka kecil tampil duluan.</span>
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Tampil mulai</span>
            <input
              name="start_date"
              type="date"
              defaultValue={dateValue(banner?.start_date ?? null)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Tampil sampai</span>
            <input
              name="end_date"
              type="date"
              defaultValue={dateValue(banner?.end_date ?? null)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={banner?.is_active ?? true}
            className="h-4 w-4 accent-[#1D1D1F]"
          />
          <span className="text-[14px] font-medium text-[#1D1D1F]">
            Banner aktif &mdash; tampilkan di home
          </span>
        </label>
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-black/[0.06] bg-white/95 px-6 py-4 backdrop-blur-xl">
        {banner?.link ? (
          <a
            href={banner.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#86868B] hover:text-[#1D1D1F]"
          >
            Buka link
            <IconExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
          </a>
        ) : (
          <span />
        )}
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <IconCheck className="h-4 w-4" strokeWidth={2} />
          {isNew ? 'Simpan banner' : 'Simpan perubahan'}
        </button>
      </footer>
    </form>
  );
}

interface BannerListItemProps {
  banner: BannerRow;
  selected: boolean;
  onSelect: () => void;
}

function BannerListItem({ banner, selected, onSelect }: BannerListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
        selected ? 'border-[#1D1D1F]/15 bg-primary/10' : 'border-transparent hover:bg-black/[0.03]'
      }`}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#FAFAFA]">
        {banner.image_url ? (
          <Image
            src={banner.image_url}
            alt={banner.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#C7C7CC]">
            <ImageIcon size={18} strokeWidth={1.5} />
          </div>
        )}
        <span className="absolute left-1 top-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
          #{banner.priority ?? 0}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[#1D1D1F]">{banner.title}</p>
        {banner.subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-[#86868B]">{banner.subtitle}</p>
        ) : (
          <p
            className={`mt-0.5 text-[11px] font-medium ${
              banner.is_active ? 'text-[#1D1D1F]' : 'text-[#86868B]'
            }`}
          >
            {banner.is_active ? 'Tampil di home' : 'Tidak tampil'}
          </p>
        )}
      </div>
      <ActiveToggle banner={banner} />
    </button>
  );
}

interface BannerManagerProps {
  banners: BannerRow[];
}

export function BannerManager({ banners }: BannerManagerProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);

  const bannersBySection = useMemo(() => {
    const grouped: Record<SectionId, BannerRow[]> = {
      hero: [],
      promo: [],
      category: [],
    };
    for (const banner of banners) {
      const type = (banner.type ?? 'promo') as SectionId;
      if (type in grouped) {
        grouped[type].push(banner);
      } else {
        grouped.promo.push(banner);
      }
    }
    for (const key of Object.keys(grouped) as SectionId[]) {
      grouped[key].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    }
    return grouped;
  }, [banners]);

  const currentSection = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];
  const sectionBanners = bannersBySection[activeSection];

  const selectedBanner =
    selectedId && selectedId !== 'new'
      ? (sectionBanners.find((b) => b.id === selectedId) ?? null)
      : null;
  const isCreating = selectedId === 'new';

  const handleSectionChange = (sectionId: SectionId): void => {
    setActiveSection(sectionId);
    setSelectedId(null);
  };

  const handleSaved = (): void => {
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Section banner di home" className="grid gap-2 sm:grid-cols-3">
        {SECTIONS.map((section) => {
          const isActive = section.id === activeSection;
          const count = bannersBySection[section.id].length;
          const activeCount = bannersBySection[section.id].filter((b) => b.is_active).length;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionChange(section.id)}
              aria-pressed={isActive}
              className={`group flex flex-col rounded-2xl border p-4 text-left transition-colors ${
                isActive
                  ? 'border-[#1D1D1F]/15 bg-white'
                  : 'border-black/[0.06] bg-white/60 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[15px] font-semibold tracking-tight ${
                    isActive ? 'text-[#1D1D1F]' : 'text-[#86868B]'
                  }`}
                >
                  {section.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isActive ? 'bg-primary/25 text-[#1D1D1F]' : 'bg-black/[0.05] text-[#86868B]'
                  }`}
                >
                  {activeCount}/{count}
                </span>
              </div>
              <p className="mt-1 text-[12px] leading-relaxed text-[#86868B]">
                {section.description}
              </p>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-black/[0.06] bg-white">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3.5">
            <div>
              <p className="text-[14px] font-semibold tracking-tight text-[#1D1D1F]">
                {currentSection.label}
              </p>
              <p className="text-[11px] text-[#86868B]">
                {sectionBanners.length} banner di section ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId('new')}
              aria-pressed={isCreating}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors ${
                isCreating
                  ? 'bg-[#1D1D1F] text-white'
                  : 'bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08]'
              }`}
            >
              <IconPlus className="h-3.5 w-3.5" strokeWidth={2} />
              Baru
            </button>
          </div>

          <div className="space-y-1 p-2">
            {isCreating ? (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#1D1D1F]/20 bg-primary/10 p-2.5">
                <NewIcon />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#1D1D1F]">Banner baru</p>
                  <p className="text-[11px] text-[#86868B]">Isi form di samping untuk simpan</p>
                </div>
              </div>
            ) : null}

            {sectionBanners.length === 0 && !isCreating ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
                  <ImageIcon className="h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-[#1D1D1F]">Belum ada banner</p>
                <p className="mt-1 text-[12px] text-[#86868B]">
                  Tap &ldquo;Baru&rdquo; untuk tambah banner pertama di section ini.
                </p>
              </div>
            ) : (
              sectionBanners.map((banner) => (
                <BannerListItem
                  key={banner.id}
                  banner={banner}
                  selected={selectedId === banner.id}
                  onSelect={() => setSelectedId(banner.id)}
                />
              ))
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          {selectedBanner || isCreating ? (
            <BannerEditor banner={selectedBanner} section={currentSection} onSaved={handleSaved} />
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
                <ImageIcon className="h-6 w-6 text-[#86868B]" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
                Pilih banner untuk edit
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-[#86868B]">
                Klik salah satu banner di kiri untuk lihat preview dan ubah detailnya. Atau tap
                &ldquo;Baru&rdquo; untuk tambah banner di section{' '}
                <span className="font-medium text-[#1D1D1F]">{currentSection.label}</span>.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
