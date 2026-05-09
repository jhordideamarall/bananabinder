import { NextResponse } from "next/server";
import { searchBiteshipAreas } from "@bananasbindery/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 3) {
      return NextResponse.json({ areas: [] });
    }

    const areas = await searchBiteshipAreas(q);
    return NextResponse.json({ areas });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
