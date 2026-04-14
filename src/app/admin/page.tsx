import { redirect } from "next/navigation";

import { isAdminSessionValid } from "@/lib/admin-auth";
import { listLeadRecords } from "@/db/queries";
import { env } from "@/lib/env";

export default async function AdminPage() {
  const isValid = await isAdminSessionValid();

  if (!isValid) {
    redirect("/admin/login");
  }

  const leadData = await listLeadRecords();

  return (
    <div className="page-shell space-y-8 pt-0">
      <section className="surface p-6 md:p-8">
        <span className="eyebrow">Admin panel</span>
        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">
          Internal operating control center.
        </h1>
        <p className="mt-4 body-lg">
          This panel shows lead storage mode, integration readiness and the
          current capture queue. It is ready for Neon-backed storage and falls
          back to local JSON during local-only development.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Lead storage" value={leadData.storage} />
        <StatusCard label="Neon" value={env.hasNeon ? "configured" : "pending"} />
        <StatusCard label="Resend" value={env.hasResend ? "configured" : "pending"} />
        <StatusCard label="Stripe" value={env.hasStripe ? "configured" : "pending"} />
      </section>

      <section className="surface p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted">
              Leads
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              Current capture queue
            </h2>
          </div>
          <form action="/api/admin/logout" method="post">
            <button
              className="rounded-full border border-[color:var(--border)] bg-white/80 px-4 py-2 text-sm font-semibold"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Lead</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Team</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leadData.items.length > 0 ? (
                leadData.items.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-[color:var(--border)] align-top"
                  >
                    <td className="px-4 py-4 text-muted">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-muted">{lead.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{lead.company}</p>
                      <p className="text-muted">{lead.website || "n/a"}</p>
                    </td>
                    <td className="px-4 py-4 text-muted">{lead.teamSize}</td>
                    <td className="px-4 py-4 text-muted">{lead.source}</td>
                    <td className="px-4 py-4">
                      <span className="pill bg-teal/15 text-teal">{lead.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted" colSpan={6}>
                    No leads captured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric-card">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold capitalize">{value}</p>
    </article>
  );
}
