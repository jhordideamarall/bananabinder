'use client';

import { useMemo } from 'react';
import { X as IconX, FolderTree as IconFolder } from 'lucide-react';
import type { CategoryOption } from './types';

interface CategoryPickerProps {
  available: CategoryOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryPicker({ available, selectedIds, onChange }: CategoryPickerProps) {
  const selected = useMemo(
    () => available.filter((c) => selectedIds.includes(c.id)),
    [available, selectedIds],
  );

  const toggle = (id: string): void => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-black/[0.06] bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold tracking-tight text-[#1D1D1F]">
          Kategori pilihan ({selected.length})
        </p>
        {selected.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[12px] font-medium text-[#86868B] hover:text-red-600"
          >
            Kosongkan
          </button>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F]"
            >
              {c.name}
              <button
                type="button"
                onClick={() => toggle(c.id)}
                className="rounded-full p-0.5 hover:bg-black/10"
                aria-label={`Hapus ${c.name}`}
              >
                <IconX className="h-3 w-3" strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {available.length === 0 ? (
        <div className="rounded-lg border border-black/[0.04] p-6 text-center text-[12px] text-[#86868B]">
          Belum ada kategori. Buat dulu di menu Categories.
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {available.map((c) => {
            const checked = selectedIds.includes(c.id);
            return (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
                  checked
                    ? 'border-[#1D1D1F]/15 bg-primary/10 text-[#1D1D1F]'
                    : 'border-black/[0.06] bg-white text-[#1D1D1F] hover:bg-black/[0.02]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 accent-[#1D1D1F]"
                />
                <IconFolder className="h-4 w-4 text-[#86868B]" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-[11px] text-[#86868B]">{c.productCount} produk</p>
                </div>
              </label>
            );
          })}
        </div>
      )}

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="categoryIds" value={id} />
      ))}
    </div>
  );
}
