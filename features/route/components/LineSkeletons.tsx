export function LineSkeletons() {
    return (
        <>
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="aspect-[3/4] w-full animate-pulse rounded-2xl border border-border bg-muted"
                />
            ))}
        </>
    );
}
