type AvatarProps = {
  iniciales: string;
  size?: "sm" | "md" | "lg";
};

export function Avatar({ iniciales, size = "md" }: AvatarProps) {
  const dim = size === "sm" ? "h-9 w-9 text-sm" : size === "lg" ? "h-14 w-14 text-xl" : "h-11 w-11 text-base";
  return (
    <div
      className={`relative ${dim} grid place-items-center rounded-full font-display font-semibold text-[#0F1115] shrink-0`}
      style={{
        background: "linear-gradient(135deg, #FFD60A 0%, #FFC700 50%, #FFB000 100%)",
        boxShadow:
          "0 1px 0 rgba(255,255,255,0.7) inset, 0 -2px 6px rgba(120,80,0,0.15) inset, 0 4px 14px -6px rgba(255,184,0,0.6)",
      }}
      aria-label={`Avatar ${iniciales}`}
    >
      <span className="leading-none">{iniciales}</span>
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#0099FF] ring-2 ring-[#FAF7F0]" />
    </div>
  );
}
