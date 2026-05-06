type Props = {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function Section({ eyebrow, title, action, children }: Props) {
  return (
    <section className="px-5">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#6B7080]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-[#0F1115]">
            {title}
          </h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
