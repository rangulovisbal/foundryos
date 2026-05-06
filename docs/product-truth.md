# Product Truth

## What FoundryOS Is

FoundryOS is currently a founder-assisted marketing diagnosis and 30-day marketing planning product for early-stage small businesses.

The first pilot is free, assisted, and manually reviewed. It is a design-partner pilot used to validate usefulness, clarity, output quality, and the real workflow before the product is positioned as self-serve SaaS.

## Primary Promise

The primary promise is:

> Turn founder-entered marketing context into a clear diagnosis and an actionable 30-day marketing plan.

Assets and marketing routines support that plan, but they are not the main promise.

## First ICP

The first ICP is early-stage small businesses and founder-led projects with a real offer but no internal marketing team.

Prioritize creators, service businesses, boutique projects, local/product-led businesses, and early founders who need marketing clarity. Do not lock the whole company into academies, SaaS, restaurants, or one vertical until 3-5 comparable pilots reveal the best wedge.

## What FoundryOS Does Today

FoundryOS currently includes:

- workspace-scoped business and marketing profile
- founder-entered evidence for website, channels, positioning, CTA, pricing, acquisition, sales process, goals, bottlenecks, and notes
- deterministic marketing diagnostics from saved profile inputs
- persisted scores, risks, bottlenecks, opportunities, next actions, and evidence cards
- a 30-day marketing plan derived from the diagnosis
- supporting priority lists, assets, and customer-facing marketing routines
- usage gating, account-state handling, admin visibility, feedback capture, support requests, and deletion request logging

The system is strongest when the profile is complete, specific, internally consistent, and supported by concrete evidence entered by the founder or operator. It should be conservative when the input is weak.

## What FoundryOS Does Not Do Yet

FoundryOS does not currently:

- read live source-of-truth systems such as CRM, analytics, ads, finance, or support platforms
- verify claims against external integrations in real time
- crawl, scrape, or independently inspect website or channel URLs
- autonomously understand a company without structured workspace input
- operate as a background agent that makes decisions or changes systems
- use Stripe as billing/provisioning source of truth
- provide public self-serve paid provisioning
- execute account/workspace deletion automatically from the customer UI

## Deterministic Now, AI-Assisted Later

The current truth layer is deterministic first.

- Diagnostics are rule-based and derived from the saved workspace profile.
- Evidence-backed currently means the user provided structured supporting evidence; it does not mean FoundryOS independently verified that evidence.
- Confidence is calculated from completeness, consistency, specificity, visible evidence, conversion evidence, acquisition evidence, and evidence quality.
- Contradictions and weak input lower certainty.
- Diagnostics must separate founder-stated inputs, user-entered evidence, missing evidence, and contradictory evidence.

AI-assisted behavior may be added later for drafting, synthesis, variant generation, and language polish, but it must sit on top of the deterministic truth layer and never upgrade trust beyond the saved evidence.

## Pilot Quality Bar

An output is good enough when the customer says:

> This reflects my situation, gives me clarity, and I can act on at least one part this week.

Outputs must be specific, evidence-linked, not overconfident, and not feel like generic ChatGPT text.

## Language

For pilot, FoundryOS supports English and Spanish. The user/workspace chooses one primary language, and the experience should follow that language as much as currently implemented. Spanish should be treated as first-class because the first real pilots may be in Spain.

## Current Confidence Standard

- `high` confidence means the profile is complete, specific, consistent, and supported by meaningful marketing evidence.
- `medium` confidence means the profile is usable, but gaps, ambiguity, or unverified evidence still limit certainty.
- `low` confidence means the profile is weak, contradictory, too vague, or missing evidence needed for strong conclusions.

Low-confidence outputs are not failures. They are the expected truthful behavior when the input quality does not support stronger claims.
