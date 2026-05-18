-- Store chat: simple customer-admin conversation system with AI-ready sender metadata.

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
  subject TEXT NOT NULL DEFAULT 'Chat toko',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'archived')),
  ai_mode TEXT NOT NULL DEFAULT 'off' CHECK (ai_mode IN ('off', 'suggest', 'auto')),
  assigned_admin_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_unread_count INTEGER NOT NULL DEFAULT 0 CHECK (admin_unread_count >= 0),
  customer_unread_count INTEGER NOT NULL DEFAULT 0 CHECK (customer_unread_count >= 0),
  last_message_at TIMESTAMPTZ NULL,
  last_customer_message_at TIMESTAMPTZ NULL,
  last_admin_message_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin', 'ai', 'system')),
  body TEXT NOT NULL CHECK (char_length(trim(body)) > 0 AND char_length(body) <= 4000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_updated
  ON public.chat_conversations(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_status_updated
  ON public.chat_conversations(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message
  ON public.chat_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_created
  ON public.chat_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_product_id
  ON public.chat_conversations(product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_order_id
  ON public.chat_conversations(order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_conversations_assigned_admin_id
  ON public.chat_conversations(assigned_admin_id)
  WHERE assigned_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id
  ON public.chat_messages(sender_id)
  WHERE sender_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_admin_profile(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.role IN ('admin', 'owner', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_chat_conversation_from_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET
    last_message_at = NEW.created_at,
    last_customer_message_at = CASE WHEN NEW.sender_type = 'customer' THEN NEW.created_at ELSE last_customer_message_at END,
    last_admin_message_at = CASE WHEN NEW.sender_type IN ('admin', 'ai') THEN NEW.created_at ELSE last_admin_message_at END,
    admin_unread_count = CASE WHEN NEW.sender_type = 'customer' THEN admin_unread_count + 1 ELSE admin_unread_count END,
    customer_unread_count = CASE WHEN NEW.sender_type IN ('admin', 'ai') THEN customer_unread_count + 1 ELSE customer_unread_count END,
    status = CASE WHEN NEW.sender_type = 'customer' AND status = 'resolved' THEN 'open' ELSE status END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_chat_conversation_from_message ON public.chat_messages;
CREATE TRIGGER trg_touch_chat_conversation_from_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_chat_conversation_from_message();

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read own chat conversations" ON public.chat_conversations;
CREATE POLICY "Customers can read own chat conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_profile(auth.uid()));

DROP POLICY IF EXISTS "Customers can create own chat conversations" ON public.chat_conversations;
CREATE POLICY "Customers can create own chat conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own unread chat conversations" ON public.chat_conversations;
CREATE POLICY "Customers can update own unread chat conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin_profile(auth.uid()))
WITH CHECK (user_id = auth.uid() OR public.is_admin_profile(auth.uid()));

DROP POLICY IF EXISTS "Chat participants can read messages" ON public.chat_messages;
CREATE POLICY "Chat participants can read messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid() OR public.is_admin_profile(auth.uid()))
  )
);

DROP POLICY IF EXISTS "Customers can send own chat messages" ON public.chat_messages;
CREATE POLICY "Customers can send own chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND sender_type = 'customer'
  AND EXISTS (
    SELECT 1
    FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND c.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can send admin chat messages" ON public.chat_messages;
CREATE POLICY "Admins can send admin chat messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_profile(auth.uid())
  AND sender_id = auth.uid()
  AND sender_type IN ('admin', 'ai', 'system')
);

GRANT SELECT, INSERT ON public.chat_conversations TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
REVOKE ALL ON FUNCTION public.is_admin_profile(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin_profile(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin_profile(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.touch_chat_conversation_from_message() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_chat_conversation_from_message() FROM anon;
REVOKE ALL ON FUNCTION public.touch_chat_conversation_from_message() FROM authenticated;

-- Enable Supabase Realtime for store chat tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

GRANT UPDATE ON public.chat_conversations TO authenticated;
