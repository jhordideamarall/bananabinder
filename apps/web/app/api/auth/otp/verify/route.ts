import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOTP } from "@bananasbindery/db";
import { supabaseAdmin, createClient } from "@/lib/supabase";

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

    // Issue a session cookie using the new SSR client and the hidden password
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      phone: phone,
      password: result.hidden_password,
    });

    if (sessionError) {
      throw new Error(`Gagal membuat sesi login: ${sessionError.message}`);
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      session: sessionData.session,
    });
  } catch (error: unknown) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Gagal verifikasi OTP" },
      { status: 500 }
    );
  }
}
