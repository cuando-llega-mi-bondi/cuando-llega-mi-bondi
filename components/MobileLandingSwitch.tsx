import { headers } from "next/headers";
import { HomeClient } from "@/components/HomeClient";
import { HomeIntro } from "@/components/HomeIntro";
import { LandingPage } from "@/components/LandingPage";

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
