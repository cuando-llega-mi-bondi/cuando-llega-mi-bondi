"use client";

import { IconBus } from "./icons/IconBus";

export function Header() {
    return (
        <header className="block w-full border-b border-white/10 bg-black/95 px-[calc(20px+env(safe-area-inset-left,0px))] pt-[calc(16px+env(safe-area-inset-top,0px))] pr-[calc(20px+env(safe-area-inset-right,0px))] pb-4">
            <div className="mx-auto max-w-[520px]">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center p-1">
                        <IconBus />
                    </div>
                    <div className="min-w-0">
                        <p className="m-0 p-0 font-display text-[24px] font-semibold leading-none tracking-[-0.05em] text-text">
                            ¿CUÁNDO LLEGA?
                        </p>
                        <div className="font-mono text-[10px] tracking-[1.4px] text-text-dim">
                            MAR DEL PLATA · TIEMPO REAL
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
