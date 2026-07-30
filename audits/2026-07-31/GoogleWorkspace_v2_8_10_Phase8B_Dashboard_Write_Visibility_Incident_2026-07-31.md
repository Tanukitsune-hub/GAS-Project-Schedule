# v2.8.10 Phase 8B Dashboard write-visibility incident / reproduction note

Incident ID: `PHASE8B-DASHBOARD-WRITE-VISIBILITY-01`  
Source-stage gate: `PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY`  
Code candidate: `2.8.10-prepilot`  
Schema / AI Schema / Migration: `2.6` / `2.0` / `3`  
Fixed transfer: `PENDING_T10`  
Repository-performed real Workspace activity: `NOT_EXECUTED`

## Safe observation

After the historical v2.8.9 files were manually introduced outside this
repository execution, an isolated non-sensitive Sandbox that had completed
S00–S80 still stopped before S90/S99. Read-only evidence reported only the
closed Dashboard number-format reason/subreason and a noncanonical count of
51, equal to the exact 17×3 system block. All other Dashboard conflict counts
were zero.

This record intentionally stores no Spreadsheet ID/URL, account or user
identity, cell/range address, value, formula, note, actual locale, actual
number-format string, Gmail/Calendar content or identifier, credential,
bookmark, screenshot, or business data.

## Confirmed repository defect

The immutable v2.8.9 normalizer applies the deterministic format and then
performs its strict reread in the same Apps Script execution without first
calling `SpreadsheetApp.flush()` or reacquiring a fresh Range. Apps Script may
buffer Spreadsheet writes, while the historical fake runtime applied writes
immediately. The old fixture therefore could not expose a stale post-write
read.

The bounded local reproduction contract queues the format write and keeps the
old read state visible until an explicit flush. Under that contract, the
historical no-flush sequence still observes 51 noncanonical cells. This
reproduction is local fake-runtime evidence only; it is not a real Workspace
rerun or a test-result claim for the not-yet-complete A10 chain.

## Remaining operational uncertainty

The manual company-PC patch did not provide a product-enforced proof that the
loaded Config, Setup, and Dashboard modules were one compatible version.
Therefore the safe observation alone cannot distinguish:

- a fully loaded v2.8.9 path whose queued write was not visible to the strict
  reread; and
- a partial module replacement that left an S90-critical module stale.

The v2.8.10 product contract addresses both causes. Config, Setup, and
Dashboard must expose one matching contract or fail as
`E_MODULE_VERSION_SKEW` before a write. A permitted format write must be
followed by one flush, a freshly acquired exact Range, and strict verification
of all 51 cells. Flush unavailable/failure or a noncanonical reread fails as
`E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`.

## Safe evidence and stop rules

Setup may retain only a closed normalization state, write/flush/postcondition
Booleans, checked-cell count, and noncanonical count. It must not emit any
actual format, locale, content, address, URL, ID, or identity.

Do not manually repair Dashboard formats or protections, bypass module skew,
rerun Setup/Diagnostic/Dashboard refresh, import Apps Script, authorize OAuth,
touch Gmail/Calendar, deploy, run `clasp push`, enable Automation/triggers, or
configure a real Provider based on this note. A10/B10/T10/E10 and detached
fresh-clone verification must complete before the gate can be reconsidered.
Even a later `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` would mean controlled
carriage only, not Phase 8B PASS, Phase 8C GO, production ready, or pilot ready.
