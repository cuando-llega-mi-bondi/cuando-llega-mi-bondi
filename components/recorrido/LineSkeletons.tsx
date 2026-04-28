export function LineSkeletons() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="mb-1.5 flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3 shadow-[rgba(0,153,255,0.15)_0px_0px_0px_1px]"
                >
                    <div className="h-10 w-[52px] rounded-full bg-white/10 animate-pulse-soft" />
                    <div className="flex-1">
                        <div className="mb-1.5 h-3.5 w-3/5 rounded bg-white/10 animate-pulse-soft" />
                        <div className="h-[11px] w-1/3 rounded bg-white/10 animate-pulse-soft" />
                    </div>
                </div>
            ))}
        </>
    );
}
