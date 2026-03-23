import { NextRequest, NextResponse } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  try {
    const backendPath = params.path.join('/');
    const queryStr = req.nextUrl.search;
    const backendUrl = `${API_BASE}/api/${backendPath}${queryStr}`;

    const headers = new Headers(req.headers);
    // Explicitly add ngrok bypass header
    headers.set('ngrok-skip-browser-warning', 'true');
    // Remove host to avoid mismatch on destination
    headers.delete('host');

    const bodyBlob = req.method !== 'GET' && req.method !== 'HEAD' ? await req.blob() : null;

    const res = await fetch(backendUrl, {
      method: req.method,
      headers,
      ...(bodyBlob ? { body: bodyBlob } : {}),
    });

    const responseHeaders = new Headers(res.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, proxyFailed: true }, { status: 502 });
  }
}
