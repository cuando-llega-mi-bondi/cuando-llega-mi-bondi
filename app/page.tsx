import { Suspense } from "react";
import { HomeClient } from "@/components/HomeClient";
import { HomeIntro } from "@/components/HomeIntro";

export default function Page() {
    return (
        <Suspense>
            <HomeClient>
                <HomeIntro />
            </HomeClient>
        </Suspense>
    );
}