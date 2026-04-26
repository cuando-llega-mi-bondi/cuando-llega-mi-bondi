import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseLiveSharePayload } from "@/lib/liveSharePayload";

// We use service_role client in the backend to ensure we can update rows
// Note: If you don't have service_role, anon key works if RLS allows public anonymous updates
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle deep link /start (e.g. "221" or "221__R__41"); acepta /start@botName payload
    const msg = body.message?.text;
    if (typeof msg === "string" && /^\/start/i.test(msg)) {
      const after = msg.replace(/^\/start(?:@[A-Za-z0-9_]+)?\s*/i, "").trim();
      const { linea, ramal } = parseLiveSharePayload(after);
      const chatId = body.message.chat.id.toString();

      if (linea) {
        await supabase.from("bus_locations").upsert({
          session_id: chatId,
          linea,
          ramal: ramal ?? null,
          lat: 0,
          lng: 0,
          updated_at: new Date().toISOString()
        });

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          const ramaInfo = ramal
            ? `, ramal ${ramal},`
            : ``;
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ Listo (línea ${linea}${ramaInfo}). Ahora tocá el ícono 📎, seleccioná "Ubicación" y luego "Compartir Ubicación en Tiempo Real" (Live Location) para que los que esperan este recorrido te vean en el mapa.`
            })
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Handle Live Location updates (these come as edited_message)
    const editedMsg = body.edited_message || body.message;
    if (editedMsg?.location?.live_period || editedMsg?.location) {
      const chatId = editedMsg.chat.id.toString();
      const lat = editedMsg.location.latitude;
      const lng = editedMsg.location.longitude;

      // Update the existing row (it should have been created by /start)
      const { error } = await supabase
        .from("bus_locations")
        .update({
          lat,
          lng,
          updated_at: new Date().toISOString()
        })
        .eq("session_id", chatId);

      if (error) {
        console.error("Supabase error:", error);
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
