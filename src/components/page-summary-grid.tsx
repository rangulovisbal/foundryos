type PageSummaryItem = {
  label: string;
  value: string;
  detail?: string;
};

export function PageSummaryGrid({
  columns = "md:grid-cols-2 xl:grid-cols-4",
  items
}: {
  columns?: string;
  items: PageSummaryItem[];
}) {
  return (
    <section className={`grid gap-4 ${columns}`}>
      {items.map((item) => (
        <article
          className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5"
          key={item.label}
        >
          <p className="text-sm uppercase tracking-[0.18em] text-muted">{item.label}</p>
          <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          {item.detail ? (
            <p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
