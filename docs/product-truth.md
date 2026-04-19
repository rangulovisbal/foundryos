# PRODUCT TRUTH

## What FoundryOS does today

FoundryOS currently turns a saved business profile into a deterministic operating
read for the workspace. Today that includes:

- a workspace-scoped business profile
- deterministic diagnostics from saved profile inputs
- persisted scorecards, risks, opportunities, and next actions
- roadmap, action-plan, asset, and SOP generation built on the saved workspace truth layer
- usage gating, account-state handling, and admin visibility for internal control

The current system is strongest when the profile is complete, specific, and internally
consistent. It is intentionally conservative when those conditions are not met.

## What FoundryOS does not do yet

FoundryOS does not currently:

- read live source-of-truth systems such as CRM, analytics, ads, finance, or support platforms
- verify claims against external integrations in real time
- autonomously understand a company without structured workspace input
- operate as a background agent that makes business decisions or changes systems on its own
- use live billing as the product truth layer

## Deterministic now vs AI-assisted later

The current truth layer is deterministic first.

- Diagnostics are rule-based and derived from the saved workspace profile.
- Confidence is calculated from completeness, consistency, specificity, and evidence quality.
- Contradictions and weak input are supposed to lower certainty instead of being smoothed over.

AI-assisted behavior may be added later for drafting, synthesis, or variant generation, but:

- AI-assisted layers must sit on top of the deterministic truth layer, not replace it.
- AI should not upgrade trust claims beyond what the saved evidence supports.
- Any later AI assistance should inherit the same honesty rule: weak signal should produce weaker claims.

## Trust level the product should claim today

FoundryOS should currently claim:

- deterministic profile-based operating diagnostics
- explainable scores with visible evidence references
- directional planning support grounded in saved workspace context

FoundryOS should not currently claim:

- autonomous business understanding
- live operational truth across external systems
- authoritative certainty when the profile is vague or contradictory

## Current confidence standard

- `high` confidence means the profile is complete, specific, consistent, and supported by meaningful operating evidence.
- `medium` confidence means the profile is usable, but some gaps or ambiguity still limit certainty.
- `low` confidence means the profile is weak, contradictory, or too vague for strong conclusions.

Low-confidence outputs are not failures. They are the expected truthful behavior when the input quality does not support stronger claims.
