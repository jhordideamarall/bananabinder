'use server';

import {
  saveCategory,
  saveCustomOrderCatalog,
  saveStoreSettings,
  updateOrderStatus,
} from './actions';

export type AdminActionState = {
  status: 'idle' | 'success' | 'error';
  message: string;
};

function ok(message: string): AdminActionState {
  return { status: 'success', message };
}

function fail(error: unknown, fallback: string): AdminActionState {
  return {
    status: 'error',
    message: error instanceof Error && error.message ? error.message : fallback,
  };
}

export async function saveCategoryWithFeedback(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await saveCategory(formData);
    return ok('Kategori tersimpan. Daftar kategori dan storefront sudah diperbarui.');
  } catch (error) {
    return fail(error, 'Gagal menyimpan kategori.');
  }
}

export async function saveStoreSettingsWithFeedback(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await saveStoreSettings(formData);
    return ok('Pengaturan toko tersimpan. Perubahan sudah aktif.');
  } catch (error) {
    return fail(error, 'Gagal menyimpan pengaturan toko.');
  }
}

export async function updateOrderStatusWithFeedback(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await updateOrderStatus(formData);
    return ok('Status order tersimpan. Timeline dan data order sudah diperbarui.');
  } catch (error) {
    return fail(error, 'Gagal menyimpan status order.');
  }
}

export async function saveCustomOrderCatalogWithFeedback(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await saveCustomOrderCatalog(formData);
    return ok('Setup custom order tersimpan. Halaman custom sudah memakai konfigurasi terbaru.');
  } catch (error) {
    return fail(error, 'Gagal menyimpan setup custom order.');
  }
}
