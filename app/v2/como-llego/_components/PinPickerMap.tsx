"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./PinPickerMapInner"), {
    ssr: false,
    loading: () => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAF7F0]">
            <div className="font-mono text-[12px] text-[#6B7080]">cargando mapa…</div>
        </div>
    ),
});

export function PinPickerMap(props: {
    initial?: { lat: number; lng: number } | null;
    onConfirm: (coords: { lat: number; lng: number }) => void;
    onCancel: () => void;
}) {
    // Portal a body para escapar el stacking context del layout v2 (main z-10)
    // que dejaba la BottomNav tapando el modal.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) return null;
    return createPortal(<Inner {...props} />, document.body);
}
