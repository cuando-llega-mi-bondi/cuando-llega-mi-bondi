import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Borra la cuenta del usuario autenticado. Antes de borrar el auth user,
 * anonimiza sus reseñas (display_name → "Usuario eliminado", user_id →
 * null) en vez de dejarlas caer por el ON DELETE CASCADE de la FK — quedan
 * públicas pero ya no editables por nadie. Necesita el service role key:
 * ni el borrado de `auth.users` ni el update sin dueño (falla el RLS
 * `WITH CHECK` de `reviews_update_own` porque el user_id nuevo es null)
 * se pueden hacer con la anon key.
 */
export async function POST(req: NextRequest) {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: "Servicio no configurado" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) {
        return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }
    const userId = userData.user.id;

    const { error: anonError } = await admin
        .from("bus_line_reviews")
        .update({ user_id: null, display_name: "Usuario eliminado" })
        .eq("user_id", userId);
    if (anonError) {
        return NextResponse.json({ error: anonError.message }, { status: 500 });
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
