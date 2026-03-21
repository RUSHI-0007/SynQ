import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const payload = await req.json();
  
  console.log('Received Clerk Webhook:', payload.type);

  return NextResponse.json({ success: true });
}
