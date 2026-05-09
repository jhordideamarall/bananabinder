import { eq, and, gt, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";
import { otpCodes, profiles } from "../schema";
import { generateOTP, hashOTP, verifyOTPHash } from "../otp";
import { sendWhatsAppMessage } from "../services/fonnte";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function requestOTP(
  db: PostgresJsDatabase<typeof schema>,
  phone: string
) {
  const recent = await db.query.otpCodes.findMany({
    where: and(
      eq(otpCodes.phone, phone),
      gt(otpCodes.created_at, new Date(Date.now() - 15 * 60 * 1000))
    ),
  });

  if (recent.length >= 3) {
    throw new Error(
      "Terlalu banyak permintaan OTP. Silakan coba lagi dalam 15 menit."
    );
  }

  const otp = generateOTP();
  const otpHash = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.insert(otpCodes).values({
    phone,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });

  const message = `Kode OTP Bananasbindery kamu adalah: ${otp}. Jangan bagikan kode ini kepada siapapun.`;

  try {
    await sendWhatsAppMessage(phone, message);
  } catch (error) {
    console.error("Fonnte Send Error:", error);
    if (process.env.NODE_ENV !== "development") throw error;
  }

  return {
    success: true,
    debug_otp: process.env.NODE_ENV === "development" ? otp : undefined,
  };
}

export async function verifyOTP(
  db: PostgresJsDatabase<typeof schema>,
  supabaseAdmin: SupabaseClient,
  phone: string,
  otp: string
) {
  const record = await db.query.otpCodes.findFirst({
    where: and(
      eq(otpCodes.phone, phone),
      eq(otpCodes.used, false),
      gt(otpCodes.expires_at, new Date())
    ),
    orderBy: [desc(otpCodes.created_at)],
  });

  if (!record) throw new Error("OTP tidak valid atau sudah kadaluarsa");

  const isValid = await verifyOTPHash(otp, record.otp_hash);

  if (!isValid) {
    await db
      .update(otpCodes)
      .set({ attempts: (record.attempts || 0) + 1 })
      .where(eq(otpCodes.id, record.id));
    throw new Error("Kode OTP salah");
  }

  await db
    .update(otpCodes)
    .set({ used: true })
    .where(eq(otpCodes.id, record.id));

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      phone: phone,
      phone_confirm: true,
    });

  let user = authData.user;

  if (authError) {
    if (authError.message.includes("already registered")) {
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      user = existingUser?.users.find((u) => u.phone === phone) || null;
    } else {
      throw authError;
    }
  }

  if (!user) throw new Error("Gagal memproses user");

  await db
    .insert(profiles)
    .values({
      id: user.id,
      phone: phone,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { updated_at: new Date() },
    });

  // Instead of createSession (which is restricted), return user to let the API handle the sign-in flow
  // Typically, for custom OTP, we use signInWithOtp on the client side.
  // But since we verified manually, we can return the user info.
  return {
    user: user,
  };
}
