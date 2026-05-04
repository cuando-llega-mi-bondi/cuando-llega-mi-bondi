import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(request: NextRequest, { params }: { params: Promise<{ linea: string }> }) {
    const { linea } = await params;
    const response = NextResponse.json({ linea, timestamp: Date.now() });
    // response.headers.set("Cache-Control", "public, s-maxage=300, max-age=300");
    return response;
}

