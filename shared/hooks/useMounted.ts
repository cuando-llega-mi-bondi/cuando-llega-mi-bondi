"use client";

import { useEffect, useState } from "react";

/** True after the client has mounted (safe for localStorage / Date.now). */
export function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
}
