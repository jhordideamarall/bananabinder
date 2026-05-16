'use client';

import { useMemo, useState } from 'react';
import { Search as IconSearch, X as IconX, Package as IconPackage } from 'lucide-react';
import type { ProductOption } from './types';

interface ProductPickerProps {
  available: ProductOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function ProductPicker({ available, selectedIds, onChange }: ProductPickerProps) {
  const [query, setQuery] = useState('');
  const selected = useMemo(
    () => available.filter((p) => selectedIds.includes(p.id)),
    [available, selectedIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter((p) => p.name.toLowerCase().includes(q));
  }, [available, query]);

  const toggle = (id: string): void => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const clearAll = (): void => onChange([]);

  return (
    <div className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
          Produk pilihan ({selected.length})
        </p>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-medium text-[#86868B] hover:text-red-600"
          >
            Kosongkan
          </button>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F]"
            >
              {p.name}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="rounded-full p-0.5 hover:bg-black/10"
                aria-label={`Hapus ${p.name}`}
              >
                <IconX className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <IconSearch
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868B]"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk berdasarkan nama..."
          className="h-10 w-full rounded-xl border border-black/[0.08] bg-white pl-9 pr-3 text-[13px] font-medium text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-lg border border-black/[0.04]">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-[12px] text-[#86868B]">
            {query ? `Tidak ada produk cocok "${query}"` : 'Belum ada produk di katalog'}
          </div>
        ) : (
          <ul>
            {filtered.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <li key={p.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 border-b border-black/[0.04] px-3 py-2.5 transition-colors last:border-0 ${
                      checked ? 'bg-primary/8' : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-[#1D1D1F]"
                    />
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-black/[0.04]">
                        <IconPackage className="h-4 w-4 text-[#86868B]" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[#1D1D1F]">{p.name}</p>
                      <p className="text-[11px] text-[#86868B]">{currency.format(p.price)}</p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="productIds" value={id} />
      ))}
    </div>
  );
}
