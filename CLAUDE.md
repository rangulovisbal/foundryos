# CLAUDE.md

Read `AGENTS.md` in this same folder first. It is the current orientation file
for repo identity, product status, blockers, and how to run checks.

Quick facts:

- Canonical repo: `~/ai-growth-os`
- GitHub remote: `https://github.com/rangulovisbal/foundryos.git`
- Branch: `main`
- Ignore `~/Downloads/foundryos-main`
- Current core diagnosis path: `/api/diagnosis`
- Anthropic is optional at runtime; if `ANTHROPIC_API_KEY` is empty, FoundryOS
  uses `foundryos-deterministic-fallback` and still creates the compatibility
  diagnostic result used by the 30-day plan.
