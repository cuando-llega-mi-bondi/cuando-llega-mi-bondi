import { headers } from "next/headers";
import { HomeClient } from "@/app/HomeClient";
import { HomeIntro } from "@features/landing/components/HomeIntro";
import { LandingPage } from "@features/landing/components/LandingPage";

export async function MobileLandingSwitch() {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isMobile = /mobile|iphone|android|touch/i.test(userAgent);

    if (!isMobile) {
        return <LandingPage />;
    }

    return (
        <HomeClient>
            <HomeIntro />
        </HomeClient>
    );
}
