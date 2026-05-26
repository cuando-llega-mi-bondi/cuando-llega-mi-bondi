"use client";

import dynamic from "next/dynamic";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

const GoogleAnalytics = dynamic(
    () =>
        import("@next/third-parties/google").then((mod) => {
            function DeferredGoogleAnalytics() {
                if (!gaId) return null;
                return <mod.GoogleAnalytics gaId={gaId} />;
            }
            return { default: DeferredGoogleAnalytics };
        }),
    { ssr: false },
);

export function GoogleAnalyticsDeferred() {
    if (!gaId) return null;
    return <GoogleAnalytics />;
}
