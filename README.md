# AI Divination (Single Source of Truth)

This repo is the consolidated, **local-only** single source of truth for Jeffery's divination system.

## Structure
- `zoho-creator/apps/`
  - `AI易經.ds` — main divination app (I Ching + Tarot + logs + purchases)
  - `會員中心.ds` — membership / support / CRM bridge
  - `DataCleaningTools.ds` — contact/data cleaning batch tools
  - `MembershipHub_V2.ds` — legacy clean reference
- `docs/`
  - `AI-Divination_MASTER.md` — product + architecture spec distilled from all sources
- `cursor-rules/`
  - Cursor rules and technical notes (copied from backup)
- `archives/`
  - Manifests and snapshots of prior downloads (for traceability)

## Notes
- Cloud/GitHub/Drive sources are treated as deprecated. This repo is the canonical development source going forward.
- Secrets must NOT be committed into DS/MD files. Use Zoho Connections / environment variables.
