import { Spinner } from "@/components/ui";

export function ArrivalsLoading() {
    return (
        <div className="arrivals-loading-panel">
            <div className="mb-[18px] flex items-center justify-center gap-3 font-sans text-sm tracking-[-0.01em] text-text-dim">
                <Spinner className="h-[22px] w-[22px]" />
                <span>Consultando horarios…</span>
            </div>
            <div className="flex flex-col gap-2">
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row" />
                <div className="arrivals-skeleton-row opacity-70" />
            </div>
        </div>
    );
}
