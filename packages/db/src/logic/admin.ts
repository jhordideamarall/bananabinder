import { eq, gt, sum, count, and, desc, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { orders, coupons } from "../schema";

export async function getAdminStats(db: PostgresJsDatabase<typeof schema>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Total Revenue
  const [totalRev] = await db
    .select({ value: sum(orders.total_amount) })
    .from(orders)
    .where(eq(orders.status, "paid"));

  // 2. Today's Revenue
  const [todayRev] = await db
    .select({ value: sum(orders.total_amount) })
    .from(orders)
    .where(and(
      eq(orders.status, "paid"),
      gt(orders.paid_at, today)
    ));

  // 3. Total Orders
  const [totalCount] = await db
    .select({ value: count(orders.id) })
    .from(orders);

  // 4. Pending Orders
  const [pendingCount] = await db
    .select({ value: count(orders.id) })
    .from(orders)
    .where(eq(orders.status, "pending"));

  return {
    totalRevenue: Number(totalRev?.value || 0),
    todayRevenue: Number(todayRev?.value || 0),
    totalOrders: Number(totalCount?.value || 0),
    pendingOrders: Number(pendingCount?.value || 0),
  };
}

export async function getAdminRevenueChart(
  db: PostgresJsDatabase<typeof schema>,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await db
    .select({
      date: sql<string>`DATE(${orders.paid_at})`,
      revenue: sum(orders.total_amount),
      orders: count(orders.id),
    })
    .from(orders)
    .where(and(eq(orders.status, "paid"), gt(orders.paid_at, startDate)))
    .groupBy(sql`DATE(${orders.paid_at})`)
    .orderBy(sql`DATE(${orders.paid_at})`);
}

export async function getAdminOrders(
  db: PostgresJsDatabase<typeof schema>,
  options: {
    status?: string | null;
    page: number;
    limit: number;
  }
) {
  const offset = (options.page - 1) * options.limit;
  
  const whereClause = options.status 
    ? eq(orders.status, options.status)
    : undefined;

  const data = await db.query.orders.findMany({
    where: whereClause,
    orderBy: [desc(orders.created_at)],
    limit: options.limit,
    offset: offset,
    with: {
      user: true,
      items: {
        with: {
          variant: true
        }
      }
    },
  });

  const [total] = await db
    .select({ value: count(orders.id) })
    .from(orders)
    .where(whereClause);

  return {
    data,
    total: Number(total?.value || 0),
  };
}

// COUPONS CRUD
export async function getAdminCoupons(db: PostgresJsDatabase<typeof schema>) {
  return await db.query.coupons.findMany({
    orderBy: [desc(coupons.created_at)],
  });
}

export async function createAdminCoupon(
  db: PostgresJsDatabase<typeof schema>, 
  data: typeof schema.coupons.$inferInsert
) {
  const [newCoupon] = await db.insert(coupons).values(data).returning();
  return newCoupon;
}

export async function updateAdminCoupon(
  db: PostgresJsDatabase<typeof schema>, 
  id: string, 
  data: Partial<typeof schema.coupons.$inferInsert>
) {
  const [updated] = await db.update(coupons).set(data).where(eq(coupons.id, id)).returning();
  return updated;
}

export async function deleteAdminCoupon(db: PostgresJsDatabase<typeof schema>, id: string) {
  await db.delete(coupons).where(eq(coupons.id, id));
  return { success: true };
}

// ORDERS MANAGEMENT
export async function updateAdminOrderStatus(
  db: PostgresJsDatabase<typeof schema>,
  orderId: string,
  data: {
    status?: string;
    tracking_number?: string;
    cancel_reason?: string;
  }
) {
  const updates: Partial<typeof schema.orders.$inferInsert> = {
    ...data,
    updated_at: new Date(),
  };

  if (data.status === "shipped") {
    updates.shipped_at = new Date();
  }

  if (data.status === "cancelled") {
    updates.cancelled_at = new Date();
  }

  const [updated] = await db.update(orders)
    .set(updates)
    .where(eq(orders.id, orderId))
    .returning();
  
  return updated;
}

// CRM
export async function getAdminCustomers(
  db: PostgresJsDatabase<typeof schema>,
  options: {
    page: number;
    limit: number;
  }
) {
  const offset = (options.page - 1) * options.limit;

  const data = await db.query.profiles.findMany({
    limit: options.limit,
    offset: offset,
    orderBy: [desc(schema.profiles.created_at)],
    with: {
      orders: true,
    }
  });

  const [total] = await db
    .select({ value: count(schema.profiles.id) })
    .from(schema.profiles);

  return {
    data: data.map(profile => {
      const paidOrders = profile.orders.filter(o => o.status === "paid");
      const totalSpent = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
      return {
        ...profile,
        totalOrders: profile.orders.length,
        totalSpent,
      };
    }),
    total: Number(total?.value || 0),
  };
}

export async function getAdminCustomerDetail(
  db: PostgresJsDatabase<typeof schema>,
  customerId: string
) {
  return await db.query.profiles.findFirst({
    where: eq(schema.profiles.id, customerId),
    with: {
      orders: {
        orderBy: [desc(orders.created_at)],
      },
      addresses: true,
    },
  });
}

export async function requestBiteshipPickup(
  db: PostgresJsDatabase<typeof schema>,
  orderId: string,
  _adminId: string
) {
  return await db.transaction(async (tx) => {
    // 1. Get Order Detail
    const order = await tx.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      with: {
        items: true,
        user: true,
      }
    });

    if (!order) throw new Error("Pesanan tidak ditemukan");
    if (order.status !== "paid" && order.status !== "processing") {
      throw new Error("Pesanan belum siap dikirim");
    }

    // 2. Get User Address
    const addr = order.shipping_address as { 
      receiver_name: string; 
      phone: string; 
      full_address: string; 
      biteship_area_id?: string;
    };
    if (!addr.biteship_area_id) throw new Error("ID Area Biteship tidak ditemukan di alamat pesanan");

    // 3. Trigger Biteship Order
    const { createBiteshipOrder } = await import("../services/biteship");
    const biteshipOrder = await createBiteshipOrder({
      shipper_contact_name: "Bananasbindery Admin",
      shipper_contact_phone: "08123456789",
      shipper_contact_email: "admin@bananasbindery.com",
      origin_contact_name: "Bananasbindery Warehouse",
      origin_contact_phone: "08123456789",
      origin_address: "Jl. Binder No. 1, Jakarta",
      origin_area_id: process.env.BITESHIP_ORIGIN_AREA_ID || "IDNP0101",
      destination_contact_name: addr.receiver_name,
      destination_contact_phone: addr.phone,
      destination_address: addr.full_address,
      destination_area_id: addr.biteship_area_id,
      courier_company: (order.courier_details as { company: string }).company,
      courier_type: (order.courier_details as { type: string }).type,
      delivery_type: "now",
      items: order.items.map(item => ({
        name: item.product_name,
        value: item.price_at_time,
        weight: 500, 
        length: 10,
        width: 10,
        height: 10,
        quantity: item.quantity,
      })),
    });

    // 4. Update Order with Biteship Data
    await tx.update(schema.orders)
      .set({
        status: "shipped",
        tracking_number: biteshipOrder.courier.waybill_id,
        biteship_order_id: biteshipOrder.id,
        biteship_tracking_url: biteshipOrder.courier.tracking_url,
        shipped_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(schema.orders.id, orderId));

    return biteshipOrder;
  });
}
