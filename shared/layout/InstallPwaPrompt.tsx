"use client";

import { useEffect } from "react";

export function InstallPwaPrompt() {
    useEffect(() => {
        void import("@khmyznikov/pwa-install");
    }, []);

    return (
        <pwa-install
            manifestUrl="/manifest.json"
            installDescription="Instalá la app para acceso rápido"
            useLocalStorage
        />
    );
}
