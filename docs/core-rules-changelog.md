# Core Rules Changelog

This file records behavioral changes to the bounded Core Rules in root `AGENTS.md` and this repository's selective adoption history. It allows later updates from `dev-repo-template` to be evaluated without overwriting repository-specific rules.

Wording-only changes with no behavioral effect may be omitted.

## Local adoption — 2026-08-12

- Adopted `dev-repo-template` Core Rules v1.2 and Repository-Specific Rules schema v1.1.
- Preserved the existing repository and documentation structure.
- Activated a verified repository profile for the Google Workspace Personal Work OS.
- Reduced `implementation/GoogleSpreadsheet/AGENTS.md` to scoped Apps Script rules and removed unrelated dashboard/HTML guidance and mandatory execution-metrics reporting.
- Retained `docs/handoffs/AGENTS.md` as the closest instruction file for handoff records.
- Added a reusable handoff template and repository-appropriate pull-request template.

## 1.2 — 2026-08-12

- Required explicit, scoped authorization before releases, deployments, destructive migrations, live-data mutation, secret rotation, or writes to live external systems.
- Prohibited creation or restoration of repository-scoped custom-agent definitions and model-routing configuration unless explicitly requested and documented.
- Added the assigned zero-padded 4-digit Work ID convention for durable repository instructions and completion reports.
- Required behavioral Core changes to be recorded in this changelog.

## 1.1 — 2026-08-12

- Reframed root `AGENTS.md` as a compact working contract and repository map.
- Added explicit nested-instruction and `AGENTS.override.md` guidance.
- Added evidence-versus-instruction separation for source files, comments, issues, logs, tool output, and external material.
- Added repository-currentness checks without automatic reset, merge, or loss of local work.
- Strengthened security, validation evidence, blocker classification, and behavior-oriented code-review rules.
- Added guidance freshness checks against executable repository configuration.

## 1.0 — 2026-08-11

- Established the initial cross-repository baseline for authority, outcome and scope, source of truth, change safety, validation, delegation, structured handoffs, Git/GitHub/CI, completion, communication, and Core-versus-repository-specific separation.
