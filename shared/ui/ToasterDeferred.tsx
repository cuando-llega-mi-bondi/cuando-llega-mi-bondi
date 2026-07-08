"use client";

import dynamic from "next/dynamic";

const Toaster = dynamic(
    () => import("./Toast").then((mod) => mod.Toaster),
    { ssr: false },
);

export function ToasterDeferred() {
    return <Toaster />;
}
