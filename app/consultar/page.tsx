import { Suspense } from "react";
import { HomeClient } from "@/app/HomeClient";
import { HomeIntro } from "@features/landing/components/HomeIntro";

export default function Page() {
    return (
        <Suspense>
            <HomeClient>
                <HomeIntro />
            </HomeClient>
        </Suspense>
    );
}
