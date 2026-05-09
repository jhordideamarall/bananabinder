import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(), // Linked to auth.users
  full_name: text("full_name"),
  phone: text("phone").unique(),
  role: text("role").default("customer"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  label: text("label"), // Rumah, Kantor, dll
  receiver_name: text("receiver_name").notNull(),
  phone: text("phone").notNull(),
  province_id: text("province_id"),
  city_id: text("city_id"),
  subdistrict_id: text("subdistrict_id"),
  province_name: text("province_name"),
  city_name: text("city_name"),
  subdistrict_name: text("subdistrict_name"),
  full_address: text("full_address").notNull(),
  postal_code: text("postal_code"),
  biteship_area_id: text("biteship_area_id"),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  base_price: integer("base_price").notNull(),
  weight_grams: integer("weight_grams").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  ring_size: text("ring_size"), // A5 (20 ring), B5 (26 ring)
  ring_count: integer("ring_count"),
  cover_color: text("cover_color"),
  paper_type: text("paper_type"),
  page_count: integer("page_count"),
  stock: integer("stock").default(0).notNull(),
  price_override: integer("price_override"),
  sku: text("sku").unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const productImages = pgTable("product_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  url: text("url").notNull(),
  alt: text("alt"),
  sort_order: integer("sort_order").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").unique().notNull(),
  discount_type: text("discount_type").notNull(), // percentage, fixed
  discount_value: integer("discount_value").notNull(),
  min_purchase_amount: integer("min_purchase_amount").default(0),
  max_discount_amount: integer("max_discount_amount"),
  usage_limit: integer("usage_limit"),
  used_count: integer("used_count").default(0),
  valid_from: timestamp("valid_from").notNull(),
  valid_until: timestamp("valid_until").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const flashSales = pgTable("flash_sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const flashSaleItems = pgTable("flash_sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  flash_sale_id: uuid("flash_sale_id")
    .references(() => flashSales.id)
    .notNull(),
  variant_id: uuid("variant_id")
    .references(() => productVariants.id)
    .notNull(),
  discount_price: integer("discount_price").notNull(),
  stock_limit: integer("stock_limit").notNull(),
  sold_count: integer("sold_count").default(0),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  status: text("status").default("pending").notNull(), // pending, processing, shipped, completed, cancelled
  subtotal: integer("subtotal").notNull(),
  shipping_cost: integer("shipping_cost").notNull(),
  discount_amount: integer("discount_amount").default(0),
  tax_amount: integer("tax_amount").default(0),
  total_amount: integer("total_amount").notNull(),
  coupon_id: uuid("coupon_id").references(() => coupons.id),
  coupon_code: text("coupon_code"),
  shipping_address: jsonb("shipping_address").notNull(),
  courier_details: jsonb("courier_details"),
  tracking_number: text("tracking_number"),
  xendit_invoice_id: text("xendit_invoice_id"),
  xendit_payment_url: text("xendit_payment_url"),
  biteship_order_id: text("biteship_order_id"),
  biteship_tracking_url: text("biteship_tracking_url"),
  refund_status: text("refund_status").default("none").notNull(), // none, refund_pending, refunded
  cancel_reason: text("cancel_reason"),
  paid_at: timestamp("paid_at"),
  shipped_at: timestamp("shipped_at"),
  cancelled_at: timestamp("cancelled_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const refunds = pgTable("refunds", {
  id: uuid("id").defaultRandom().primaryKey(),
  order_id: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  amount: integer("amount").notNull(),
  xendit_refund_id: text("xendit_refund_id"),
  status: text("status").default("pending").notNull(), // pending, completed, failed
  notes: text("notes"),
  processed_by: uuid("processed_by").references(() => profiles.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  processed_at: timestamp("processed_at"),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  order_id: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  variant_id: uuid("variant_id")
    .references(() => productVariants.id)
    .notNull(),
  product_name: text("product_name").notNull(),
  variant_label: text("variant_label"),
  quantity: integer("quantity").notNull(),
  price_at_time: integer("price_at_time").notNull(),
});

export const carts = pgTable("carts", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => profiles.id)
    .notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cart_id: uuid("cart_id")
      .references(() => carts.id)
      .notNull(),
    variant_id: uuid("variant_id")
      .references(() => productVariants.id)
      .notNull(),
    quantity: integer("quantity").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    unq: uniqueIndex("cart_variant_unique").on(t.cart_id, t.variant_id),
  })
);

export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").notNull(),
  otp_hash: text("otp_hash").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  attempts: integer("attempts").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// RELATIONS
import { relations } from "drizzle-orm";

export const productRelations = relations(products, ({ many }) => ({
  productVariants: many(productVariants),
  productImages: many(productImages),
}));

export const productVariantRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.product_id],
      references: [products.id],
    }),
    orderItems: many(orderItems),
  })
);

export const productImageRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.product_id],
    references: [products.id],
  }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  user: one(profiles, {
    fields: [orders.user_id],
    references: [profiles.id],
  }),
  items: many(orderItems),
  coupon: one(coupons, {
    fields: [orders.coupon_id],
    references: [coupons.id],
  }),
}));

export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variant_id],
    references: [productVariants.id],
  }),
}));

export const profileRelations = relations(profiles, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  carts: many(carts),
}));

export const cartRelations = relations(carts, ({ one, many }) => ({
  user: one(profiles, {
    fields: [carts.user_id],
    references: [profiles.id],
  }),
  items: many(cartItems),
}));

export const cartItemRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cart_id],
    references: [carts.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variant_id],
    references: [productVariants.id],
  }),
}));

export const flashSaleRelations = relations(flashSales, ({ many }) => ({
  items: many(flashSaleItems),
}));

export const flashSaleItemRelations = relations(flashSaleItems, ({ one }) => ({
  flashSale: one(flashSales, {
    fields: [flashSaleItems.flash_sale_id],
    references: [flashSales.id],
  }),
  variant: one(productVariants, {
    fields: [flashSaleItems.variant_id],
    references: [productVariants.id],
  }),
}));
