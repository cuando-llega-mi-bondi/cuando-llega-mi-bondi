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
            className="flex items-center gap-2.5 rounded-xl border border-accent/35 bg-accent/12 px-4 py-3 font-sans text-sm font-medium tracking-[-0.01em] text-accent transition hover:bg-accent/18"
        >
            <IconTelegram size={20} />
            <span className="flex-1">
                {selectedRamal && selectedRamal !== "TODOS"
                    ? `¿Vas en el ramal ${selectedRamal}? Compartí tu ubicación en vivo`
                    : "¿Vas en el colectivo? Compartí tu ubicación en vivo"}
            </span>
        </a>
    );
}
