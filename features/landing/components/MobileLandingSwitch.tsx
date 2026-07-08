import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@features/landing/components/LandingPage";

export async function MobileLandingSwitch() {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const isMobile = /mobile|iphone|android|touch/i.test(userAgent);

    if (!isMobile) {
        return <LandingPage />;
    }

    redirect("/consultar");
}