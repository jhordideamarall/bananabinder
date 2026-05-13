export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string | null;
          created_at: string | null;
          district: string | null;
          full_address: string;
          id: string;
          is_default: boolean | null;
          label: string | null;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          postal_code: string | null;
          recipient_name: string | null;
          user_id: string;
        };
        Insert: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          full_address: string;
          id?: string;
          is_default?: boolean | null;
          label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          recipient_name?: string | null;
          user_id: string;
        };
        Update: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          full_address?: string;
          id?: string;
          is_default?: boolean | null;
          label?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          recipient_name?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string | null;
          entity_id: string;
          entity_name: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          entity_id: string;
          entity_name: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          entity_id?: string;
          entity_name?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      banners: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          image_url: string;
          is_active: boolean | null;
          link: string | null;
          priority: number | null;
          start_date: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          image_url: string;
          is_active?: boolean | null;
          link?: string | null;
          priority?: number | null;
          start_date?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          link?: string | null;
          priority?: number | null;
          start_date?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      booking_slots: {
        Row: {
          booked: number | null;
          capacity: number;
          date: string;
          id: string;
          time_slot: string | null;
          type: Database['public']['Enums']['service_type'];
        };
        Insert: {
          booked?: number | null;
          capacity: number;
          date: string;
          id?: string;
          time_slot?: string | null;
          type: Database['public']['Enums']['service_type'];
        };
        Update: {
          booked?: number | null;
          capacity?: number;
          date?: string;
          id?: string;
          time_slot?: string | null;
          type?: Database['public']['Enums']['service_type'];
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          booking_number: string;
          cancellation_reason: string | null;
          created_at: string | null;
          date_end: string | null;
          date_start: string;
          dp_amount: number | null;
          id: string;
          notes: string | null;
          payment_status: Database['public']['Enums']['payment_status'];
          pet_id: string;
          service_id: string;
          slot_id: string | null;
          status: string | null;
          time_slot: string | null;
          total_amount: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          booking_number: string;
          cancellation_reason?: string | null;
          created_at?: string | null;
          date_end?: string | null;
          date_start: string;
          dp_amount?: number | null;
          id?: string;
          notes?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          pet_id: string;
          service_id: string;
          slot_id?: string | null;
          status?: string | null;
          time_slot?: string | null;
          total_amount: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          booking_number?: string;
          cancellation_reason?: string | null;
          created_at?: string | null;
          date_end?: string | null;
          date_start?: string;
          dp_amount?: number | null;
          id?: string;
          notes?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          pet_id?: string;
          service_id?: string;
          slot_id?: string | null;
          status?: string | null;
          time_slot?: string | null;
          total_amount?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_pet_id_fkey';
            columns: ['pet_id'];
            isOneToOne: false;
            referencedRelation: 'pets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_slot_id_fkey';
            columns: ['slot_id'];
            isOneToOne: false;
            referencedRelation: 'booking_slots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'bookings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cart_items: {
        Row: {
          cart_id: string | null;
          created_at: string | null;
          id: string;
          product_id: string | null;
          quantity: number;
          variant_id: string | null;
        };
        Insert: {
          cart_id?: string | null;
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Update: {
          cart_id?: string | null;
          created_at?: string | null;
          id?: string;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey';
            columns: ['cart_id'];
            isOneToOne: false;
            referencedRelation: 'carts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string | null;
          id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'carts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      districts: {
        Row: {
          city: string;
          id: string;
          name: string;
          province: string;
        };
        Insert: {
          city: string;
          id?: string;
          name: string;
          province: string;
        };
        Update: {
          city?: string;
          id?: string;
          name?: string;
          province?: string;
        };
        Relationships: [];
      };
      loyalty: {
        Row: {
          id: string;
          lifetime_points: number | null;
          total_points: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          id?: string;
          lifetime_points?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          id?: string;
          lifetime_points?: number | null;
          total_points?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_history: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          order_id: string | null;
          points_change: number;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          points_change: number;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          points_change?: number;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_history_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          channel: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          reference_id: string | null;
          reference_type: string | null;
          title: string;
          type: string | null;
          user_id: string | null;
        };
        Insert: {
          body?: string | null;
          channel?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          reference_id?: string | null;
          reference_type?: string | null;
          title: string;
          type?: string | null;
          user_id?: string | null;
        };
        Update: {
          body?: string | null;
          channel?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          reference_id?: string | null;
          reference_type?: string | null;
          title?: string;
          type?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          cost_price: number;
          discount: number | null;
          id: string;
          order_id: string | null;
          price: number;
          product_id: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          variant_id: string | null;
          variant_name: string | null;
        };
        Insert: {
          cost_price: number;
          discount?: number | null;
          id?: string;
          order_id?: string | null;
          price: number;
          product_id?: string | null;
          product_name: string;
          quantity: number;
          subtotal: number;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Update: {
          cost_price?: number;
          created_at?: string | null;
          id?: string;
          order_id?: string | null;
          price?: number;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          subtotal?: number;
          variant_id?: string | null;
          variant_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      order_returns: {
        Row: {
          admin_notes: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          order_id: string | null;
          photo_urls: string[] | null;
          reason: string;
          refund_amount: number | null;
          refund_method: string | null;
          resolved_at: string | null;
          status: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          photo_urls?: string[] | null;
          reason: string;
          refund_amount?: number | null;
          refund_method?: string | null;
          resolved_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          photo_urls?: string[] | null;
          reason?: string;
          refund_amount?: number | null;
          refund_method?: string | null;
          resolved_at?: string | null;
          status?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_returns_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_returns_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          address_id: string | null;
          created_at: string | null;
          delivered_at: string | null;
          discount: number | null;
          expired_at: string | null;
          hpp_total: number | null;
          id: string;
          notes: string | null;
          order_number: string;
          paid_at: string | null;
          payment_id: string | null;
          payment_method: string | null;
          payment_status: Database['public']['Enums']['payment_status'];
          profit: number | null;
          shipped_at: string | null;
          shipping_cost: number | null;
          shipping_courier: string | null;
          shipping_method: string | null;
          shipping_tracking: string | null;
          status: Database['public']['Enums']['order_status'];
          subtotal: number;
          tax: number | null;
          total: number;
          updated_at: string | null;
          user_id: string;
          voucher_id: string | null;
        };
        Insert: {
          address_id?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          discount?: number | null;
          expired_at?: string | null;
          hpp_total?: number | null;
          id?: string;
          notes?: string | null;
          order_number: string;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          profit?: number | null;
          shipped_at?: string | null;
          shipping_cost?: number | null;
          shipping_courier?: string | null;
          shipping_method?: string | null;
          shipping_tracking?: string | null;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          tax?: number | null;
          total?: number;
          updated_at?: string | null;
          user_id: string;
          voucher_id?: string | null;
        };
        Update: {
          address_id?: string | null;
          created_at?: string | null;
          delivered_at?: string | null;
          discount?: number | null;
          expired_at?: string | null;
          hpp_total?: number | null;
          id?: string;
          notes?: string | null;
          order_number?: string;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_status?: Database['public']['Enums']['payment_status'];
          profit?: number | null;
          shipped_at?: string | null;
          shipping_cost?: number | null;
          shipping_courier?: string | null;
          shipping_method?: string | null;
          shipping_tracking?: string | null;
          status?: Database['public']['Enums']['order_status'];
          subtotal?: number;
          tax?: number | null;
          total?: number;
          updated_at?: string | null;
          user_id?: string;
          voucher_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_voucher_id_fkey';
            columns: ['voucher_id'];
            isOneToOne: false;
            referencedRelation: 'vouchers';
            referencedColumns: ['id'];
          },
        ];
      };
      pets: {
        Row: {
          avatar_url: string | null;
          birth_date: string | null;
          breed: string | null;
          created_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          type: Database['public']['Enums']['pet_type'];
          updated_at: string | null;
          weight_kg: number | null;
        };
        Insert: {
          avatar_url?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          type: Database['public']['Enums']['pet_type'];
          updated_at?: string | null;
          weight_kg?: number | null;
        };
        Update: {
          avatar_url?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          type?: Database['public']['Enums']['pet_type'];
          updated_at?: string | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pets_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string | null;
          id: string;
          product_id: string;
          sort_order: number | null;
          url: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string | null;
          id?: string;
          product_id: string;
          sort_order?: number | null;
          url: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string | null;
          id?: string;
          product_id?: string;
          sort_order?: number | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_variants: {
        Row: {
          cost_price: number;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          price: number;
          product_id: string;
          promo_price: number | null;
          sku: string | null;
          sort_order: number | null;
          stock: number | null;
          updated_at: string | null;
          weight_grams: number | null;
        };
        Insert: {
          cost_price: number;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          price: number;
          product_id: string;
          promo_price?: number | null;
          sku?: string | null;
          sort_order?: number | null;
          stock?: number | null;
          updated_at?: string | null;
          weight_grams?: number | null;
        };
        Update: {
          cost_price?: number;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          price?: number;
          product_id?: string;
          promo_price?: number | null;
          sku?: string | null;
          sort_order?: number | null;
          stock?: number | null;
          updated_at?: string | null;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          avg_rating: number | null;
          category_id: string | null;
          cost_price: number;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          price: number;
          promo_price: number | null;
          review_count: number | null;
          search_vector: unknown;
          slug: string;
          sold_count: number | null;
          stock: number | null;
          type: Database['public']['Enums']['product_type'] | null;
          updated_at: string | null;
          weight_grams: number | null;
        };
        Insert: {
          avg_rating?: number | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          price?: number;
          promo_price?: number | null;
          review_count?: number | null;
          search_vector?: unknown;
          slug: string;
          sold_count?: number | null;
          stock?: number | null;
          type?: Database['public']['Enums']['product_type'] | null;
          updated_at?: string | null;
          weight_grams?: number | null;
        };
        Update: {
          avg_rating?: number | null;
          category_id?: string | null;
          cost_price?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          price?: number;
          promo_price?: number | null;
          review_count?: number | null;
          search_vector?: unknown;
          slug?: string;
          sold_count?: number | null;
          stock?: number | null;
          type?: Database['public']['Enums']['product_type'] | null;
          updated_at?: string | null;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          phone: string | null;
          role: Database['public']['Enums']['user_role'];
          tier: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          id: string;
          is_active?: boolean | null;
          name?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tier?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['user_role'];
          tier?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          admin_reply: string | null;
          comment: string | null;
          created_at: string | null;
          id: string;
          is_visible: boolean | null;
          order_id: string | null;
          photo_urls: string[] | null;
          product_id: string | null;
          rating: number;
          service_id: string | null;
          user_id: string;
        };
        Insert: {
          admin_reply?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          is_visible?: boolean | null;
          order_id?: string | null;
          photo_urls?: string[] | null;
          product_id?: string | null;
          rating: number;
          service_id?: string | null;
          user_id: string;
        };
        Update: {
          admin_reply?: string | null;
          comment?: string | null;
          created_at?: string | null;
          id?: string;
          is_visible?: boolean | null;
          order_id?: string | null;
          photo_urls?: string[] | null;
          product_id?: string | null;
          rating?: number;
          service_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          avg_rating: number | null;
          created_at: string | null;
          description: string | null;
          dp_percentage: number | null;
          duration_minutes: number | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          price: number;
          requires_dp: boolean | null;
          review_count: number | null;
          slug: string;
          sort_order: number | null;
          type: Database['public']['Enums']['service_type'];
        };
        Insert: {
          avg_rating?: number | null;
          created_at?: string | null;
          description?: string | null;
          dp_percentage?: number | null;
          duration_minutes?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          price: number;
          requires_dp?: boolean | null;
          review_count?: number | null;
          slug: string;
          sort_order?: number | null;
          type: Database['public']['Enums']['service_type'];
        };
        Update: {
          avg_rating?: number | null;
          created_at?: string | null;
          description?: string | null;
          dp_percentage?: number | null;
          duration_minutes?: number | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          price?: number;
          requires_dp?: boolean | null;
          review_count?: number | null;
          slug?: string;
          sort_order?: number | null;
          type?: Database['public']['Enums']['service_type'];
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          notes: string | null;
          product_id: string | null;
          quantity: number;
          reference_id: string | null;
          reference_type: string | null;
          type: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          quantity: number;
          reference_id?: string | null;
          reference_type?: string | null;
          type: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          product_id?: string | null;
          quantity?: number;
          reference_id?: string | null;
          reference_type?: string | null;
          type?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_movements_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_variant_id_fkey';
            columns: ['variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          },
        ];
      };
      store_locations: {
        Row: {
          city: string | null;
          created_at: string | null;
          district: string | null;
          full_address: string;
          id: string;
          is_active: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          operating_hours: Json | null;
          phone: string | null;
          services_available: string[] | null;
          whatsapp: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          full_address: string;
          id?: string;
          is_active?: boolean | null;
          latitude: number;
          longitude: number;
          name: string;
          operating_hours?: Json | null;
          phone?: string | null;
          services_available?: string[] | null;
          whatsapp?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string | null;
          district?: string | null;
          full_address?: string;
          id?: string;
          is_active?: boolean | null;
          latitude?: number;
          longitude?: number;
          name?: string;
          operating_hours?: Json | null;
          phone?: string | null;
          services_available?: string[] | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          booking_id: string | null;
          created_at: string | null;
          external_id: string | null;
          id: string;
          order_id: string | null;
          payment_method: string | null;
          raw_response: Json | null;
          status: string;
        };
        Insert: {
          amount: number;
          booking_id?: string | null;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          order_id?: string | null;
          payment_method?: string | null;
          raw_response?: Json | null;
          status: string;
        };
        Update: {
          amount?: number;
          booking_id?: string | null;
          created_at?: string | null;
          external_id?: string | null;
          id?: string;
          order_id?: string | null;
          payment_method?: string | null;
          raw_response?: Json | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_booking_id_fkey';
            columns: ['booking_id'];
            isOneToOne: false;
            referencedRelation: 'bookings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      voucher_usages: {
        Row: {
          id: string;
          order_id: string | null;
          used_at: string | null;
          user_id: string;
          voucher_id: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          used_at?: string | null;
          user_id: string;
          voucher_id: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          used_at?: string | null;
          user_id?: string;
          voucher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'voucher_usages_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'voucher_usages_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'voucher_usages_voucher_id_fkey';
            columns: ['voucher_id'];
            isOneToOne: false;
            referencedRelation: 'vouchers';
            referencedColumns: ['id'];
          },
        ];
      };
      vouchers: {
        Row: {
          code: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          max_discount: number | null;
          min_order: number | null;
          type: Database['public']['Enums']['voucher_type'];
          usage_limit: number | null;
          used_count: number | null;
          valid_from: string;
          valid_until: string;
          value: number;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_discount?: number | null;
          min_order?: number | null;
          type: Database['public']['Enums']['voucher_type'];
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from: string;
          valid_until: string;
          value: number;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_discount?: number | null;
          min_order?: number | null;
          type?: Database['public']['Enums']['voucher_type'];
          usage_limit?: number | null;
          used_count?: number | null;
          valid_from?: string;
          valid_until?: string;
          value?: number;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string | null;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'wishlists_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wishlists_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      is_admin_or_owner: { Args: never; Returns: boolean };
      is_owner: { Args: never; Returns: boolean };
      is_staff_or_above: { Args: never; Returns: boolean };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
    };
    Enums: {
      order_status:
        | 'pending'
        | 'paid'
        | 'processing'
        | 'shipped'
        | 'delivered'
        | 'completed'
        | 'cancelled'
        | 'expired'
        | 'return_requested'
        | 'returned'
        | 'refunded';
      payment_status: 'unpaid' | 'paid' | 'refunded' | 'partial_refund' | 'dp_paid';
      pet_type: 'dog' | 'cat' | 'bird' | 'hamster' | 'rabbit' | 'fish' | 'other';
      product_type: 'normal' | 'frozen' | 'parcel';
      service_type: 'grooming' | 'hotel';
      user_role: 'admin' | 'customer' | 'staff' | 'owner';
      voucher_type: 'percentage' | 'fixed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      order_status: [
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
      ],
      payment_status: ['unpaid', 'paid', 'refunded', 'partial_refund', 'dp_paid'],
      pet_type: ['dog', 'cat', 'bird', 'hamster', 'rabbit', 'fish', 'other'],
      product_type: ['normal', 'frozen', 'parcel'],
      service_type: ['grooming', 'hotel'],
      user_role: ['admin', 'customer', 'staff', 'owner'],
      voucher_type: ['percentage', 'fixed'],
    },
  },
} as const;
