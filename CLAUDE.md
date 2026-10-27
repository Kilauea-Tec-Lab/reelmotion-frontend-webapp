# CLAUDE.md

## Secrets
- Never put a secret in `VITE_*` / `NEXT_PUBLIC_*` vars or in any tracked file: those ship to the browser or to git (a leaked GCP key in a committed `.env` cost ~£800 in Oct 2026). Secrets live only in server env (Forge `.env`, VM env files, Cloud Run env).
- No new service account JSON keys; on GCP use the attached service account (metadata server). Key creation is blocked by an IAM deny policy.
- gitleaks runs in CI on every push and as a local pre-commit hook.
