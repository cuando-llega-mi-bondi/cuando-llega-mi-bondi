import { IconTelegram } from "@/components/icons/IconTelegram";
import { encodeLiveSharePayload } from "@/lib/liveSharePayload";

interface TelegramShareCTAProps {
  codLinea: string;
  selectedRamal: string;
  telegramUsername: string;
}

export function TelegramShareCTA({
  codLinea,
  selectedRamal,
  telegramUsername,
}: TelegramShareCTAProps) {
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
      className="flex items-center gap-2.5 rounded-xl border border-secondary/35 bg-secondary/12 px-4 py-3 font-sans text-sm font-medium tracking-tight text-secondary transition hover:bg-secondary/20"
    >
      <IconTelegram size={20} />
      <span className="flex-1">
        {selectedRamal && selectedRamal !== "TODOS"
          ? `¿Vas en el ramal ${selectedRamal}? Compartí la ubicacion del bondi en vivo`
          : "¿Vas en el bondi? Compartí su ubicación vivo"}
      </span>
    </a>
  );
}
