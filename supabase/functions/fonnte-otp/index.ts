import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

/**
 * IDE Fix: Declare Deno namespace for environments without Deno extension
 */
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const FONNTE_TOKEN = Deno.env.get('FONNTE_TOKEN');

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json();

    if (!payload?.user?.phone || !payload?.sms?.otp) {
      return new Response(JSON.stringify({ error: 'Invalid payload format' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { phone, user_metadata } = payload.user;
    const { otp } = payload.sms;

    // Get name from metadata, fallback to "Pelanggan" if not provided
    const name = user_metadata?.full_name || 'Pelanggan';

    // Clean phone number for Fonnte
    const target = phone.replace('+', '');

    // Custom branded message
    const message = `Halo Kak ${name}! 👋\n\nTerima kasih telah bergabung menjadi bagian dari Bananasbindery. Ini adalah kode verifikasi (OTP) Anda:\n\n*${otp}*\n\nJangan berikan kode ini kepada siapa pun ya. Selamat berbelanja binder dan photocard essentials favoritmu! 🍌\n\n— Tim Bananasbindery`;

    if (!FONNTE_TOKEN) {
      console.error('FONNTE_TOKEN is missing!');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`Sending OTP to ${target} with message length: ${message.length}`);

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: FONNTE_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: target,
        message: message,
      }),
    });

    const result = await response.json();
    console.log('Fonnte API Response:', JSON.stringify(result));

    if (result.status) {
      console.log('OTP successfully sent via Fonnte');
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      console.error('Fonnte API Error:', result.reason || 'Unknown error');
      return new Response(
        JSON.stringify({
          error: result.reason || 'Fonnte API Failure',
          details: result,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        },
      );
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Edge Function Catch-all Error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
