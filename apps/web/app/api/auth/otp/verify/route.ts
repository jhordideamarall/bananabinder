import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOTP } from "@bananasbindery/db";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Nomor WhatsApp dan OTP wajib diisi" },
        { status: 400 }
      );
    }

    const result = await verifyOTP(db, supabaseAdmin, phone, otp);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal verifikasi OTP" },
      { status: 500 }
    );
  }
}
