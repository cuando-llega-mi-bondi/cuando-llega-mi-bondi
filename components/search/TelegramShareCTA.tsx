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
            className="flex items-center gap-2.5 rounded-lg border border-[#2AABEE4D] bg-[#2AABEE14] px-4 py-3 font-display text-sm font-bold text-[#2AABEE] transition hover:bg-[#2AABEE26]"
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
