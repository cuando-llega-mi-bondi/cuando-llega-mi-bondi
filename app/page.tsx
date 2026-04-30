import { Suspense } from "react";
import { headers } from "next/headers";
import { HomeClient } from "@/components/HomeClient";
import { HomeIntro } from "@/components/HomeIntro";
import { LandingPage } from "@/components/LandingPage";

export default async function Page() {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    
    // Simple check for mobile devices
    const isMobile = /mobile|iphone|android|touch/i.test(userAgent);

    if (!isMobile) {
        return <LandingPage />;
    }

    return (
        <Suspense>
            <HomeClient>
                <HomeIntro />
            </HomeClient>
        </Suspense>
    );
}