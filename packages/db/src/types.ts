export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      addresses: {
        Row: {
          city_id: number;
          created_at: string | null;
          district_id: number;
          full_address: string;
          id: string;
          is_default: boolean | null;
          label: string;
          phone: string;
          postal_code: string;
          province_id: number;
          recipient_name: string;
          user_id: string;
        };
        Insert: {
          city_id: number;
          created_at?: string | null;
          district_id: number;
          full_address: string;
          id?: string;
          is_default?: boolean | null;
          label: string;
          phone: string;
          postal_code: string;
          province_id: number;
          recipient_name: string;
          user_id: string;
        };
        Update: {
          city_id?: number;
          created_at?: string | null;
          district_id?: number;
          full_address?: string;
          id?: string;
          is_default?: boolean | null;
          label?: string;
          phone?: string;
          postal_code?: string;
          province_id?: number;
          recipient_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string | null;
          id: string;
          quantity: number;
          variant_id: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string | null;
          id?: string;
          quantity?: number;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string | null;
          id?: string;
          quantity?: number;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      coupons: {
        Row: {
          code: string;
          created_at: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          max_discount_amount: number | null;
          min_purchase_amount: number | null;
          usage_limit: number;
          used_count: number | null;
          valid_from: string;
          valid_until: string;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          max_discount_amount?: number | null;
          min_purchase_amount?: number | null;
          usage_limit?: number;
          used_count?: number | null;
          valid_from: string;
          valid_until: string;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          max_discount_amount?: number | null;
          min_purchase_amount?: number | null;
          usage_limit?: number;
          used_count?: number | null;
          valid_from?: string;
          valid_until?: string;
        };
        Relationships: [];
      };
      flash_sale_items: {
        Row: {
          flash_sale_id: string;
          id: string;
          product_id: string;
          promo_price: number;
          stock_allocated: number;
          stock_sold: number | null;
        };
        Insert: {
          flash_sale_id: string;
          id?: string;
          product_id: string;
          promo_price: number;
          stock_allocated?: number;
          stock_sold?: number | null;
        };
        Update: {
          flash_sale_id?: string;
          id?: string;
          product_id?: string;
          promo_price?: number;
          stock_allocated?: number;
          stock_sold?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey";
            columns: ["flash_sale_id"];
            isOneToOne: false;
            referencedRelation: "flash_sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flash_sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      flash_sales: {
        Row: {
          created_at: string | null;
          end_time: string;
          id: string;
          is_active: boolean | null;
          name: string;
          start_time: string;
        };
        Insert: {
          created_at?: string | null;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          start_time: string;
        };
        Update: {
          created_at?: string | null;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          start_time?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          price_at_time: number;
          product_name: string;
          quantity: number;
          variant_id: string;
          variant_label: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          price_at_time: number;
          product_name: string;
          quantity: number;
          variant_id: string;
          variant_label: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          price_at_time?: number;
          product_name?: string;
          quantity?: number;
          variant_id?: string;
          variant_label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          coupon_id: string | null;
          courier_details: Json | null;
          created_at: string | null;
          discount_amount: number | null;
          id: string;
          paid_at: string | null;
          shipped_at: string | null;
          shipping_address: Json;
          shipping_cost: number;
          status: string;
          subtotal: number;
          total_amount: number;
          tracking_number: string | null;
          updated_at: string | null;
          user_id: string;
          xendit_invoice_id: string | null;
          xendit_payment_url: string | null;
        };
        Insert: {
          coupon_id?: string | null;
          courier_details?: Json | null;
          created_at?: string | null;
          discount_amount?: number | null;
          id?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          shipping_address: Json;
          shipping_cost?: number;
          status?: string;
          subtotal: number;
          total_amount: number;
          tracking_number?: string | null;
          updated_at?: string | null;
          user_id: string;
          xendit_invoice_id?: string | null;
          xendit_payment_url?: string | null;
        };
        Update: {
          coupon_id?: string | null;
          courier_details?: Json | null;
          created_at?: string | null;
          discount_amount?: number | null;
          id?: string;
          paid_at?: string | null;
          shipped_at?: string | null;
          shipping_address?: Json;
          shipping_cost?: number;
          status?: string;
          subtotal?: number;
          total_amount?: number;
          tracking_number?: string | null;
          updated_at?: string | null;
          user_id?: string;
          xendit_invoice_id?: string | null;
          xendit_payment_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey";
            columns: ["coupon_id"];
            isOneToOne: false;
            referencedRelation: "coupons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_codes: {
        Row: {
          attempts: number | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          otp_hash: string;
          phone: string;
          used: boolean | null;
        };
        Insert: {
          attempts?: number | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          otp_hash: string;
          phone: string;
          used?: boolean | null;
        };
        Update: {
          attempts?: number | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          otp_hash?: string;
          phone?: string;
          used?: boolean | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt: string | null;
          id: string;
          product_id: string;
          sort_order: number | null;
          url: string;
        };
        Insert: {
          alt?: string | null;
          id?: string;
          product_id: string;
          sort_order?: number | null;
          url: string;
        };
        Update: {
          alt?: string | null;
          id?: string;
          product_id?: string;
          sort_order?: number | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          cover_color: string | null;
          created_at: string | null;
          id: string;
          page_count: number | null;
          paper_type: string | null;
          price_override: number | null;
          product_id: string;
          ring_count: number | null;
          ring_size: string | null;
          sku: string;
          stock: number;
        };
        Insert: {
          cover_color?: string | null;
          created_at?: string | null;
          id?: string;
          page_count?: number | null;
          paper_type?: string | null;
          price_override?: number | null;
          product_id: string;
          ring_count?: number | null;
          ring_size?: string | null;
          sku: string;
          stock?: number;
        };
        Update: {
          cover_color?: string | null;
          created_at?: string | null;
          id?: string;
          page_count?: number | null;
          paper_type?: string | null;
          price_override?: number | null;
          product_id?: string;
          ring_count?: number | null;
          ring_size?: string | null;
          sku?: string;
          stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          base_price: number;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          slug: string;
          updated_at: string | null;
          weight_grams: number;
        };
        Insert: {
          base_price: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          slug: string;
          updated_at?: string | null;
          weight_grams?: number;
        };
        Update: {
          base_price?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
          weight_grams?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string | null;
          full_name: string | null;
          id: string;
          phone: string;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          full_name?: string | null;
          id: string;
          phone: string;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      reduce_stock: {
        Args: { p_quantity: number; p_variant_id: string };
        Returns: boolean;
      };
      use_coupon: { Args: { p_coupon_id: string }; Returns: undefined };
      validate_coupon: {
        Args: { p_code: string; p_purchase_amount: number };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
