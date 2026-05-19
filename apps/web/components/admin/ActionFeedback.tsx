'use client';

import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { AdminActionState } from '@/app/admin/action-feedback';

export const initialAdminActionState: AdminActionState = {
  status: 'idle',
  message: '',
};

export function useRefreshOnActionState(state: AdminActionState) {
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'idle') router.refresh();
  }, [router, state.status]);
}

export function AdminActionMessage({ state }: { state: AdminActionState }) {
  if (!state.message) return null;

  const isSuccess = state.status === 'success';

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12px] font-medium leading-relaxed ${
        isSuccess
          ? 'border border-emerald-500/15 bg-emerald-500/10 text-emerald-800'
          : 'border border-red-500/15 bg-red-500/10 text-red-700'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      ) : (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      )}
      <span>{state.message}</span>
    </div>
  );
}

export function PendingAwareSubmitButton({
  children,
  pendingText = 'Menyimpan...',
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} /> : null}
      {pending ? pendingText : children}
    </button>
  );
}
