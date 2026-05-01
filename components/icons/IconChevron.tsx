import { cn } from "@/lib/utils";

export const IconChevron = ({
    open,
    className,
}: {
    open: boolean;
    className?: string;
}) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className={cn("h-[14px] w-[14px] transition-transform duration-300", className)}
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
