"use client";

import dynamic from "next/dynamic";

const MicrosoftClarityScript = dynamic(
    () =>
        import("@shared/analytics/MicrosoftClarityScript").then(
            (mod) => mod.MicrosoftClarityScript,
        ),
    { ssr: false },
);

export function MicrosoftClarityDeferred() {
    return <MicrosoftClarityScript />;
}
