import { Suspense } from "react";
import { MobileLandingSwitch } from "@features/landing/components/MobileLandingSwitch";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
    return (
        <Suspense fallback={null}>
            <MobileLandingSwitch />
        </Suspense>
    );
}
