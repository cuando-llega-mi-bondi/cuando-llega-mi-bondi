interface LiveSharingBannerProps {
    count: number;
}

export function LiveSharingBanner({ count }: LiveSharingBannerProps) {
    if (count <= 0) return null;

    return (
        <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-3 py-2">
            <span className="h-2 w-2 flex-shrink-0 animate-pulse-soft rounded-full bg-success shadow-[0_0_0_0_rgba(34,197,94,0.4)]" />
            <span className="font-sans text-xs text-success">
                {count === 1
                    ? "1 persona compartiendo su ubicación en tiempo real"
                    : `${count} personas compartiendo ubicación en tiempo real`}
            </span>
        </div>
    );
}
