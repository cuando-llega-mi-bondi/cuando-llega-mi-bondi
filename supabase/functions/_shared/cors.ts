export const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, PATCH, OPTIONS",
};

export const jsonHeaders = { ...cors, "content-type": "application/json" };

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
    return new Response(JSON.stringify(body), { ...init, headers: { ...jsonHeaders, ...(init.headers ?? {}) } });
}

export function preflight(req: Request): Response | null {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    return null;
}
