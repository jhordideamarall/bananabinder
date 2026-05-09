import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requestOTP } from "@bananasbindery/db";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const result = await requestOTP(db, phone);

    return NextResponse.json({
      message: "OTP berhasil dikirim",
      ...result,
    });
  } catch (error: unknown) {
    console.error("OTP Request Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal meminta OTP" },
      { status: 500 }
    );
  }
}
