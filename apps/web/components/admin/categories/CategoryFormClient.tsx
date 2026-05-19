'use client';

import { useActionState } from 'react';
import { Save } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import { saveCategoryWithFeedback } from '@/app/admin/action-feedback';
import {
  AdminActionMessage,
  PendingAwareSubmitButton,
  initialAdminActionState,
  useRefreshOnActionState,
} from '@/components/admin/ActionFeedback';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

type CategoryRow = Tables<'categories'>;

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const cardClass = 'rounded-2xl border border-black/[0.06] bg-white p-6';

export function CategoryFormClient({
  category,
  categories,
}: {
  category?: CategoryRow;
  categories: CategoryRow[];
}) {
  const [saveState, saveAction] = useActionState(saveCategoryWithFeedback, initialAdminActionState);
  useRefreshOnActionState(saveState);

  const parentOptions = categories.filter((item) => item.id !== category?.id);

  return (
    <form action={saveAction} className={cardClass}>
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-medium text-[#86868B]">
            {category ? 'Edit kategori' : 'Kategori baru'}
          </p>
          <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            {category?.name ?? 'Tambah kategori produk'}
          </h2>
        </div>
        <PendingAwareSubmitButton
          pendingText="Menyimpan..."
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#1D1D1F] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={14} strokeWidth={2} /> Simpan
        </PendingAwareSubmitButton>
      </div>

      <div className="mt-4">
        <AdminActionMessage state={saveState} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className={labelClass}>Nama</span>
          <input
            name="name"
            required
            defaultValue={category?.name ?? ''}
            className={inputClass}
            placeholder="Binder A5"
          />
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Slug</span>
          <input
            name="slug"
            defaultValue={category?.slug ?? ''}
            className={inputClass}
            placeholder="Otomatis dari nama jika kosong"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className={labelClass}>Deskripsi</span>
          <input
            name="description"
            defaultValue={category?.description ?? ''}
            className={inputClass}
            placeholder="Deskripsi singkat kategori"
          />
        </label>
        <div className="space-y-1.5 sm:col-span-2">
          <span className={labelClass}>Foto kategori</span>
          <ImageUploadField
            bucket="categories"
            name="image_url"
            defaultValue={category?.image_url ?? ''}
            label="Upload foto kategori"
          />
        </div>
        <label className="space-y-1.5">
          <span className={labelClass}>Parent kategori</span>
          <select name="parent_id" defaultValue={category?.parent_id ?? ''} className={inputClass}>
            <option value="">Tanpa parent</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={labelClass}>Urutan tampil</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={category?.sort_order ?? 0}
            className={inputClass}
          />
        </label>
        <label className="inline-flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-4 py-3 text-[14px] font-medium text-[#1D1D1F]">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={category?.is_active ?? true}
            className="h-4 w-4 accent-[#1D1D1F]"
          />
          Kategori aktif
        </label>
      </div>
    </form>
  );
}
