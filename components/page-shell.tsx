export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 pb-24 pt-[104px] md:px-9 md:pt-[124px]">
      <div className="mb-10 flex flex-col gap-5 border-b border-white/[0.07] pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ember-400">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-[clamp(2rem,3.6vw,3rem)] font-bold leading-tight tracking-[-0.03em] text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-[14px] leading-relaxed text-mist-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
