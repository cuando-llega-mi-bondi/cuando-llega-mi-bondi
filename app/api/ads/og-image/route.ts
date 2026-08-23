import { NextResponse } from "next/server";
import { parseAdHref } from "@features/sponsors/lib/href";
import { resolveOgImage } from "@features/sponsors/lib/ogImage";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("href") ?? "";

  let href: string;
  try {
    href = parseAdHref(raw);
  } catch {
    return NextResponse.json({ image: null }, { status: 400 });
  }

  const image = await resolveOgImage(href).catch(() => null);

  return NextResponse.json(
    { image },
    { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } },
  );
}
