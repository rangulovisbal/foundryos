type PageSummaryItem = {
  label: string;
  value: string;
  detail?: string;
};

export function PageSummaryGrid({
  columns = "foundry-card-grid",
  items
}: {
  columns?: string;
  items: PageSummaryItem[];
}) {
  return (
    <section className={`grid min-w-0 gap-4 ${columns}`}>
      {items.map((item) => (
        <article
          className="min-w-0 rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
          key={item.label}
        >
          <p className="text-sm uppercase tracking-[0.18em] text-muted">{item.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            {item.value}
          </p>
          {item.detail ? (
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
