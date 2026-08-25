import { NextResponse } from "next/server";
import { parseAdHref } from "@features/sponsors/lib/href";
import { resolveOgMeta, type OgMeta } from "@features/sponsors/lib/ogImage";

const EMPTY_META: OgMeta = { image: null, title: null, description: null };

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("href") ?? "";

  let href: string;
  try {
    href = parseAdHref(raw);
  } catch {
    return NextResponse.json(EMPTY_META, { status: 400 });
  }

  const meta = await resolveOgMeta(href).catch(() => EMPTY_META);

  return NextResponse.json(meta, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" },
  });
}
