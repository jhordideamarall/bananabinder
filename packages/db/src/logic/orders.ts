import { productVariants, orders } from "../schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { validateCoupon } from "./marketing";

export interface OrderItemInput {
  variantId: string;
  quantity: number;
}

export async function calculateOrderTotal(
  db: PostgresJsDatabase<typeof schema>,
  items: OrderItemInput[],
  couponCode?: string | null
) {
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
      with: {
        product: true,
      },
    });

    if (!variant) throw new Error(`Varian ${item.variantId} tidak ditemukan`);
    if (variant.stock < item.quantity)
      throw new Error(`Stok ${variant.product.name} tidak mencukupi`);

    // Check for Flash Sale
    const now = new Date();
    const flashSaleItem = await db.query.flashSaleItems.findFirst({
      where: eq(schema.flashSaleItems.variant_id, item.variantId),
      with: {
        flashSale: true,
      },
    });

    let price = variant.price_override || variant.product.base_price;

    if (
      flashSaleItem?.flashSale &&
      flashSaleItem.flashSale.is_active &&
      flashSaleItem.flashSale.start_time <= now &&
      flashSaleItem.flashSale.end_time >= now
    ) {
      price = flashSaleItem.discount_price;
    }

    const lineTotal = price * item.quantity;

    subtotal += lineTotal;
    processedItems.push({
      variantId: variant.id,
      productId: variant.product_id,
      name: variant.product.name,
      price: price,
      quantity: item.quantity,
      subtotal: lineTotal,
    });
  }

  let discount = 0;
  let couponId: string | undefined;
  let isFreeShipping = false;

  if (couponCode) {
    const coupon = await validateCoupon(db, couponCode, subtotal);
    couponId = coupon.id;

    if (coupon.discount_type === "percentage") {
      discount = Math.round((subtotal * coupon.discount_value) / 100);
      if (
        coupon.max_discount_amount &&
        discount > coupon.max_discount_amount
      ) {
        discount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === "fixed") {
      discount = coupon.discount_value;
    } else if (coupon.discount_type === "free_shipping") {
      isFreeShipping = true;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.11); // 11% Tax
  const total = taxableAmount + tax;

  return {
    subtotal,
    discount,
    tax,
    total,
    items: processedItems,
    couponId,
    couponCode: couponCode || null,
    isFreeShipping,
  };
}

export async function handleOrderPayment(
  db: PostgresJsDatabase<typeof schema>,
  orderId: string,
  status: "PAID" | "EXPIRED" | "SETTLED"
) {
  return await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
      },
    });

    if (!order) throw new Error(`Pesanan ${orderId} tidak ditemukan`);

    if (status === "PAID" || status === "SETTLED") {
      if (order.status === "paid")
        return { success: true, message: "Sudah diproses" };

      await tx
        .update(orders)
        .set({
          status: "paid",
          paid_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 3. Increment Coupon Usage
      if (order.coupon_code) {
        await tx
          .update(schema.coupons)
          .set({ used_count: sql`${schema.coupons.used_count} + 1` })
          .where(eq(schema.coupons.code, order.coupon_code));
      }

      return { success: true, status: "paid" };
    }

    if (status === "EXPIRED") {
      if (order.status === "cancelled")
        return { success: true, message: "Sudah dibatalkan" };

      // 1. Mark as cancelled
      await tx
        .update(orders)
        .set({
          status: "cancelled",
          updated_at: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 2. RESTORE STOCK (Mandate: Atomic stock handling)
      for (const item of order.items) {
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(eq(productVariants.id, item.variant_id));
      }

      return { success: true, status: "cancelled" };
    }

    return { success: true, status: order.status };
  });
}

export async function createOrder(
  db: PostgresJsDatabase<typeof schema>,
  userId: string,
  options: {
    items: OrderItemInput[];
    couponCode?: string | null;
    addressId: string;
    courier: string;
    courierDetails?: {
      company: string;
      type: string;
      service: string;
    };
    shippingCost: number;
  }
) {
  // 1. Get Address
  const address = await db.query.addresses.findFirst({
    where: and(
      eq(schema.addresses.id, options.addressId),
      eq(schema.addresses.user_id, userId)
    ),
  });

  if (!address) throw new Error("Alamat tidak ditemukan");

  // 2. Calculate Totals
  const calculation = await calculateOrderTotal(
    db,
    options.items,
    options.couponCode
  );

  // 3. Create Order in Transaction
  return await db.transaction(async (tx) => {
    const [newOrder] = await tx
      .insert(orders)
      .values({
        user_id: userId,
        subtotal: calculation.subtotal,
        discount_amount: calculation.discount,
        tax_amount: calculation.tax,
        shipping_cost: calculation.isFreeShipping ? 0 : options.shippingCost,
        total_amount:
          calculation.total +
          (calculation.isFreeShipping ? 0 : options.shippingCost),
        status: "pending",
        coupon_id: calculation.couponId,
        coupon_code: calculation.couponCode,
        shipping_address: {
          receiver_name: address.receiver_name,
          phone: address.phone,
          full_address: address.full_address,
          postal_code: address.postal_code,
          biteship_area_id: address.biteship_area_id,
        },
        courier_details: options.courierDetails || { service: options.courier },
      })
      .returning();

    if (!newOrder) throw new Error("Gagal membuat pesanan");

    // Create Items & Reduce Stock
    for (const item of calculation.items) {
      await tx.insert(schema.orderItems).values({
        order_id: newOrder.id,
        variant_id: item.variantId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_time: item.price,
      });

      const [updated] = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            sql`${productVariants.stock} >= ${item.quantity}`
          )
        )
        .returning();

      if (!updated) {
        throw new Error(`Stok untuk varian ${item.variantId} tidak mencukupi.`);
      }
    }

    return {
      order: newOrder,
      calculation,
    };
  });
}

export async function cancelOrder(
  db: PostgresJsDatabase<typeof schema>,
  orderId: string,
  userId: string,
  reason: string
) {
  return await db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.user_id, userId)),
      with: {
        items: true,
      },
    });

    if (!order) throw new Error("Pesanan tidak ditemukan");

    // 1. Check if Cancellable
    if (
      order.status === "shipped" ||
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      throw new Error(
        `Pesanan dengan status ${order.status} tidak bisa dibatalkan.`
      );
    }

    if (order.status === "paid") {
      const now = new Date();
      const paidAt = order.paid_at || order.created_at;
      const diffHours = (now.getTime() - paidAt.getTime()) / (1000 * 60 * 60);

      if (diffHours > 24) {
        throw new Error(
          "Pembatalan hanya bisa dilakukan dalam 24 jam setelah pembayaran."
        );
      }
    }

    // 2. Update Order Status
    const isPaid = order.status === "paid";
    await tx
      .update(orders)
      .set({
        status: "cancelled",
        cancel_reason: reason,
        refund_status: isPaid ? "refund_pending" : "none",
        cancelled_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(orders.id, orderId));

    // 3. Restore Stock
    for (const item of order.items) {
      await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
        .where(eq(productVariants.id, item.variant_id));
    }

    // 4. Handle Refund Record if Paid
    if (isPaid) {
      await tx.insert(schema.refunds).values({
        order_id: order.id,
        amount: order.total_amount,
        status: "pending",
        notes: `Pembatalan oleh user: ${reason}`,
      });
    }

    return { success: true, refundTriggered: isPaid };
  });
}

export async function getUserOrders(
  db: PostgresJsDatabase<typeof schema>,
  userId: string
) {
  return await db.query.orders.findMany({
    where: eq(schema.orders.user_id, userId),
    orderBy: [desc(schema.orders.created_at)],
    with: {
      items: true,
    },
  });
}
