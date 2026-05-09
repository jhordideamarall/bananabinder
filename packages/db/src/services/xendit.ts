export interface CreateInvoiceInput {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export async function createXenditInvoice(input: CreateInvoiceInput) {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) throw new Error("XENDIT_SECRET_KEY is not set");

  const authHeader = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: input.externalId,
      amount: input.amount,
      payer_email: input.payerEmail,
      description: input.description,
      items: input.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${input.externalId}`,
      failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Gagal membuat invoice Xendit");
  }

  return {
    invoiceUrl: data.invoice_url,
    externalId: data.external_id,
    status: data.status,
  };
}

export async function createXenditRefund(
  invoiceId: string,
  amount: number,
  reason: string
) {
  const secretKey = process.env.XENDIT_SECRET_KEY;
  if (!secretKey) throw new Error("XENDIT_SECRET_KEY is not set");

  const authHeader = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    `https://api.xendit.co/v2/invoices/${invoiceId}/refunds`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        reason,
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Gagal memproses refund Xendit");
  }

  return data;
}
