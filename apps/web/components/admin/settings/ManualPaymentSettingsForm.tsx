'use client';

import { useMemo, useState, useActionState } from 'react';
import { Banknote, CreditCard, Plus, Save, Trash2 } from 'lucide-react';
import type { Tables } from '@bananasbindery/types/supabase';
import {
  parseManualPaymentAccounts,
  serializeManualPaymentAccounts,
  type ManualPaymentAccount,
} from '@bananasbindery/api-client/manual-payment';
import { saveStoreSettingsWithFeedback } from '@/app/admin/action-feedback';
import {
  AdminActionMessage,
  PendingAwareSubmitButton,
  initialAdminActionState,
  useRefreshOnActionState,
} from '@/components/admin/ActionFeedback';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

type StoreSettingsRow = Tables<'store_settings'>;

const inputClass =
  'h-11 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20';
const labelClass = 'text-[12px] font-medium text-[#86868B]';

function newAccount(sortOrder: number): ManualPaymentAccount {
  return {
    id: crypto.randomUUID(),
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    label: '',
    isActive: true,
    sortOrder,
  };
}

export function ManualPaymentSettingsForm({
  settings,
}: {
  settings: StoreSettingsRow | undefined;
}) {
  const [saveState, saveAction] = useActionState(
    saveStoreSettingsWithFeedback,
    initialAdminActionState,
  );
  useRefreshOnActionState(saveState);

  const [enabled, setEnabled] = useState(Boolean(settings?.manual_payment_enabled));
  const [codEnabled, setCodEnabled] = useState(settings?.cod_enabled ?? true);
  const [qrUrl, setQrUrl] = useState(settings?.manual_payment_qr_image_url ?? '');
  const [instructions, setInstructions] = useState(settings?.manual_payment_instructions ?? '');
  const [expiresHours, setExpiresHours] = useState(
    String(settings?.manual_payment_expires_hours ?? 24),
  );
  const [accounts, setAccounts] = useState<ManualPaymentAccount[]>(() => {
    const parsed = parseManualPaymentAccounts(settings?.manual_payment_accounts);
    return parsed.length > 0 ? parsed : [newAccount(0)];
  });

  const accountsJson = useMemo(() => serializeManualPaymentAccounts(accounts), [accounts]);

  const updateAccount = (
    id: string,
    field: keyof ManualPaymentAccount,
    value: string | boolean | number,
  ) => {
    setAccounts((current) =>
      current.map((account) => (account.id === id ? { ...account, [field]: value } : account)),
    );
  };

  const removeAccount = (id: string) => {
    setAccounts((current) =>
      current
        .filter((account) => account.id !== id)
        .map((account, index) => ({
          ...account,
          sortOrder: index,
        })),
    );
  };

  return (
    <form action={saveAction} className="rounded-2xl border border-black/[0.06] bg-white">
      <input type="hidden" name="manual_payment_form" value="1" />
      <input type="hidden" name="manual_payment_qr_image_url" value={qrUrl} />
      <input type="hidden" name="manual_payment_accounts" value={accountsJson} />

      <div className="flex items-start gap-3 border-b border-black/[0.06] px-6 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-[#1D1D1F]">
          <CreditCard className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">
            Metode pembayaran
          </h3>
          <p className="mt-0.5 text-[13px] leading-relaxed text-[#86868B]">
            Atur COD, QR statis, dan rekening transfer yang tersedia di checkout.
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <label className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#FAFAFA] px-4 py-3">
          <span className="flex items-start gap-3">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span>
              <span className="block text-[14px] font-semibold text-[#1D1D1F]">Aktifkan COD</span>
              <span className="text-[12px] font-medium text-[#86868B]">
                Customer dapat membayar saat pesanan diterima.
              </span>
            </span>
          </span>
          <input
            type="checkbox"
            name="cod_enabled"
            checked={codEnabled}
            onChange={(event) => setCodEnabled(event.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-[#FAFAFA] px-4 py-3">
          <span>
            <span className="block text-[14px] font-semibold text-[#1D1D1F]">
              Aktifkan payment manual
            </span>
            <span className="text-[12px] font-medium text-[#86868B]">
              Checkout baru memakai QR/rekening dan bukti transfer.
            </span>
          </span>
          <input
            type="checkbox"
            name="manual_payment_enabled"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-5 w-5 accent-primary"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div className="space-y-2">
            <span className={labelClass}>QR / QRIS statis</span>
            <ImageUploadField
              bucket="payment-assets"
              label={qrUrl ? 'Ganti QR' : 'Upload QR'}
              defaultValue={qrUrl}
              onUploaded={setQrUrl}
            />
            {qrUrl ? (
              <div className="overflow-hidden rounded-xl border border-black/[0.08] bg-[#FAFAFA] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrUrl}
                  alt="QR payment manual"
                  className="aspect-square w-full object-contain"
                />
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <span className={labelClass}>URL QR</span>
            <input
              value={qrUrl}
              onChange={(event) => setQrUrl(event.target.value)}
              className={inputClass}
              placeholder="https://..."
            />
            <p className="text-[11px] font-medium leading-relaxed text-[#86868B]">
              Bisa upload QR dari tombol kiri atau paste URL public QR.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <label className="space-y-1.5">
            <span className={labelClass}>Instruksi pembayaran</span>
            <textarea
              name="manual_payment_instructions"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-black/[0.08] bg-white p-3.5 text-[14px] font-medium text-[#1D1D1F] outline-none transition-colors placeholder:text-[#86868B] focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Transfer sesuai total akhir, lalu upload bukti pembayaran."
            />
          </label>
          <label className="space-y-1.5">
            <span className={labelClass}>Batas bayar (jam)</span>
            <input
              name="manual_payment_expires_hours"
              value={expiresHours}
              onChange={(event) => setExpiresHours(event.target.value)}
              type="number"
              min={1}
              className={inputClass}
            />
          </label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-[#1D1D1F]">Daftar rekening</p>
              <p className="text-[12px] font-medium text-[#86868B]">
                Customer akan melihat semua rekening yang aktif.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAccounts((current) => [...current, newAccount(current.length)])}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1D1D1F] px-3.5 text-[12px] font-medium text-white"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              Tambah
            </button>
          </div>

          <div className="space-y-3">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="rounded-xl border border-black/[0.06] bg-[#FAFAFA] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1D1D1F]">
                    <input
                      type="checkbox"
                      checked={account.isActive}
                      onChange={(event) =>
                        updateAccount(account.id, 'isActive', event.target.checked)
                      }
                      className="h-4 w-4 accent-primary"
                    />
                    Rekening aktif
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAccount(account.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-600"
                    aria-label={`Hapus rekening ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className={labelClass}>Bank / e-wallet</span>
                    <input
                      value={account.bankName}
                      onChange={(event) =>
                        updateAccount(account.id, 'bankName', event.target.value)
                      }
                      className={inputClass}
                      placeholder="BCA"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Nomor rekening</span>
                    <input
                      value={account.accountNumber}
                      onChange={(event) =>
                        updateAccount(account.id, 'accountNumber', event.target.value)
                      }
                      className={inputClass}
                      placeholder="1234567890"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Atas nama</span>
                    <input
                      value={account.accountHolder}
                      onChange={(event) =>
                        updateAccount(account.id, 'accountHolder', event.target.value)
                      }
                      className={inputClass}
                      placeholder="Bananasbindery"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className={labelClass}>Label tampilan</span>
                    <input
                      value={account.label}
                      onChange={(event) => updateAccount(account.id, 'label', event.target.value)}
                      className={inputClass}
                      placeholder="Rekening utama"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex flex-col gap-3 border-t border-black/[0.06] bg-[#FAFAFA] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <AdminActionMessage state={saveState} />
        </div>
        <PendingAwareSubmitButton
          pendingText="Menyimpan payment..."
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1D1D1F] px-5 text-[14px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Simpan payment manual
        </PendingAwareSubmitButton>
      </footer>
    </form>
  );
}
