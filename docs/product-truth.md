# PRODUCT TRUTH

## What FoundryOS does today

FoundryOS v1 currently turns a saved business profile and user-entered business
evidence into a deterministic marketing diagnosis for the workspace. Today that
includes:

- a workspace-scoped business and marketing profile
- evidence intake for website URL, channel URLs, positioning, CTA, pricing, acquisition method, sales process, and founder notes
- deterministic diagnostics from saved profile inputs and user-entered evidence
- persisted diagnostic scores, risks, opportunities, and next actions
- marketing-priority, 30-day action-plan, asset, and workflow generation built on the saved workspace truth layer
- usage gating, account-state handling, and admin visibility for internal control

The current system is strongest when the profile is complete, specific, internally
consistent, and supported by concrete evidence entered by the founder or operator.
It is intentionally conservative when those conditions are not met.

## What FoundryOS does not do yet

FoundryOS does not currently:

- read live source-of-truth systems such as CRM, analytics, ads, finance, or support platforms
- verify claims against external integrations in real time
- crawl, scrape, or independently inspect the website or channel URLs provided by the user
- autonomously understand a company without structured workspace input
- operate as a background agent that makes business decisions or changes systems on its own
- use live billing as the product truth layer

## Deterministic now vs AI-assisted later

The current truth layer is deterministic first.

- Diagnostics are rule-based and derived from the saved workspace profile.
- Evidence-backed currently means the user has provided structured supporting evidence; it does not mean FoundryOS has independently verified that evidence.
- Confidence is calculated from completeness, consistency, specificity, visible evidence, conversion evidence, acquisition evidence, and evidence quality.
- Contradictions and weak input are supposed to lower certainty instead of being smoothed over.
- Diagnostics must separate founder-stated inputs, visible evidence entered by the user, missing evidence, and contradictory evidence.

AI-assisted behavior may be added later for drafting, synthesis, or variant generation, but:

- AI-assisted layers must sit on top of the deterministic truth layer, not replace it.
- AI should not upgrade trust claims beyond what the saved evidence supports.
- Any later AI assistance should inherit the same honesty rule: weak signal should produce weaker claims.

## Trust level the product should claim today

FoundryOS should currently claim:

- deterministic profile-based marketing diagnosis
- evidence-backed initial diagnostics when the founder has entered concrete website, positioning, channel, CTA, pricing, acquisition, and sales-process evidence
- explainable scores with visible evidence references
- explicit validation needs when evidence is weak, missing, or contradictory
- directional marketing planning support grounded in saved workspace context

FoundryOS should not currently claim:

- autonomous business understanding
- live business truth across external systems
- verified website, CRM, analytics, sales, or channel truth
- authoritative certainty when the profile is vague or contradictory

## Current confidence standard

- `high` confidence means the profile is complete, specific, consistent, supported by meaningful marketing evidence, and includes enough visible/CTA/acquisition evidence for stronger claims.
- `medium` confidence means the profile is usable, but some gaps, ambiguity, or unverified evidence still limit certainty.
- `low` confidence means the profile is weak, contradictory, too vague, or missing the business evidence needed for strong conclusions.

Low-confidence outputs are not failures. They are the expected truthful behavior when the input quality does not support stronger claims.

## Current evidence quality states

- `clear evidence` means enough structured user-entered evidence exists to support a more specific diagnostic statement.
- `weak evidence` means some supporting evidence exists, but the system should still use provisional language.
- `missing evidence` means the product should surface what needs to be added or validated before making stronger claims.
- `contradictory evidence` means declared inputs and supporting evidence point in different directions, so confidence must be reduced.
