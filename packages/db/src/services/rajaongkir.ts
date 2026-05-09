export interface ShippingCostOptions {
  origin?: string;
  destination: string;
  weight: number;
  courier: string;
}

export async function getShippingCosts(options: ShippingCostOptions) {
  const apiKey = process.env.RAJAONGKIR_API_KEY;

  if (!apiKey) {
    // Mock for dev
    return [
      {
        code: options.courier,
        name: options.courier.toUpperCase(),
        costs: [
          {
            service: "REG",
            description: "Regular Service",
            cost: [{ value: 15000, etd: "2-3", note: "" }],
          },
        ],
      },
    ];
  }

  const response = await fetch("https://pro.rajaongkir.com/api/cost", {
    method: "POST",
    headers: {
      key: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      origin: options.origin || "501",
      originType: "city",
      destination: options.destination,
      destinationType: "subdistrict",
      weight: options.weight.toString(),
      courier: options.courier,
    }),
  });

  const data = await response.json();

  if (data.rajaongkir.status.code !== 200) {
    throw new Error(data.rajaongkir.status.description);
  }

  return data.rajaongkir.results;
}
