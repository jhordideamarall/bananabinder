import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@bananasbindery/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.is_active, true)),
      with: {
        productImages: true,
        productVariants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error: unknown) {
    console.error("Fetch Product Detail Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product detail" },
      { status: 500 }
    );
  }
}
