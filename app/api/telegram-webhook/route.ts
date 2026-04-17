import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use service_role client in the backend to ensure we can update rows
// Note: If you don't have service_role, anon key works if RLS allows public anonymous updates
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Handle deep link /start e.g. /start 221
    if (body.message?.text?.startsWith("/start ")) {
      const parts = body.message.text.split(" ");
      const line = parts[1];
      const chatId = body.message.chat.id.toString();

      if (line) {
        // Upsert a dummy location just to save the "linea" association 
        await supabase.from("bus_locations").upsert({
          session_id: chatId,
          linea: line,
          lat: 0,
          lng: 0,
          updated_at: new Date().toISOString()
        });

        // Optional: send a reply back to the user via Telegram API
        // In a real app we would hit https://api.telegram.org/bot<TOKEN>/sendMessage
        // but it's optional. It's better to guide them:
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `✅ Listo. Ahora tocá el ícono 📎, seleccioná "Ubicación" y luego "Compartir Ubicación en Tiempo Real" (Live Location) para que los que esperan el ${line} te vean en el mapa.`
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
