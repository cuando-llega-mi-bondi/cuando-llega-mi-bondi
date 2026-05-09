import { Suspense } from "react";
import { MobileLandingSwitch } from "@/components/MobileLandingSwitch";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MobileLandingSwitch />
        </Suspense>
    );
}
