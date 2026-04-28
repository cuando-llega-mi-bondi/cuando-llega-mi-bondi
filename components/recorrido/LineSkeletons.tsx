export function LineSkeletons() {
    return (
        <>
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="mb-1.5 flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3"
                >
                    <div className="h-10 w-[52px] rounded-lg bg-surface-2 animate-pulse-soft" />
                    <div className="flex-1">
                        <div className="mb-1.5 h-3.5 w-3/5 rounded bg-surface-2 animate-pulse-soft" />
                        <div className="h-[11px] w-1/3 rounded bg-surface-2 animate-pulse-soft" />
                    </div>
                </div>
            ))}
        </>
    );
}
