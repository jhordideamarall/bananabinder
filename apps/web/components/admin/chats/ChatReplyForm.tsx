'use client';

import { useActionState, useEffect, useRef } from 'react';
import { replyChatWithFeedback } from '@/app/admin/chats/actions';
import {
  AdminActionMessage,
  PendingAwareSubmitButton,
  initialAdminActionState,
  useRefreshOnActionState,
} from '@/components/admin/ActionFeedback';

export function ChatReplyForm({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useActionState(replyChatWithFeedback, initialAdminActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useRefreshOnActionState(state);

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset();
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 border-t border-black/10 p-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-3">
        <textarea
          name="message"
          rows={3}
          required
          placeholder="Balas customer..."
          className="min-h-[84px] flex-1 resize-none rounded-xl border border-primary/30 px-3 py-2 text-[14px] outline-none focus:border-primary"
        />
        <PendingAwareSubmitButton
          pendingText="Mengirim..."
          className="inline-flex min-w-[92px] items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Kirim
        </PendingAwareSubmitButton>
      </div>
      <AdminActionMessage state={state} />
    </form>
  );
}
