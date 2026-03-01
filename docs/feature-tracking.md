# Feature Tracking (Refocus)

The markdown checklist has been replaced by a machine-readable tracker for validation and UI reporting.

Primary source of truth
- `docs/feature-tracking/refocus.json`

Validation command
- `pnpm refocus:verify`

Optional internal progress page
- `/platform/refocus-status`

Notes
- The JSON tracker is verified by `scripts/verify-refocus.ts`.
- Mark items `Done` only when the required strings/checks exist in the referenced files.
