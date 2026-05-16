import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Manajemen Kategori',
};
import Link from 'next/link';
import { ImageIcon, Save } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { saveCategory } from '../actions';

type CategoryRow = Tables<'categories'>;

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';
const cardClass = 'rounded-2xl border border-black/[0.06] bg-white p-6';

function CategoryForm({
  category,
  categories,
}: {
  category?: CategoryRow;
  categories: CategoryRow[];
}) {
  const parentOptions = categories.filter((item) => item.id !== category?.id);

  return (
    <form action={saveCategory} className={cardClass}>
      <input type="hidden" name="id" value={category?.id ?? ''} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[#86868B]">
            {category ? 'Edit kategori' : 'Kategori baru'}
          </p>
          <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            {category?.name ?? 'Tambah kategori produk'}
          </h2>
        </div>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1D1D1F] px-4 text-[13px] font-medium text-white transition-colors hover:bg-black"
        >
          <Save size={14} strokeWidth={2} /> Simpan
        </button>
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

export default async function AdminCategoriesPage() {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  const categories = (data ?? []) as CategoryRow[];
  const nameById = new Map(categories.map((item) => [item.id, item.name]));

  return (
    <div className="mx-auto max-w-[1240px] space-y-8">
      <header>
        <p className="text-[13px] font-medium text-[#86868B]">Pengaturan</p>
        <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight text-[#1D1D1F]">
          Kategori produk
        </h1>
        <p className="mt-1 max-w-2xl text-[14px] text-[#86868B]">
          Tambah, ubah nama, slug, parent, urutan tampil, dan status aktif kategori binder.
        </p>
      </header>

      <CategoryForm categories={categories} />

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#1D1D1F]">
            Daftar kategori
          </h2>
          <p className="text-[13px] text-[#86868B]">{categories.length} kategori</p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/[0.1] bg-white p-12 text-center">
            <p className="text-[15px] font-medium text-[#1D1D1F]">Belum ada kategori</p>
            <p className="mt-1 text-[13px] text-[#86868B]">
              Tambah kategori pertama lewat form di atas.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => (
              <article key={category.id} className={cardClass}>
                <div className="flex gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#FAFAFA]">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#C7C7CC]">
                        <ImageIcon size={20} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold tracking-tight text-[#1D1D1F]">
                          {category.name}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#86868B]">
                          /{category.slug} · urutan {category.sort_order ?? 0}
                          {category.parent_id
                            ? ` · parent: ${nameById.get(category.parent_id) ?? '—'}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          category.is_active
                            ? 'bg-primary/20 text-[#1D1D1F]'
                            : 'bg-black/[0.05] text-[#86868B]'
                        }`}
                      >
                        {category.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/categories/${category.slug}`}
                        className="inline-flex h-8 items-center rounded-full bg-black/[0.04] px-3 text-[12px] font-medium text-[#1D1D1F] transition-colors hover:bg-black/[0.08]"
                      >
                        Lihat di storefront
                      </Link>
                    </div>
                  </div>
                </div>

                <details className="group mt-4 rounded-xl border border-black/[0.06] bg-[#FAFAFA]">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-medium text-[#1D1D1F]">
                    <span>Edit kategori ini</span>
                    <span className="text-[12px] text-[#86868B] group-open:hidden">Buka</span>
                    <span className="hidden text-[12px] text-[#86868B] group-open:inline">
                      Tutup
                    </span>
                  </summary>
                  <div className="border-t border-black/[0.06] bg-white p-4">
                    <CategoryForm category={category} categories={categories} />
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
