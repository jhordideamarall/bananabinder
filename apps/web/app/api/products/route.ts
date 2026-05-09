import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@bananasbindery/db";
import { eq, ilike, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const data = await db.query.products.findMany({
      where: and(
        eq(products.is_active, true),
        search ? ilike(products.name, `%${search}%`) : undefined,
        category ? ilike(products.slug, `${category}%`) : undefined
      ),
      with: {
        productImages: {
          columns: { url: true, alt: true, sort_order: true },
        },
        productVariants: {
          columns: { stock: true, price_override: true },
        },
      },
      orderBy: [desc(products.created_at)],
    });

    return NextResponse.json({ data });
  } catch (error: unknown) {
    console.error("Fetch Products Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
