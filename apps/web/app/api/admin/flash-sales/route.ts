import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Flash sale belum aktif untuk skema binder.' },
    { status: 410 },
  );
}
