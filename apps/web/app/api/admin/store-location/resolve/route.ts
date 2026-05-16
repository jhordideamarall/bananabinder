import { NextResponse, type NextRequest } from 'next/server';
import type { Enums } from '@bananasbindery/types/supabase';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { createClient } from '@/lib/supabase/server';

const ADMIN_ROLES: Enums<'user_role'>[] = ['admin', 'owner', 'staff'];

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  const supabase = (await createClient()) as TypedSupabaseClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  return { ok: true };
}

interface NominatimResponse {
  display_name?: string;
  address?: {
    postcode?: string;
    suburb?: string;
    village?: string;
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    state?: string;
    road?: string;
    house_number?: string;
  };
}

// Biteship /v1/maps/areas response — per dokumentasi:
// https://biteship.com/id/docs/api/maps/retrieve_area
// Level 1 = province, 2 = city, 3 = district (kecamatan), 4 = subdistrict (kelurahan).
// Field `id` adalah Biteship area_id yang dipakai sbg `origin_area_id` / `destination_area_id`
// di endpoint /v1/rates/couriers.
interface BiteshipAreasResponse {
  areas?: Array<{
    id: string;
    name: string;
    postal_code?: string | number;
    administrative_division_level_1_name?: string;
    administrative_division_level_2_name?: string;
    administrative_division_level_3_name?: string;
    administrative_division_level_4_name?: string;
  }>;
}

interface ResolveResponse {
  address: string;
  postalCode: string | null;
  biteshipAreaId: string | null;
  biteshipLabel: string | null;
  candidates: Array<{ id: string; label: string; postalCode?: string }>;
}

function buildSearchInput(addr: NominatimResponse['address']): string {
  if (!addr) return '';
  const parts = [
    addr.suburb ?? addr.village,
    addr.city ?? addr.town ?? addr.municipality ?? addr.county,
    addr.postcode,
  ].filter(Boolean);
  return parts.join(' ').trim();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { latitude, longitude } = (await req.json()) as { latitude?: number; longitude?: number };
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ error: 'latitude/longitude tidak valid' }, { status: 400 });
    }

    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Biteship API key belum di-set' }, { status: 503 });
    }

    // 1. Reverse geocode via Nominatim (OSM, free)
    const nominatimRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`,
      {
        headers: {
          'User-Agent': 'Bananabinder-Admin (admin@bananasbindery.com)',
        },
      },
    );

    if (!nominatimRes.ok) {
      return NextResponse.json(
        { error: `Reverse geocode gagal (${nominatimRes.status})` },
        { status: 502 },
      );
    }

    const nominatim = (await nominatimRes.json()) as NominatimResponse;
    const address = nominatim.display_name ?? '';
    const postalCode = nominatim.address?.postcode ?? null;

    // 2. Search Biteship — prioritas: postal code, fallback: suburb/city text
    const searchInputs: string[] = [];
    if (postalCode) searchInputs.push(postalCode);
    const textInput = buildSearchInput(nominatim.address);
    if (textInput) searchInputs.push(textInput);

    let candidates: ResolveResponse['candidates'] = [];

    for (const input of searchInputs) {
      const biteshipRes = await fetch(
        `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(input)}`,
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
      if (!biteshipRes.ok) continue;
      const data = (await biteshipRes.json()) as BiteshipAreasResponse;
      if (data.areas && data.areas.length > 0) {
        const seen = new Set<string>();
        candidates = [];
        for (const a of data.areas) {
          if (seen.has(a.id)) continue;
          seen.add(a.id);
          const parts = [
            a.administrative_division_level_4_name,
            a.administrative_division_level_3_name,
            a.administrative_division_level_2_name,
            a.administrative_division_level_1_name,
          ].filter((x): x is string => typeof x === 'string' && x.length > 0);
          const postal = a.postal_code != null ? String(a.postal_code) : undefined;
          const labelBase = parts.length > 0 ? parts.join(', ') : a.name;
          candidates.push({
            id: a.id,
            label: postal ? `${labelBase} · ${postal}` : labelBase,
            postalCode: postal,
          });
          if (candidates.length >= 6) break;
        }
        break;
      }
    }

    const response: ResolveResponse = {
      address,
      postalCode,
      biteshipAreaId: candidates[0]?.id ?? null,
      biteshipLabel: candidates[0]?.label ?? null,
      candidates,
    };

    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    console.error('STORE_LOCATION_RESOLVE_ERROR:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
