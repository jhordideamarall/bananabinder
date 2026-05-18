'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface ProductChatLauncherProps {
  open: boolean;
  onClose: () => void;
  product: {
    id: string | number;
    name: string;
    slug?: string | null;
    imageUrl?: string | null;
  };
  variant?: {
    id?: string | null;
    name?: string | null;
  } | null;
}

interface ChatMessageItem {
  id: string;
  conversation_id?: string;
  sender_id?: string | null;
  sender_type: 'customer' | 'admin' | 'ai' | 'system';
  body: string;
  metadata?: unknown;
  read_at?: string | null;
  created_at: string;
}

interface ProductChatThreadResponse {
  conversation: { id: string; product_id?: string | null } | null;
  messages: ChatMessageItem[];
  error?: string;
}

type ChatMessageInsertPayload = RealtimePostgresChangesPayload<ChatMessageItem>;

const formatChatTime = (value: string): string =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const mergeMessages = (
  current: ChatMessageItem[],
  incoming: ChatMessageItem[],
): ChatMessageItem[] => {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
};

export function ProductChatLauncher({ open, onClose, product, variant }: ProductChatLauncherProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const productId = String(product.id);
  const initialMessage = useMemo(() => {
    const variantLabel = variant?.name ? ` varian ${variant.name}` : '';
    return `Halo admin, saya mau tanya tentang ${product.name}${variantLabel}.`;
  }, [product.name, variant?.name]);

  const loadThread = useCallback(
    async (options?: { silent?: boolean; ignore?: () => boolean }) => {
      if (!options?.silent) setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/chat/conversations?productId=${encodeURIComponent(productId)}`,
        );
        if (response.status === 401) {
          setError('Silakan login dulu untuk chat admin.');
          return;
        }
        const payload = (await response.json()) as ProductChatThreadResponse;
        if (!response.ok) throw new Error(payload.error ?? 'Gagal memuat chat.');
        if (options?.ignore?.()) return;

        setConversationId(payload.conversation?.id ?? null);
        setMessages(payload.messages);
        if (payload.messages.length === 0) setMessage((current) => current || initialMessage);
      } catch (err) {
        if (!options?.ignore?.())
          setError(err instanceof Error ? err.message : 'Gagal memuat chat.');
      } finally {
        if (!options?.ignore?.() && !options?.silent) setLoading(false);
      }
    },
    [initialMessage, productId],
  );

  useEffect(() => {
    if (!open) return;
    let ignored = false;

    void loadThread({ ignore: () => ignored });
    return () => {
      ignored = true;
    };
  }, [loadThread, open]);

  useEffect(() => {
    if (!open || !conversationId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`product-chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: ChatMessageInsertPayload) => {
          const next = payload.new as ChatMessageItem;
          setMessages((current) => mergeMessages(current, [next]));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, open]);

  const sendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName: product.name,
          productSlug: product.slug ?? null,
          productImageUrl: product.imageUrl ?? null,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          message: trimmed,
        }),
      });

      if (response.status === 401) {
        setError('Silakan login dulu untuk chat admin.');
        return;
      }

      const payload = (await response.json()) as ProductChatThreadResponse;
      if (!response.ok) throw new Error(payload.error ?? 'Gagal mengirim chat.');
      setConversationId(payload.conversation?.id ?? null);
      setMessages((current) => mergeMessages(current, payload.messages));
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim chat.');
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  const contextText = variant?.name ? `${product.name} - ${variant.name}` : product.name;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat admin produk"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 220,
        background: 'rgba(29,29,31,0.48)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          height: 'min(88vh, 760px)',
          maxHeight: 'calc(100vh - 28px)',
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -14px 40px rgba(0,0,0,0.16)',
          padding: '16px 16px calc(18px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p className="t-micro" style={{ color: '#B7791F', fontWeight: 800 }}>
              Chat produk
            </p>
            <h2 className="t-label" style={{ fontSize: 18, lineHeight: 1.25, marginTop: 2 }}>
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup chat"
            style={{
              border: 'none',
              background: '#F5F1EA',
              borderRadius: 999,
              padding: 10,
              color: '#1D1D1F',
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            border: '1px solid #EFE5D8',
            borderRadius: 14,
            background: '#FFFDF8',
            padding: 10,
            display: 'grid',
            gridTemplateColumns: product.imageUrl ? '54px 1fr' : '1fr',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt=""
              style={{
                width: 54,
                height: 54,
                borderRadius: 12,
                objectFit: 'cover',
                border: '1px solid #EFE5D8',
                background: '#F5F1EA',
              }}
            />
          ) : null}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 800,
                color: '#8A6A19',
                letterSpacing: 0,
              }}
            >
              Terkait produk
            </p>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: 13,
                fontWeight: 750,
                color: '#1D1D1F',
                lineHeight: 1.35,
              }}
            >
              {contextText}
            </p>
          </div>
        </div>

        <div
          style={{
            minHeight: 260,
            flex: 1,
            overflowY: 'auto',
            border: '1px solid #EFE5D8',
            borderRadius: 14,
            background: '#FDFCFB',
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {loading ? <p className="t-small">Memuat chat...</p> : null}
          {!loading && messages.length === 0 ? (
            <p className="t-small" style={{ color: '#6E6258' }}>
              Kirim pertanyaan pertama. Chat ini otomatis tersambung ke produk di atas.
            </p>
          ) : null}
          {messages.map((item) => {
            const fromCustomer = item.sender_type === 'customer';
            return (
              <div
                key={item.id}
                style={{
                  alignSelf: fromCustomer ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  borderRadius: fromCustomer ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '9px 11px',
                  background: fromCustomer ? '#FFE27A' : '#FFFFFF',
                  color: '#1D1D1F',
                  border: fromCustomer ? '1px solid #F7D75C' : '1px solid #E8E2DA',
                }}
              >
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>{item.body}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: '#6F6256' }}>
                  {formatChatTime(item.created_at)}
                </p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {error ? (
          <p className="t-small" style={{ color: '#C0392B' }}>
            {error}
          </p>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 52px',
            gap: 10,
            alignItems: 'stretch',
          }}
        >
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Tulis pertanyaan soal produk ini..."
            rows={3}
            style={{
              resize: 'none',
              border: '1px solid #E9D7C8',
              borderRadius: 14,
              padding: 12,
              fontSize: 14,
              lineHeight: 1.45,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !message.trim()}
            aria-label="Kirim chat"
            style={{
              width: 52,
              minHeight: 72,
              border: 'none',
              borderRadius: 14,
              background: '#1D1D1F',
              color: '#FFE27A',
              opacity: sending || !message.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
