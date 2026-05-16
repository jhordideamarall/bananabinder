'use client';

import { useMemo, useState } from 'react';
import {
  Plus as IconPlus,
  Zap as IconFlash,
  Tag as IconTag,
  Truck as IconTruck,
  Megaphone as IconCampaign,
  type LucideIcon,
} from 'lucide-react';
import { CampaignEditor } from './CampaignEditor';
import {
  CAMPAIGN_TYPE_LABELS,
  getCampaignStatus,
  type CampaignStatus,
  type CampaignType,
  type CampaignWithTargets,
  type CategoryOption,
  type ProductOption,
} from './types';

interface CampaignManagerProps {
  initialCampaigns: CampaignWithTargets[];
  products: ProductOption[];
  categories: CategoryOption[];
}

const TYPE_ICON: Record<CampaignType, LucideIcon> = {
  flash_sale: IconFlash,
  product_discount: IconTag,
  free_shipping: IconTruck,
};

const STATUS_STYLE: Record<CampaignStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-emerald-500/10 text-emerald-700' },
  scheduled: { label: 'Terjadwal', className: 'bg-blue-500/10 text-blue-700' },
  expired: { label: 'Berakhir', className: 'bg-black/[0.06] text-[#86868B]' },
  paused: { label: 'Nonaktif', className: 'bg-amber-500/10 text-amber-700' },
};

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

function formatDateRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const fmt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fmt.format(start)} → ${fmt.format(end)}`;
}

function formatRuleSummary(c: CampaignWithTargets['campaign']): string {
  if (c.discount_unit === 'percentage') return `${c.discount_value}% off`;
  return `${currency.format(c.discount_value)} off`;
}

type FilterTab = 'all' | CampaignType;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'flash_sale', label: CAMPAIGN_TYPE_LABELS.flash_sale },
  { id: 'product_discount', label: CAMPAIGN_TYPE_LABELS.product_discount },
  { id: 'free_shipping', label: CAMPAIGN_TYPE_LABELS.free_shipping },
];

export function CampaignManager({ initialCampaigns, products, categories }: CampaignManagerProps) {
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [draftType, setDraftType] = useState<CampaignType>('flash_sale');
  const [filter, setFilter] = useState<FilterTab>('all');

  const selected = useMemo(
    () =>
      selectedId && selectedId !== 'new'
        ? (initialCampaigns.find((c) => c.campaign.id === selectedId) ?? null)
        : null,
    [initialCampaigns, selectedId],
  );
  const isCreating = selectedId === 'new';

  const filtered = useMemo(
    () =>
      filter === 'all'
        ? initialCampaigns
        : initialCampaigns.filter((c) => c.campaign.type === filter),
    [initialCampaigns, filter],
  );

  const stats = useMemo(() => {
    const now = new Date();
    return {
      active: initialCampaigns.filter((c) => getCampaignStatus(c.campaign, now) === 'active')
        .length,
      scheduled: initialCampaigns.filter((c) => getCampaignStatus(c.campaign, now) === 'scheduled')
        .length,
      total: initialCampaigns.length,
    };
  }, [initialCampaigns]);

  const handleStartCreate = (type: CampaignType): void => {
    setDraftType(type);
    setSelectedId('new');
  };

  const handleClose = (): void => setSelectedId(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
            Aktif sekarang
          </p>
          <p className="mt-1 text-[24px] font-semibold tracking-tight text-[#1D1D1F]">
            {stats.active}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
            Terjadwal
          </p>
          <p className="mt-1 text-[24px] font-semibold tracking-tight text-[#1D1D1F]">
            {stats.scheduled}
          </p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#86868B]">
            Total campaign
          </p>
          <p className="mt-1 text-[24px] font-semibold tracking-tight text-[#1D1D1F]">
            {stats.total}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Filter campaign"
          className="inline-flex rounded-full border border-black/[0.06] bg-white p-1"
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-4 py-1.5 text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#1D1D1F] font-semibold text-white'
                    : 'font-medium text-[#86868B] hover:text-[#1D1D1F]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {(['flash_sale', 'product_discount', 'free_shipping'] as CampaignType[]).map((type) => {
            const Icon = TYPE_ICON[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleStartCreate(type)}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-black/[0.04] px-3.5 text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.08]"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {CAMPAIGN_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-2xl border border-black/[0.06] bg-white">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3.5">
            <div>
              <p className="text-[14px] font-semibold tracking-tight text-[#1D1D1F]">
                Daftar campaign
              </p>
              <p className="text-[11px] text-[#86868B]">
                {filtered.length} {filter === 'all' ? 'total' : 'difilter'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStartCreate(filter === 'all' ? 'flash_sale' : filter)}
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
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#1D1D1F]/20 bg-primary/10 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/25 text-[#1D1D1F]">
                  <IconPlus className="h-4 w-4" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#1D1D1F]">
                    {CAMPAIGN_TYPE_LABELS[draftType]} baru
                  </p>
                  <p className="text-[11px] text-[#86868B]">Isi form di samping untuk simpan.</p>
                </div>
              </div>
            ) : null}

            {filtered.length === 0 && !isCreating ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
                  <IconCampaign className="h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-[#1D1D1F]">Belum ada campaign</p>
                <p className="mt-1 text-[12px] text-[#86868B]">
                  Pilih salah satu tipe di atas untuk mulai.
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const c = item.campaign;
                const isSelected = selectedId === c.id;
                const status = getCampaignStatus(c);
                const statusStyle = STATUS_STYLE[status];
                const Icon = TYPE_ICON[c.type as CampaignType];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[#1D1D1F]/15 bg-primary/10'
                        : 'border-transparent hover:bg-black/[0.03]'
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#1D1D1F]">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-[#1D1D1F]">
                          {c.name}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.className}`}
                        >
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium text-[#86868B]">
                        {formatRuleSummary(c)} · {c.usage_count}× dipakai
                      </p>
                      <p className="mt-1 text-[10px] text-[#86868B]">
                        {formatDateRange(c.starts_at, c.ends_at)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
          {selected || isCreating ? (
            <CampaignEditor
              data={selected}
              draftType={draftType}
              products={products}
              categories={categories}
              onClose={handleClose}
            />
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
                <IconCampaign className="h-6 w-6 text-[#86868B]" strokeWidth={1.5} />
              </div>
              <p className="mt-4 text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
                Pilih campaign untuk edit
              </p>
              <p className="mt-1 max-w-sm text-[13px] text-[#86868B]">
                Klik salah satu campaign di kiri untuk ubah aturan, periode, atau target. Atau pilih
                tipe di pojok kanan atas untuk buat campaign baru.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
