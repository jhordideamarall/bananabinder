import { NextResponse } from "next/server";
import { reverseGeocodeBiteship } from "@bananasbindery/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude dan Longitude diperlukan" },
        { status: 400 }
      );
    }

    const area = await reverseGeocodeBiteship(lat, lng);
    return NextResponse.json({ area });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
