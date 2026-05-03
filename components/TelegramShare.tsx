import { memo } from "react";
import { IconTelegram } from "./icons/IconTelegram";
import { encodeLiveSharePayload } from "@/lib/liveSharePayload";

interface TelegramShareProps {
  codLinea: string;
  selectedRamal: string;
  telegramUsername: string;
}

export const TelegramShare = memo(function TelegramShare({
  codLinea,
  selectedRamal,
  telegramUsername,
}: TelegramShareProps) {
  if (!codLinea || !telegramUsername) return null;

  const ramalKey = selectedRamal === "TODOS" ? "" : selectedRamal;
  let payload = "";
  try {
    payload = encodeLiveSharePayload(codLinea, ramalKey);
  } catch {
    payload = codLinea;
  }
  const tgHref = `https://t.me/${telegramUsername}?start=${encodeURIComponent(payload)}`;

  return (
    <a
      href={tgHref}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        background: "rgba(42,171,238,0.08)",
        border: "1px solid rgba(42,171,238,0.3)",
        borderRadius: 8,
        textDecoration: "none",
        color: "#2AABEE",
        fontFamily: "var(--display)",
        fontWeight: 700,
        fontSize: 14,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(42,171,238,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          "rgba(42,171,238,0.08)";
      }}
    >
      <IconTelegram size={20} />
      <span style={{ flex: 1 }}>
        {selectedRamal && selectedRamal !== "TODOS"
          ? `¿Vas en el ramal ${selectedRamal}? Compartí la ubicacion del bondi en vivo`
          : "¿Vas en el bondi? Compartí su ubicación vivo"}
      </span>
    </a>
  );
});
