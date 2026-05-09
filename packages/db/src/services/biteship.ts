export interface BiteshipRateInput {
  origin_area_id?: string;
  origin_postal_code?: number;
  destination_area_id?: string;
  destination_postal_code?: number;
  couriers: string; // e.g. "jne,jnt,sicepat"
  items: Array<{
    name: string;
    description?: string;
    value: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    quantity: number;
  }>;
}

export async function getBiteshipRates(input: BiteshipRateInput) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("BITESHIP_API_KEY is not set");

  const response = await fetch("https://api.biteship.com/v1/rates", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal mengambil rate Biteship");
  }

  return data.pricing; // Array of rates
}

export interface BiteshipOrderInput {
  shipper_contact_name: string;
  shipper_contact_phone: string;
  shipper_contact_email: string;
  origin_contact_name: string;
  origin_contact_phone: string;
  origin_address: string;
  origin_area_id?: string;
  origin_postal_code?: number;
  origin_note?: string;
  destination_contact_name: string;
  destination_contact_phone: string;
  destination_contact_email?: string;
  destination_address: string;
  destination_area_id?: string;
  destination_postal_code?: number;
  destination_note?: string;
  courier_company: string;
  courier_type: string;
  delivery_type: "now" | "later";
  delivery_date?: string; // YYYY-MM-DD
  delivery_time?: string; // HH:mm
  items: Array<{
    name: string;
    description?: string;
    value: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    quantity: number;
  }>;
}

export async function createBiteshipOrder(input: BiteshipOrderInput) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("BITESHIP_API_KEY is not set");

  const response = await fetch("https://api.biteship.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal membuat order Biteship");
  }

  return data;
}

export async function getBiteshipTracking(waybill: string, courier: string) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("BITESHIP_API_KEY is not set");

  const response = await fetch(
    `https://api.biteship.com/v1/trackings/${waybill}/couriers/${courier}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal melacak resi Biteship");
  }

  return data;
}

export async function searchBiteshipAreas(input: string) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("BITESHIP_API_KEY is not set");

  const response = await fetch(
    `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(input)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal mencari area Biteship");
  }

  return data.areas;
}

export async function reverseGeocodeBiteship(lat: number, lng: number) {
  const apiKey = process.env.BITESHIP_API_KEY;
  if (!apiKey) throw new Error("BITESHIP_API_KEY is not set");

  const response = await fetch(
    `https://api.biteship.com/v1/maps/areas?countries=ID&latitude=${lat}&longitude=${lng}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Gagal melakukan reverse geocode Biteship");
  }

  // Usually returns the closest area
  return data.areas[0];
}
