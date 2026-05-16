'use client';

import { useState, useTransition } from 'react';
import { Plus as IconPlus, Ticket as IconTicket, Check as IconCheck } from 'lucide-react';
import type { Enums, Tables } from '@bananasbindery/types/supabase';
import { saveVoucher, toggleVoucherActive } from '@/app/admin/actions';

type VoucherRow = Tables<'vouchers'>;

const voucherTypes: { value: Enums<'voucher_type'>; label: string }[] = [
  { value: 'percentage', label: 'Persentase (%)' },
  { value: 'fixed', label: 'Nominal tetap (Rp)' },
];

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

function dateValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function VoucherToggle({ voucher }: { voucher: VoucherRow }) {
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(voucher.is_active ?? false);

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.checked;
    setOptimistic(next);

    const formData = new FormData();
    formData.set('id', voucher.id);
    if (next) formData.set('is_active', 'on');

    startTransition(async () => {
      try {
        await toggleVoucherActive(formData);
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
        aria-label={optimistic ? 'Nonaktifkan voucher' : 'Aktifkan voucher'}
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

interface VoucherEditorProps {
  voucher: VoucherRow | null;
  onSaved: () => void;
}

function VoucherEditor({ voucher, onSaved }: VoucherEditorProps) {
  const isNew = voucher === null;

  return (
    <form
      key={voucher?.id ?? 'new'}
      action={async (formData) => {
        await saveVoucher(formData);
        onSaved();
      }}
      className="flex flex-col"
    >
      <input type="hidden" name="id" value={voucher?.id ?? ''} />

      <div className="space-y-5 p-6">
        <header>
          <p className={labelClass}>{isNew ? 'Voucher baru' : 'Edit voucher'}</p>
          <h3 className="mt-0.5 font-mono text-[20px] font-semibold tracking-tight text-[#1D1D1F]">
            {isNew ? 'Buat kode baru' : voucher?.code}
          </h3>
          {voucher ? (
            <p className="mt-1 text-[13px] text-[#86868B]">
              Sudah dipakai {voucher.used_count ?? 0}× oleh pelanggan.
            </p>
          ) : null}
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={labelClass}>Kode voucher</span>
            <input
              name="code"
              required
              defaultValue={voucher?.code ?? ''}
              className={`${inputClass} font-mono uppercase`}
              placeholder="PROMO10"
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Tipe diskon</span>
            <select name="type" defaultValue={voucher?.type ?? 'percentage'} className={inputClass}>
              {voucherTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Nilai diskon</span>
            <input
              name="value"
              type="number"
              min="0"
              required
              defaultValue={voucher?.value ?? 0}
              className={inputClass}
            />
            <span className="block text-[11px] text-[#86868B]">
              Isi 10 untuk 10% atau 10000 untuk Rp 10.000.
            </span>
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Minimal order</span>
            <input
              name="min_order"
              type="number"
              min="0"
              defaultValue={voucher?.min_order ?? ''}
              className={inputClass}
              placeholder="Opsional"
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Max diskon</span>
            <input
              name="max_discount"
              type="number"
              min="0"
              defaultValue={voucher?.max_discount ?? ''}
              className={inputClass}
              placeholder="Opsional"
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Limit pemakaian</span>
            <input
              name="usage_limit"
              type="number"
              min="0"
              defaultValue={voucher?.usage_limit ?? ''}
              className={inputClass}
              placeholder="Opsional"
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Valid dari</span>
            <input
              name="valid_from"
              type="date"
              required
              defaultValue={dateValue(voucher?.valid_from ?? null)}
              className={inputClass}
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Valid sampai</span>
            <input
              name="valid_until"
              type="date"
              required
              defaultValue={dateValue(voucher?.valid_until ?? null)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-black/[0.03] px-4 py-3">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={voucher?.is_active ?? true}
            className="h-4 w-4 accent-[#1D1D1F]"
          />
          <span className="text-[14px] font-medium text-[#1D1D1F]">
            Voucher aktif &mdash; bisa dipakai pelanggan
          </span>
        </label>
      </div>

      <footer className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-black/[0.06] bg-white/95 px-6 py-4 backdrop-blur-xl">
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black"
        >
          <IconCheck className="h-4 w-4" strokeWidth={2} />
          {isNew ? 'Simpan voucher' : 'Simpan perubahan'}
        </button>
      </footer>
    </form>
  );
}

interface VoucherManagerProps {
  vouchers: VoucherRow[];
}

export function VoucherManager({ vouchers }: VoucherManagerProps) {
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);

  const selectedVoucher =
    selectedId && selectedId !== 'new' ? (vouchers.find((v) => v.id === selectedId) ?? null) : null;
  const isCreating = selectedId === 'new';

  const handleSaved = (): void => {
    setSelectedId(null);
  };

  const activeCount = vouchers.filter((v) => v.is_active).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-black/[0.06] bg-white">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3.5">
          <div>
            <p className="text-[14px] font-semibold tracking-tight text-[#1D1D1F]">Voucher</p>
            <p className="text-[11px] text-[#86868B]">
              {activeCount} aktif dari {vouchers.length} total
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
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#1D1D1F]/20 bg-primary/10 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/25 text-[#1D1D1F]">
                <IconPlus className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#1D1D1F]">Voucher baru</p>
                <p className="text-[11px] text-[#86868B]">Isi form di samping untuk simpan</p>
              </div>
            </div>
          ) : null}

          {vouchers.length === 0 && !isCreating ? (
            <div className="p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04]">
                <IconTicket className="h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
              </div>
              <p className="mt-3 text-[13px] font-medium text-[#1D1D1F]">Belum ada voucher</p>
              <p className="mt-1 text-[12px] text-[#86868B]">
                Tap &ldquo;Baru&rdquo; untuk buat voucher pertama.
              </p>
            </div>
          ) : (
            vouchers.map((voucher) => {
              const selected = selectedId === voucher.id;
              const valueLabel =
                voucher.type === 'percentage'
                  ? `${voucher.value}%`
                  : currency.format(voucher.value);
              return (
                <button
                  key={voucher.id}
                  type="button"
                  onClick={() => setSelectedId(voucher.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                    selected
                      ? 'border-[#1D1D1F]/15 bg-primary/10'
                      : 'border-transparent hover:bg-black/[0.03]'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-[#1D1D1F]">
                    <IconTicket className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] font-semibold text-[#1D1D1F]">
                      {voucher.code}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[#86868B]">
                      {valueLabel} · dipakai {voucher.used_count ?? 0}×
                    </p>
                  </div>
                  <VoucherToggle voucher={voucher} />
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
        {selectedVoucher || isCreating ? (
          <VoucherEditor voucher={selectedVoucher} onSaved={handleSaved} />
        ) : (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/[0.04]">
              <IconTicket className="h-6 w-6 text-[#86868B]" strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
              Pilih voucher untuk edit
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-[#86868B]">
              Klik salah satu voucher di kiri untuk ubah nilai diskon, masa berlaku, atau limit
              pemakaian. Atau tap &ldquo;Baru&rdquo; untuk buat voucher campaign.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
