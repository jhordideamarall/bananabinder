import type { Json } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from './types';

export type ChatSenderType = 'customer' | 'admin' | 'ai' | 'system';
export type ChatConversationStatus = 'open' | 'pending' | 'resolved' | 'archived';
export type ChatAiMode = 'off' | 'suggest' | 'auto';

export interface ProductChatContext {
  productId: string;
  productName: string;
  productSlug?: string | null;
  productImageUrl?: string | null;
  variantId?: string | null;
  variantName?: string | null;
}

export interface ChatConversationSummary {
  id: string;
  user_id: string;
  order_id: string | null;
  product_id: string | null;
  subject: string;
  status: ChatConversationStatus;
  ai_mode: ChatAiMode;
  admin_unread_count: number;
  customer_unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: string | null;
    slug: string | null;
    product_images?: { url: string | null }[] | null;
  } | null;
  profiles?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_type: ChatSenderType;
  body: string;
  metadata: Json;
  read_at: string | null;
  created_at: string;
}

export interface ProductChatThread {
  conversation: ChatConversationSummary | null;
  messages: ChatMessageItem[];
}

interface ChatConversationRow {
  id: string;
  user_id: string;
  order_id: string | null;
  product_id: string | null;
  subject: string;
  status: ChatConversationStatus;
  ai_mode: ChatAiMode;
  admin_unread_count: number;
  customer_unread_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: string | null;
    slug: string | null;
    product_images?: { url: string | null }[] | null;
  } | null;
  profiles?: {
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

const asConversationSummary = (row: ChatConversationRow): ChatConversationSummary => ({
  id: row.id,
  user_id: row.user_id,
  order_id: row.order_id,
  product_id: row.product_id,
  subject: row.subject,
  status: row.status,
  ai_mode: row.ai_mode,
  admin_unread_count: row.admin_unread_count,
  customer_unread_count: row.customer_unread_count,
  last_message_at: row.last_message_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
  products: row.products ?? null,
  profiles: row.profiles ?? null,
});

export async function getProductChatThread(
  supabase: TypedSupabaseClient,
  userId: string,
  productId: string,
): Promise<ProductChatThread> {
  const { data: conversation, error: conversationError } = await supabase
    .from('chat_conversations')
    .select(
      'id, user_id, order_id, product_id, subject, status, ai_mode, admin_unread_count, customer_unread_count, last_message_at, created_at, updated_at, products(name, slug)',
    )
    .eq('user_id', userId)
    .eq('product_id', productId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (conversationError) throw new Error(conversationError.message);
  if (!conversation) return { conversation: null, messages: [] };

  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_id, sender_type, body, metadata, read_at, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true });

  if (messagesError) throw new Error(messagesError.message);

  return {
    conversation: asConversationSummary(conversation as unknown as ChatConversationRow),
    messages: (messages ?? []) as ChatMessageItem[],
  };
}

export async function sendProductChatMessage(
  supabase: TypedSupabaseClient,
  userId: string,
  context: ProductChatContext,
  body: string,
): Promise<ProductChatThread> {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error('Pesan tidak boleh kosong.');
  if (trimmedBody.length > 4000) throw new Error('Pesan terlalu panjang.');

  const existing = await getProductChatThread(supabase, userId, context.productId);
  let conversationId = existing.conversation?.id ?? null;

  if (!conversationId) {
    const { data: insertedConversation, error: insertConversationError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        product_id: context.productId,
        subject: `Tanya produk: ${context.productName}`,
        status: 'open',
        ai_mode: 'off',
      })
      .select('id')
      .single();

    if (insertConversationError) throw new Error(insertConversationError.message);
    conversationId = insertedConversation.id;
  }

  const metadata: Json = {
    source: 'product_detail',
    product_id: context.productId,
    product_name: context.productName,
    product_slug: context.productSlug ?? null,
    product_image_url: context.productImageUrl ?? null,
    variant_id: context.variantId ?? null,
    variant_name: context.variantName ?? null,
  };

  const { error: insertMessageError } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    sender_type: 'customer',
    body: trimmedBody,
    metadata,
  });

  if (insertMessageError) throw new Error(insertMessageError.message);
  return getProductChatThread(supabase, userId, context.productId);
}

export async function getAdminChatConversations(
  supabase: TypedSupabaseClient,
): Promise<ChatConversationSummary[]> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select(
      'id, user_id, order_id, product_id, subject, status, ai_mode, admin_unread_count, customer_unread_count, last_message_at, created_at, updated_at, products(name, slug, product_images(url)), profiles!chat_conversations_user_id_fkey(name, email, phone)',
    )
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ChatConversationRow[]).map(asConversationSummary);
}

export async function getAdminChatMessages(
  supabase: TypedSupabaseClient,
  conversationId: string,
): Promise<ChatMessageItem[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, conversation_id, sender_id, sender_type, body, metadata, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ChatMessageItem[];
}

export async function sendAdminChatMessage(
  supabase: TypedSupabaseClient,
  adminUserId: string,
  conversationId: string,
  body: string,
): Promise<void> {
  const trimmedBody = body.trim();
  if (!trimmedBody) throw new Error('Pesan tidak boleh kosong.');
  if (trimmedBody.length > 4000) throw new Error('Pesan terlalu panjang.');

  const { error: insertMessageError } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: adminUserId,
    sender_type: 'admin',
    body: trimmedBody,
    metadata: { source: 'admin_panel' },
  });

  if (insertMessageError) throw new Error(insertMessageError.message);

  const { error: updateConversationError } = await supabase
    .from('chat_conversations')
    .update({ admin_unread_count: 0, status: 'pending' })
    .eq('id', conversationId);

  if (updateConversationError) throw new Error(updateConversationError.message);
}
