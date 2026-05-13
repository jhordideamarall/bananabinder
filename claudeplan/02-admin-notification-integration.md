# Plan: Admin & Notification System Integration

This plan outlines the technical implementation for integrating the Notification System with the future Admin Dashboard and existing Web Platform.

## 1. Database Schema (Supabase)

We will use a centralized `notifications` table to handle all in-app alerts.

```sql
-- notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'order', 'booking', 'promo', 'broadcast'
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store order_id, booking_id, etc.
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
-- Only Admin/Service Role can insert (Admin Dashboard or Triggers)
CREATE POLICY "Admin can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Restricted via Service Role or Admin UID
```

## 2. Notification Triggers (Automation)

Notifications should be triggered automatically by business events:

- **Order Status Update**: `PENDING` -> `SHIPPED` triggers a "Pesanan Dikirim" notification.
- **Booking Confirmation**: `PENDING` -> `CONFIRMED` triggers a "Booking Berhasil" notification.
- **Loyalty Point Earned**: Triggered when an order is completed.

**Mechanism**:
- **Postgres Triggers**: For simple in-app inserts.
- **Supabase Edge Functions**: For complex logic and external API calls (WhatsApp/Fonnte).

## 3. Admin Dashboard Integration

The Admin Panel (`apps/admin`) will have a "Notification Center" module:

### A. Manual Broadcast (Promo/Info)
- **UI**: A form to input Title, Body, and Target (All Users / Specific User).
- **Action**: Loops through selected users or inserts a single row with a `type='broadcast'`.
- **Optimization**: For "All Users", use a special `user_id = NULL` logic to avoid massive table row inserts, then fetch them via a join.

### B. Trigger Management
- UI to preview and edit the templates for automated notifications.
- Enable/Disable specific notification channels (e.g., Turn off WhatsApp, keep In-App).

## 4. Real-time Delivery (Web/Mobile)

- **Supabase Realtime**: The `NotificationSheet` and Header will subscribe to the `notifications` table.
- **Payload**: On every `INSERT`, the client receives the payload and updates the UI state immediately.
- **Bouncy Alert**: When a new notification arrives while the user is active, we can trigger a micro-animation on the Bell icon.

## 5. Implementation Steps

1. [ ] **Backend**: Create the `notifications` table and RLS policies.
2. [ ] **Edge Functions**: Implement `send-notification` function to handle both DB insert and WhatsApp (Fonnte).
3. [ ] **Web Integration**:
    - Replace DUMMY_NOTIFS with real data fetching from Supabase.
    - Implement `markAsRead` action when a notification is clicked.
    - Subscribe to Realtime changes for live updates.
4. [ ] **Admin Integration**:
    - Create the "Send Broadcast" form in the Admin panel.
    - Add notification triggers to Order/Booking management flows.

---
**Status**: Planning
**Target Phase**: Phase 7 (as per Masterplan)
