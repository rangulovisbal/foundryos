export function ConfigurationRequiredPanel({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="surface mx-auto max-w-3xl p-6 md:p-8">
      <span className="eyebrow">Configuration required</span>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">{title}</h1>
      <p className="mt-4 body-lg">{body}</p>
      <p className="mt-4 text-sm text-muted">
        Public preview pages can still render, but authenticated product access
        and internal admin controls require the production database connection.
      </p>
    </section>
  );
}
