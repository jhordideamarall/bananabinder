import { NextResponse } from 'next/server';

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || '';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get('input');

    if (!input) {
      return NextResponse.json({ error: 'Input query is required' }, { status: 400 });
    }

    const res = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(input)}`, {
      headers: {
        'Authorization': `Bearer ${BITESHIP_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('BITESHIP_AREA_SEARCH_ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
