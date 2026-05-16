import { NextResponse } from 'next/server';

interface BiteshipAreaResponse {
  areas?: Array<{ id: string; name: string; postal_code?: string }>;
  error?: string;
  message?: string;
}

export async function GET(req: Request) {
  try {
    const apiKey = process.env.BITESHIP_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Biteship API key is not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json({ error: 'Input query is required' }, { status: 400 });
    }

    const res = await fetch(
      `https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(input)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = (await res.json()) as BiteshipAreaResponse;

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Internal Server Error');
    console.error('BITESHIP_AREA_SEARCH_ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
