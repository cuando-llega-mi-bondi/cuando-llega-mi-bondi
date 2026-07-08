import { Suspense } from "react";
import { MobileLandingSwitch } from "@features/landing/components/MobileLandingSwitch";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MobileLandingSwitch />
        </Suspense>
    );
}
