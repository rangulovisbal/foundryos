import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal-page-shell";
import { subprocessorEntries } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `Subprocessors | ${siteConfig.name}`,
  description:
    "Lightweight FoundryOS subprocessor notice listing the infrastructure and service providers currently used in the pilot product."
};

export default function SubprocessorsPage() {
  return (
    <LegalPageShell
      currentPath="/subprocessors"
      eyebrow="Subprocessors"
      intro="This notice lists the third-party services that may process data for the current FoundryOS pilot. Optional services are marked clearly so the page reflects actual deployment reality."
      title="Current processing and subprocessor notice."
    >
      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Current providers</p>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-[color:var(--border)]">
          <table className="min-w-full divide-y divide-[color:var(--border)] bg-white/80 text-left text-sm">
            <thead className="bg-white/90 text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Data involved</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {subprocessorEntries.map((entry) => (
                <tr
                  className="border-t border-[color:var(--border)] align-top"
                  key={entry.vendor}
                >
                  <td className="px-4 py-4 font-semibold">{entry.vendor}</td>
                  <td className="px-4 py-4 text-muted">{entry.role}</td>
                  <td className="px-4 py-4 text-muted">{entry.data}</td>
                  <td className="px-4 py-4 text-muted">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Founder note</p>
        <p className="mt-4 text-sm leading-7 text-muted">
          This notice still needs lawyer review before a broader launch, especially
          if the product adds formal analytics, a data processing addendum, or
          region-specific transfer language.
        </p>
      </section>
    </LegalPageShell>
  );
}
