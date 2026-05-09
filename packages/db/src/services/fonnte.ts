export async function sendWhatsAppMessage(target: string, message: string) {
  const token = process.env.FONNTE_API_TOKEN;
  if (!token) throw new Error("FONNTE_API_TOKEN is not set");

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
    },
    body: new URLSearchParams({
      target: target,
      message: message,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.status) {
    throw new Error(data.reason || "Gagal mengirim pesan WhatsApp via Fonnte");
  }

  return data;
}
