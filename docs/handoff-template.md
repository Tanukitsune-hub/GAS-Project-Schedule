# Structured Execution Handoff

Use this template when work will be performed in a separate Codex run, worktree, machine, or agent context and the execution contract should remain durable.

WORK_ID: `<zero-padded 4-digit ID or Not assigned>`

The orchestrator assigns the Work ID. Do not infer, invent, or renumber one from incomplete repository history. When the repository uses durable Work-ID records, use:

- instruction: `docs/handoffs/<WORK-ID>-instruction.md`
- completion report: `docs/handoffs/<WORK-ID>-report.md`

Delete fields that genuinely do not apply. Keep the handoff focused on outcome and constraints rather than prescribing every implementation step.

## Outcome

Describe the usable end state that must exist.

## Already-Decided Design Choices

List decisions that should not be reopened without new material evidence.

## Source of Truth

Identify authoritative repository paths, documents, schemas, branches, issues, or external sources explicitly designated by the user.

## Required Scope

State the work that must be completed.

## Non-Goals

State material adjacent work that must not be included.

## Acceptance Criteria

Use observable, testable, or inspectable conditions.

## Required Validation Evidence

List the checks, runtime evidence, generated artifacts, screenshots, reports, or comparisons needed before completion.

## Write Boundaries

Identify allowed, restricted, generated, or out-of-scope paths when relevant.

## External-Action Authorization

State whether any live Google Workspace, provider, deployment, trigger, OAuth, Cloud, or other external action is authorized. Identify the exact target, operation, account or environment boundary, attempt limit, and prohibited follow-up actions. Use `None` when the task is local or synthetic only.

## Delivery

State branch, commit, pull-request, artifact, or reporting expectations.

## Escalation Conditions

Escalate only when a missing decision, safety or integrity risk, architectural contradiction, unsupported external contract, authorization gap, or validation failure prevents safe completion.

## Completion Report

Report:

- completed outcome;
- material files or components changed;
- validation actually executed and observed;
- external actions actually performed, if any;
- blockers and non-blocking residual issues;
- material limitations on confidence.
