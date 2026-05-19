'use server';

import { revalidatePath } from 'next/cache';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { sendAdminChatMessage } from '@bananasbindery/api-client/chat';
import { getUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import type { AdminActionState } from '@/app/admin/action-feedback';

export async function replyChatWithFeedback(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const user = await getUser();
  if (!user || !(await isAdmin(user.id))) {
    return { status: 'error', message: 'Sesi admin tidak valid. Login ulang lalu coba lagi.' };
  }

  const conversationId = formData.get('conversationId');
  const message = formData.get('message');
  if (typeof conversationId !== 'string' || !conversationId) {
    return { status: 'error', message: 'Percakapan tidak valid.' };
  }
  if (typeof message !== 'string' || !message.trim()) {
    return { status: 'error', message: 'Isi balasan dulu sebelum kirim.' };
  }

  try {
    const supabase = supabaseAdmin as unknown as TypedSupabaseClient;
    await sendAdminChatMessage(supabase, user.id, conversationId, message.trim());
    revalidatePath('/admin/chats');
    return { status: 'success', message: 'Balasan terkirim ke customer.' };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error && error.message ? error.message : 'Gagal mengirim balasan.',
    };
  }
}
