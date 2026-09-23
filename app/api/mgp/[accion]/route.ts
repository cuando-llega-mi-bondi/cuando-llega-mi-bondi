import { NextRequest, NextResponse } from "next/server";
import { fetchMgpDirect, isMgpDirectEnabled } from "@/lib/server/mgpDirect";

// Nada de `export const runtime`/`dynamic` acá: con `cacheComponents: true`
// (next.config.ts) Next 16 rechaza ambos segment configs directamente
// ("Route segment config ... is not compatible with nextConfig.cacheComponents"),
// y ese error rompe el build de producción. Este handler usa `node:crypto`
// (vía mgpDirect) y hace fetch sin `'use cache'`, así que ya corre en
// Node.js y ya es dinámico por default sin declarar nada.

/**
 * Proxy same-origin para arribos en vivo.
 * 1) V670 directo (appWS) si no está deshabilitado
 * 2) Upstream MGP_UPSTREAM / MGP_PROXY_URL (túnel / proxy self-hosted)
 *
 * El cliente llama GET /api/mgp/:accion?... — sin CORS y sin depender de
 * bondi.aeterna.red / proxy.bondimdp.com.ar.
 */

function upstreamBase(): string | null {
    const raw =
        process.env.MGP_UPSTREAM?.trim() ||
        process.env.MGP_PROXY_URL?.trim() ||
        "";
    if (!raw) return null;
    return raw.replace(/\/$/, "");
}

async function fetchUpstream(
    base: string,
    accion: string,
    searchParams: URLSearchParams,
): Promise<unknown> {
    const qs = new URLSearchParams(searchParams);
    qs.delete("accion");
    const url = `${base}/mgp/${encodeURIComponent(accion)}${qs.size ? `?${qs}` : ""}`;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 15_000);
    try {
        const res = await fetch(url, {
            method: "GET",
            signal: ctrl.signal,
            cache: "no-store",
        });
        const text = await res.text();
        if (!res.ok) {
            throw new Error(`upstream HTTP ${res.status}: ${text.slice(0, 120)}`);
        }
        return JSON.parse(text);
    } finally {
        clearTimeout(tid);
    }
}

export async function GET(
    req: NextRequest,
    ctx: { params: Promise<{ accion: string }> },
) {
    const { accion } = await ctx.params;
    if (!accion) {
        return NextResponse.json({ error: "missing_accion" }, { status: 400 });
    }

    const params = new URLSearchParams(req.nextUrl.searchParams);
    params.set("accion", accion);
    const body = params.toString();

    const errors: string[] = [];

    if (isMgpDirectEnabled()) {
        try {
            const data = await fetchMgpDirect(body);
            return NextResponse.json(data, {
                headers: {
                    "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
                    "X-Mgp-Transport": "v670",
                },
            });
        } catch (e) {
            errors.push(`v670: ${(e as Error).message}`);
        }
    }

    const upstream = upstreamBase();
    if (upstream) {
        try {
            const data = await fetchUpstream(upstream, accion, params);
            return NextResponse.json(data, {
                headers: {
                    "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
                    "X-Mgp-Transport": "upstream",
                },
            });
        } catch (e) {
            errors.push(`upstream: ${(e as Error).message}`);
        }
    }

    return NextResponse.json(
        {
            error: "mgp_unavailable",
            message: errors.join(" | ") || "no_mgp_transport",
        },
        { status: 502 },
    );
}
