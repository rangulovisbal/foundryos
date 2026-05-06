import Link from "next/link";

import { DeletionRequestForm } from "@/components/deletion-request-form";
import { LockedStatePanel } from "@/components/locked-state-panel";
import { SupportRequestForm } from "@/components/support-request-form";
import {
  listDeletionRequests,
  listSupportRequests
} from "@/db/foundation";
import { requireWorkspaceContext } from "@/lib/auth";
import {
  canRequestAccountDeletion,
  canRequestWorkspaceDeletion,
  canSubmitSupportRequest,
  type OutputLanguage,
  formatDeletionRequestStatus,
  formatDeletionRequestType,
  formatSupportIssueType,
  formatSupportRequestStatus,
  getDeletionConfirmationPhrase,
  isLockedState
} from "@/lib/foundation";
import { copyForLanguage, formatDateTimeForLanguage } from "@/lib/language";
import { publicLegalLinks } from "@/lib/legal";

function supportFaqItems(language: OutputLanguage) {
  return [
    {
      question: copyForLanguage(language, "What FoundryOS does", "Qué hace FoundryOS"),
      answer: copyForLanguage(
        language,
        "FoundryOS turns saved marketing context into a diagnosis, 30-day marketing plan, and optional supporting assets and routines for early-stage businesses.",
        "FoundryOS convierte el contexto de marketing guardado en un diagnóstico, plan de marketing a 30 días y activos/rutinas opcionales para negocios early-stage."
      )
    },
    {
      question: copyForLanguage(language, "What is pilot-only right now", "Qué sigue siendo solo piloto"),
      answer: copyForLanguage(
        language,
        "Billing automation, live checkout control, production support operations, and deeper downstream delivery remain pilot-only or manual in the current MVP.",
        "La automatización de facturación, el control del checkout en vivo, las operaciones de soporte en producción y la entrega posterior siguen siendo solo piloto o manuales en el MVP actual."
      )
    },
    {
      question: copyForLanguage(language, "How outputs are generated", "Cómo se generan los resultados"),
      answer: copyForLanguage(
        language,
        "Each module reads saved workspace context and persisted upstream artifacts. The app stores deterministic structured outputs and histories instead of showing a raw one-off AI text dump.",
        "Cada módulo lee el contexto guardado del espacio y los artefactos persistidos. La app guarda resultados e historiales estructurados y deterministas en lugar de mostrar un texto aislado generado por IA."
      )
    },
    {
      question: copyForLanguage(language, "What the primary language means", "Qué significa el idioma principal"),
      answer: copyForLanguage(
        language,
        "The primary language drives the workspace experience where it is already wired and also controls the language of generated business artifacts.",
        "El idioma principal guía la experiencia del espacio donde ya está conectado y también controla el idioma de los artefactos generados."
      )
    }
  ] as const;
}

function legalDescription(language: OutputLanguage, href: string) {
  switch (href) {
    case "/terms":
      return copyForLanguage(
        language,
        "Pilot product terms, preview scope, and usage boundaries.",
        "Términos del producto piloto, alcance de la vista previa y límites de uso."
      );
    case "/privacy":
      return copyForLanguage(
        language,
        "What workspace and account data is stored and how it is used.",
        "Qué datos del espacio y de la cuenta se guardan y cómo se utilizan."
      );
    case "/cookie":
      return copyForLanguage(
        language,
        "Essential cookies, optional services, and browser controls.",
        "Cookies esenciales, servicios opcionales y controles del navegador."
      );
    default:
      return copyForLanguage(
        language,
        "Third-party processors and operational infrastructure used by the app.",
        "Subencargados y la infraestructura operativa utilizada por la app."
      );
  }
}

export default async function SupportPage() {
  const context = await requireWorkspaceContext("/app/support");
  const language = context.workspace.outputLanguage;
  const canViewWorkspaceRequests = ["owner", "admin"].includes(
    context.membership.role
  );
  const faqItems = supportFaqItems(language);
  const [supportRequests, accountDeletionRequests, workspaceDeletionRequests] =
    await Promise.all([
      listSupportRequests({
        workspaceId: context.workspace.id,
        requestedByUserId: canViewWorkspaceRequests ? undefined : context.user.id,
        limit: 20
      }),
      listDeletionRequests({
        workspaceId: context.workspace.id,
        requestedByUserId: context.user.id,
        requestType: "account_deletion",
        limit: 10
      }),
      canViewWorkspaceRequests
        ? listDeletionRequests({
            workspaceId: context.workspace.id,
            requestType: "workspace_deletion",
            limit: 10
          })
        : Promise.resolve([])
    ]);

  return (
    <div className="space-y-6">
      {isLockedState(context.workspace.accountState) ? (
        <LockedStatePanel
          accountState={context.workspace.accountState}
          language={language}
        />
      ) : null}

      <section className="surface p-6 md:p-8">
        <span className="eyebrow">
          {copyForLanguage(language, "Support and trust", "Soporte y confianza")}
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
          {copyForLanguage(
            language,
            "Help, support requests, and controlled deletion requests.",
            "Ayuda, solicitudes de soporte y solicitudes de eliminación controladas."
          )}
        </h2>
        <p className="mt-4 body-lg">
          {copyForLanguage(
            language,
            "Start with the support form. FAQ, legal documents, and deletion requests are still available below, but they stay out of the main support path.",
            "Empieza por el formulario de soporte. FAQ, documentos legales y solicitudes de eliminación siguen disponibles abajo, pero no dominan la ruta principal."
          )}
        </p>
        <div className="mt-5 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-sm text-muted">
          {copyForLanguage(
            language,
            "Support and deletion request forms remain available even when the workspace is in a restricted pilot state.",
            "Los formularios de soporte y eliminación siguen disponibles incluso cuando el espacio está en un estado piloto restringido."
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SupportRequestForm
          canSubmit={canSubmitSupportRequest()}
          language={language}
        />
        <SupportHistoryPanel
          canViewWorkspaceRequests={canViewWorkspaceRequests}
          language={language}
          supportRequests={supportRequests}
        />
      </section>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Pilot FAQ", "FAQ del piloto")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Expand for product scope, pilot limits, output generation, and language behavior.",
              "Despliega para ver alcance del producto, límites del piloto, generación de resultados e idioma."
            )}
          </p>
        </summary>
      <section className="grid gap-4 px-6 pb-6 md:px-8 md:pb-8 xl:grid-cols-2">
        {faqItems.map((item) => (
          <article
            className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-6"
            key={item.question}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              FAQ
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
              {item.question}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </article>
        ))}
      </section>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Legal and trust documents", "Documentos legales y de confianza")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Terms, privacy, cookies, and subprocessors stay available without dominating the support page.",
              "Términos, privacidad, cookies y subencargados siguen disponibles sin dominar la página de soporte."
            )}
          </p>
        </summary>
        <div className="foundry-card-grid px-6 pb-6 md:px-8 md:pb-8">
          {publicLegalLinks.map((link) => (
            <Link
              key={link.href}
              className="rounded-[24px] border border-[color:var(--border)] bg-white/85 p-5 transition hover:bg-white"
              href={link.href}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
                {link.href === "/terms"
                  ? copyForLanguage(language, "Terms", "Términos")
                  : link.href === "/privacy"
                    ? copyForLanguage(language, "Privacy", "Privacidad")
                    : link.href === "/cookie"
                      ? copyForLanguage(language, "Cookie", "Cookies")
                      : copyForLanguage(language, "Subprocessors", "Subencargados")}
              </p>
              <p className="mt-3 text-sm leading-7 text-muted">
                {legalDescription(language, link.href)}
              </p>
            </Link>
          ))}
        </div>
      </details>

      <details className="surface overflow-hidden">
        <summary className="cursor-pointer px-6 py-5 md:px-8">
          <p className="text-sm uppercase tracking-[0.18em] text-muted">
            {copyForLanguage(language, "Account and data requests", "Solicitudes de cuenta y datos")}
          </p>
          <p className="mt-2 text-sm text-muted">
            {copyForLanguage(
              language,
              "Deletion requests remain manual-review flows. No data is permanently deleted from this customer UI.",
              "Las solicitudes de eliminación siguen siendo flujos de revisión manual. No se elimina nada permanentemente desde esta interfaz de cliente."
            )}
          </p>
        </summary>
      <section className="grid gap-6 px-6 pb-6 md:px-8 md:pb-8 xl:grid-cols-2">
        <DeletionRequestForm
          canSubmit={canRequestAccountDeletion()}
          confirmationPhrase={getDeletionConfirmationPhrase("account_deletion", language)}
          description={copyForLanguage(
            language,
            "Request manual review of your account deletion. This does not execute immediate hard deletion from the app.",
            "Solicita una revisión manual de la eliminación de tu cuenta. Esto no ejecuta una eliminación inmediata desde la app."
          )}
          language={language}
          requestType="account_deletion"
          title={copyForLanguage(language, "Request account deletion", "Solicitar eliminación de cuenta")}
        />
        <DeletionRequestForm
          canSubmit={canRequestWorkspaceDeletion(context.membership.role)}
          confirmationPhrase={getDeletionConfirmationPhrase("workspace_deletion", language)}
          description={copyForLanguage(
            language,
            "Only workspace owners and admins can request workspace deletion. This creates a tracked review request; no workspace is deleted automatically from this UI.",
            "Solo los propietarios y administradores del espacio pueden solicitar su eliminación. Esto crea una solicitud registrada; ningún espacio se elimina automáticamente desde esta interfaz."
          )}
          language={language}
          requestType="workspace_deletion"
          title={copyForLanguage(language, "Request workspace deletion", "Solicitar eliminación del espacio")}
        />
      </section>

      <section className="grid gap-6 px-6 pb-6 md:px-8 md:pb-8 xl:grid-cols-2">
        <DeletionHistoryPanel
          deletionRequests={accountDeletionRequests}
          language={language}
          title={copyForLanguage(language, "Your account deletion requests", "Tus solicitudes de eliminación de cuenta")}
        />
        <DeletionHistoryPanel
          deletionRequests={workspaceDeletionRequests}
          language={language}
          title={copyForLanguage(language, "Workspace deletion requests", "Solicitudes de eliminación del espacio")}
        />
      </section>
      </details>
    </div>
  );
}

function SupportHistoryPanel({
  canViewWorkspaceRequests,
  language,
  supportRequests
}: {
  canViewWorkspaceRequests: boolean;
  language: OutputLanguage;
  supportRequests: Awaited<ReturnType<typeof listSupportRequests>>;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">
        {canViewWorkspaceRequests
          ? copyForLanguage(language, "Workspace support queue", "Cola de soporte del espacio")
          : copyForLanguage(language, "Your support requests", "Tus solicitudes de soporte")}
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
        {copyForLanguage(language, "Recent support requests", "Solicitudes recientes de soporte")}
      </h3>
      <div className="foundry-table-frame mt-5">
        <table className="foundry-table">
          <thead className="bg-white/90 text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Issue", "Asunto")}
              </th>
              {canViewWorkspaceRequests ? (
                <th className="px-4 py-3 font-semibold">
                  {copyForLanguage(language, "Requester", "Solicitante")}
                </th>
              ) : null}
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Status", "Estado")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Created", "Creada")}
              </th>
            </tr>
          </thead>
          <tbody>
            {supportRequests.length > 0 ? (
              supportRequests.map((entry) => (
                <tr
                  className="border-t border-[color:var(--border)] align-top"
                  key={entry.request.id}
                >
                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {formatSupportIssueType(entry.request.issueType, language)}
                    </p>
                    <p className="mt-2 max-w-[52ch] text-muted">
                      {entry.request.message}
                    </p>
                  </td>
                  {canViewWorkspaceRequests ? (
                    <td className="px-4 py-4">
                      <p className="font-semibold">{entry.requestedByUser.fullName}</p>
                      <p className="text-muted">{entry.requestedByUser.email}</p>
                    </td>
                  ) : null}
                  <td className="px-4 py-4 capitalize">
                    {formatSupportRequestStatus(entry.request.status, language)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {formatDateTimeForLanguage(language, entry.request.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-6 text-muted"
                  colSpan={canViewWorkspaceRequests ? 4 : 3}
                >
                  {copyForLanguage(
                    language,
                    "No support requests have been submitted yet.",
                    "Todavía no se han enviado solicitudes de soporte."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeletionHistoryPanel({
  deletionRequests,
  language,
  title
}: {
  deletionRequests: Awaited<ReturnType<typeof listDeletionRequests>>;
  language: OutputLanguage;
  title: string;
}) {
  return (
    <section className="surface p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">
        {copyForLanguage(language, "Deletion requests", "Solicitudes de eliminación")}
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
      <div className="foundry-table-frame mt-5">
        <table className="foundry-table">
          <thead className="bg-white/90 text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Type", "Tipo")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Status", "Estado")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Reason", "Motivo")}
              </th>
              <th className="px-4 py-3 font-semibold">
                {copyForLanguage(language, "Created", "Creada")}
              </th>
            </tr>
          </thead>
          <tbody>
            {deletionRequests.length > 0 ? (
              deletionRequests.map((entry) => (
                <tr
                  className="border-t border-[color:var(--border)] align-top"
                  key={entry.request.id}
                >
                  <td className="px-4 py-4 font-semibold">
                    {formatDeletionRequestType(entry.request.requestType, language)}
                  </td>
                  <td className="px-4 py-4 capitalize">
                    {formatDeletionRequestStatus(entry.request.status, language)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {entry.request.reason ??
                      copyForLanguage(language, "No reason added.", "Sin motivo añadido.")}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {formatDateTimeForLanguage(language, entry.request.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={4}>
                  {copyForLanguage(
                    language,
                    "No deletion requests have been submitted yet.",
                    "Todavía no se han enviado solicitudes de eliminación."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
