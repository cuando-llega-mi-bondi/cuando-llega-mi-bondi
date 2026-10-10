"use client";

import { useEffect, useState } from "react";
import { isAndroidBrowser } from "./playStore";

/** true solo en cliente tras montar (evita mismatch SSR). */
export function useIsAndroidBrowser(): boolean {
    const [android, setAndroid] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate
        setAndroid(isAndroidBrowser());
    }, []);

    return android;
}
