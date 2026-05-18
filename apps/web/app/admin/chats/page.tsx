import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import type { Route } from 'next';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import {
  type ChatConversationSummary,
  type ChatMessageItem,
  getAdminChatConversations,
  getAdminChatMessages,
  sendAdminChatMessage,
} from '@bananasbindery/api-client/chat';
import { getUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { AdminChatRealtime } from './_admin-chat-realtime';

interface AdminChatsPageProps {
  searchParams: Promise<{ conversation?: string }>;
}

const fmtDate = (value: string | null): string => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const readMetadataString = (metadata: unknown, key: string): string | null => {
  if (typeof metadata !== 'object' || metadata === null) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value : null;
};

const getThreadContext = (
  conversation: ChatConversationSummary,
  messages: ChatMessageItem[],
): {
  productName: string;
  productSlug: string | null;
  variantName: string | null;
  productImageUrl: string | null;
} => {
  const metadataMessages = [...messages].reverse();
  const productName =
    metadataMessages
      .map((message) => readMetadataString(message.metadata, 'product_name'))
      .find(Boolean) ??
    conversation.products?.name ??
    conversation.subject;
  const productSlug =
    metadataMessages
      .map((message) => readMetadataString(message.metadata, 'product_slug'))
      .find(Boolean) ??
    conversation.products?.slug ??
    null;
  const variantName =
    metadataMessages
      .map((message) => readMetadataString(message.metadata, 'variant_name'))
      .find(Boolean) ?? null;
  const productImageUrl =
    metadataMessages
      .map((message) => readMetadataString(message.metadata, 'product_image_url'))
      .find(Boolean) ??
    conversation.products?.product_images?.find((image) => image.url)?.url ??
    null;

  return { productName, productSlug, variantName, productImageUrl };
};

async function replyChat(formData: FormData): Promise<void> {
  'use server';

  const user = await getUser();
  if (!user || !(await isAdmin(user.id))) return;

  const conversationId = formData.get('conversationId');
  const message = formData.get('message');
  if (typeof conversationId !== 'string' || typeof message !== 'string') return;

  const supabase = supabaseAdmin as unknown as TypedSupabaseClient;
  await sendAdminChatMessage(supabase, user.id, conversationId, message);
  revalidatePath('/admin/chats');
}

export default async function AdminChatsPage({ searchParams }: AdminChatsPageProps) {
  const { conversation: selectedId } = await searchParams;
  const supabase = supabaseAdmin as unknown as TypedSupabaseClient;
  const conversations = await getAdminChatConversations(supabase);
  const activeConversation =
    conversations.find((item) => item.id === selectedId) ?? conversations[0] ?? null;
  const messages = activeConversation
    ? await getAdminChatMessages(supabase, activeConversation.id)
    : [];
  const threadContext = activeConversation ? getThreadContext(activeConversation, messages) : null;

  return (
    <main className="space-y-6">
      <AdminChatRealtime activeConversationId={activeConversation?.id ?? null} />
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-primary">
          Store chat
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1D1D1F]">
          Chat Produk
        </h1>
        <p className="mt-1 text-[14px] text-[#86868B]">
          Pertanyaan customer dari detail produk. Setiap chat otomatis membawa konteks produk.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/10 px-4 py-3">
            <p className="text-[13px] font-semibold text-[#1D1D1F]">Inbox</p>
          </div>
          <div className="max-h-[68vh] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="px-4 py-6 text-[14px] text-[#86868B]">Belum ada chat masuk.</p>
            ) : (
              conversations.map((conversation) => {
                const isActive = activeConversation?.id === conversation.id;
                const href = `/admin/chats?conversation=${conversation.id}` as Route;
                return (
                  <Link
                    key={conversation.id}
                    href={href}
                    className={`block border-b border-black/5 px-4 py-3 transition-colors ${
                      isActive ? 'bg-primary/10' : 'hover:bg-black/[0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {conversation.products?.product_images?.[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={conversation.products.product_images[0].url}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-lg border border-black/10 object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A7B22]">
                          Produk
                        </p>
                        <p className="line-clamp-1 text-[14px] font-semibold text-[#1D1D1F]">
                          {conversation.products?.name ?? conversation.subject}
                        </p>
                        <p className="mt-1 line-clamp-1 text-[12px] text-[#86868B]">
                          {conversation.profiles?.name ??
                            conversation.profiles?.email ??
                            'Customer'}
                        </p>
                      </div>
                      {conversation.admin_unread_count > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                          {conversation.admin_unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-[11px] text-[#A1A1A6]">
                      {fmtDate(conversation.last_message_at)}
                    </p>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
          {activeConversation ? (
            <>
              <div className="border-b border-black/10 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1D1D1F]">
                      {threadContext?.productName ?? activeConversation.subject}
                    </h2>
                    <p className="mt-1 text-[13px] text-[#86868B]">
                      Customer:{' '}
                      {activeConversation.profiles?.name ??
                        activeConversation.profiles?.email ??
                        activeConversation.user_id}
                    </p>
                  </div>
                  {threadContext?.productSlug ? (
                    <Link
                      href={`/products/${threadContext.productSlug}` as Route}
                      className="rounded-full border border-primary/30 px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-primary/10"
                    >
                      Buka produk
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-black/[0.08] bg-[#FFFDF8] px-4 py-3">
                  {threadContext?.productImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={threadContext.productImageUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-xl border border-black/10 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A7B22]">
                      Konteks chat
                    </p>
                    <p className="mt-1 text-[14px] font-semibold text-[#1D1D1F]">
                      {threadContext?.productName ?? activeConversation.subject}
                    </p>
                    {threadContext?.variantName ? (
                      <p className="mt-0.5 text-[12px] font-medium text-[#86868B]">
                        Varian: {threadContext.variantName}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex max-h-[52vh] min-h-[360px] flex-col gap-3 overflow-y-auto bg-[#FDFCFB] px-5 py-4">
                {messages.map((message) => {
                  const fromCustomer = message.sender_type === 'customer';
                  return (
                    <div
                      key={message.id}
                      className={`flex ${fromCustomer ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                          fromCustomer
                            ? 'border border-black/10 bg-white text-[#1D1D1F]'
                            : 'border border-[#F7D75C] bg-[#FFE27A] text-[#1D1D1F]'
                        }`}
                      >
                        <p>{message.body}</p>
                        <p className="mt-2 text-[11px] text-[#86868B]">
                          {message.sender_type} · {fmtDate(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form action={replyChat} className="flex gap-3 border-t border-black/10 p-4">
                <input type="hidden" name="conversationId" value={activeConversation.id} />
                <textarea
                  name="message"
                  rows={3}
                  required
                  placeholder="Balas customer..."
                  className="min-h-[84px] flex-1 resize-none rounded-xl border border-primary/30 px-3 py-2 text-[14px] outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Kirim
                </button>
              </form>
            </>
          ) : (
            <div className="px-5 py-12 text-center text-[14px] text-[#86868B]">
              Pilih percakapan untuk membaca dan membalas chat produk.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
