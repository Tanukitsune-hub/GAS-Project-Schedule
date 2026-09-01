# Work 0038 — Frozen Gemini Completed Baseline

BASELINE_ID: `0038-GEMINI-COMPLETED`

STATUS: `FROZEN`

Created for successor Work: `0039`

## Purpose

This record preserves the completed Gemini-only system and its company-transfer package as independently recoverable baselines before Work 0039 adds explicit Gemini / OpenAI provider selection.

The archive refs below are recovery and comparison refs. They are not development branches and must not be moved, rebased, force-pushed, or reused for later work.

## Frozen refs

| Role | Archive branch | Exact commit | Exact tree |
|---|---|---|---|
| Completed repository/source baseline | `archive/0038-gemini-source-baseline` | `272612831c4a46e45fdf166c65e3075ffee7dfef` | `9de9180e3c24891479bc91dbfbfbdd0223ceae21` |
| Completed company delivery baseline, including txt transport copies | `archive/0038-gemini-company-delivery` | `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b` | `dbe81a876e45dd4a60f04d25ee36e0d6482935a6` |

## Preserved product state

- Code version: `2.8.25-prepilot`.
- Schema version: `2.6`.
- AI Schema version: `2.0`.
- Migration version: `3`.
- Canonical authored source remains modular under `implementation/GoogleSpreadsheet/apps-script-v2/`.
- The validated production-shaped Gemini runtime remains preserved under `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/`.
- The Work 0038 derived single-file install artifact remains separate from canonical source.
- The company delivery baseline retains the modular payload and the two-paste `QUICK_INSTALL` path.
- `QUICK_INSTALL/Code.txt` and `QUICK_INSTALL/appsscript.txt` remain transport copies of the validated `.gs` and `.json` files.
- Gemini remains the only production provider in this frozen baseline.
- Automation defaults to OFF; these refs do not claim that company live runtime acceptance was executed.

## Recovery use

To inspect or restore the completed repository baseline, use the exact source archive branch or commit above. To retrieve the completed company installation package, use the exact delivery archive branch or commit above.

A recovery must be performed through a new branch and reviewed diff. Do not develop directly on either archive branch and do not repoint either archive ref.

## Integrity policy

- Work 0039 and later work must not modify the archive refs.
- New OpenAI/provider-selection source, releases, bundles, tests, and documentation must use new versioned paths or successor branches.
- The Work 0038 Phase 8C release, Work 0038 delivery package, checksums, provenance, and accepted evidence remain historical records.
- If a baseline correction is ever required, create a new explicitly named archive ref and a new record; never rewrite this baseline.
- Credentials, account identifiers, company message content, private URLs, and runtime state are excluded from this baseline and must remain outside GitHub.

## Successor boundary

Work 0039 may add an OpenAI provider and controlled provider selection, but it must preserve this Gemini baseline as the immediate rollback path. No Work 0039 implementation success or failure changes the acceptance status of Work 0038.