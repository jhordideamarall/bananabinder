'use client';

import { useActionState } from 'react';
import { updateOrderStatusWithFeedback } from '@/app/admin/action-feedback';
import {
  AdminActionMessage,
  PendingAwareSubmitButton,
  initialAdminActionState,
  useRefreshOnActionState,
} from '@/components/admin/ActionFeedback';

const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'expired',
  'return_requested',
  'returned',
  'refunded',
] as const;

const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid'] as const;

export function OrderStatusForm({
  order,
}: {
  order: {
    id: string;
    status: string;
    payment_status: string;
    shipping_tracking: string | null;
    notes: string | null;
  };
}) {
  const [saveState, saveAction] = useActionState(
    updateOrderStatusWithFeedback,
    initialAdminActionState,
  );
  useRefreshOnActionState(saveState);

  return (
    <form action={saveAction} className="space-y-4">
      <input type="hidden" name="id" value={order.id} />

      <label className="block space-y-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          Status pesanan
        </span>
        <select
          name="status"
          defaultValue={order.status}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
        >
          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          Status pembayaran
        </span>
        <select
          name="payment_status"
          defaultValue={order.payment_status}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
        >
          {PAYMENT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          No. Resi / Tracking
        </span>
        <input
          type="text"
          name="shipping_tracking"
          defaultValue={order.shipping_tracking ?? ''}
          placeholder="Masukkan nomor resi"
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          Catatan internal
        </span>
        <textarea
          name="notes"
          defaultValue={order.notes ?? ''}
          rows={3}
          placeholder="Catatan untuk tim (opsional)"
          className="w-full resize-none rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900 outline-none focus:border-primary"
        />
      </label>

      <AdminActionMessage state={saveState} />

      <PendingAwareSubmitButton
        pendingText="Menyimpan perubahan..."
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-heading text-sm font-black text-white shadow-lg shadow-primary/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Simpan Perubahan
      </PendingAwareSubmitButton>
    </form>
  );
}
