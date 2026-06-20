'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import {
  approveManualPaymentWithFeedback,
  expireManualOrderWithFeedback,
  rejectManualPaymentWithFeedback,
} from '@/app/admin/action-feedback';
import {
  AdminActionMessage,
  PendingAwareSubmitButton,
  initialAdminActionState,
  useRefreshOnActionState,
} from '@/components/admin/ActionFeedback';

interface ManualPaymentProof {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  signed_url: string | null;
  submitted_amount: number | null;
  payment_destination_label: string | null;
  status: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRupiah(value: number | null): string {
  if (value == null) return '-';
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ManualPaymentReview({
  orderId,
  proof,
}: {
  orderId: string;
  proof: ManualPaymentProof | null;
}) {
  const [approveState, approveAction] = useActionState(
    approveManualPaymentWithFeedback,
    initialAdminActionState,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectManualPaymentWithFeedback,
    initialAdminActionState,
  );
  const [expireState, expireAction] = useActionState(
    expireManualOrderWithFeedback,
    initialAdminActionState,
  );

  useRefreshOnActionState(approveState);
  useRefreshOnActionState(rejectState);
  useRefreshOnActionState(expireState);

  return (
    <div className="space-y-4">
      {proof ? (
        <>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
            {proof.signed_url && proof.file_type.startsWith('image/') ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white">
                <Image
                  src={proof.signed_url}
                  alt="Bukti transfer"
                  fill
                  className="object-contain"
                />
              </div>
            ) : proof.signed_url ? (
              <a
                href={proof.signed_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm font-black text-primary"
              >
                Buka file bukti transfer
              </a>
            ) : (
              <p className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-500">
                Signed URL bukti belum tersedia.
              </p>
            )}
          </div>

          <div className="grid gap-2 text-sm">
            <Row label="Status proof" value={proof.status} />
            <Row label="Nominal submit" value={formatRupiah(proof.submitted_amount)} />
            <Row label="Tujuan transfer" value={proof.payment_destination_label || '-'} />
            <Row label="File" value={`${proof.file_name} (${formatBytes(proof.file_size)})`} />
            <Row label="Diupload" value={formatDate(proof.created_at)} />
            <Row label="Direview" value={formatDate(proof.reviewed_at)} />
          </div>

          {proof.rejection_reason ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {proof.rejection_reason}
            </p>
          ) : null}

          <form action={approveAction}>
            <input type="hidden" name="order_id" value={orderId} />
            <input type="hidden" name="proof_id" value={proof.id} />
            <AdminActionMessage state={approveState} />
            <PendingAwareSubmitButton
              pendingText="Menyetujui..."
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-heading text-sm font-black text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              Setujui Pembayaran
            </PendingAwareSubmitButton>
          </form>

          {proof.status !== 'approved' ? (
            <form action={rejectAction} className="space-y-2">
              <input type="hidden" name="order_id" value={orderId} />
              <input type="hidden" name="proof_id" value={proof.id} />
              <textarea
                name="rejection_reason"
                rows={2}
                placeholder="Alasan penolakan untuk customer"
                className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
              />
              <AdminActionMessage state={rejectState} />
              <PendingAwareSubmitButton
                pendingText="Menolak..."
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 font-heading text-xs font-black text-red-700 transition active:scale-[0.98] disabled:opacity-60"
              >
                Tolak Bukti
              </PendingAwareSubmitButton>
            </form>
          ) : null}
        </>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          Belum ada bukti transfer. Order masih bisa diexpire untuk melepas stok jika customer batal
          bayar.
        </p>
      )}

      <form action={expireAction} className="border-t border-gray-100 pt-4">
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="reason" value="manual_payment_expired_by_admin" />
        <AdminActionMessage state={expireState} />
        <PendingAwareSubmitButton
          pendingText="Meng-expire..."
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white font-heading text-xs font-black text-gray-700 transition active:scale-[0.98] disabled:opacity-60"
        >
          Expire & Kembalikan Stok
        </PendingAwareSubmitButton>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className="text-right font-bold text-gray-900">{value}</span>
    </div>
  );
}
