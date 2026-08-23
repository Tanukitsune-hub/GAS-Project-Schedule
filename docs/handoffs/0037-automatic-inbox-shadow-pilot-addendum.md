# Work 0037 Automatic Inbox Shadow Pilot — Placement and Start-Boundary Addendum

WORK_ID: `0037`

This addendum is mandatory together with `docs/handoffs/0037-automatic-inbox-shadow-pilot-instruction.md`.

## Live Automation-OFF evidence

After the user stopped the historical Code `2.8.22-prepilot` label-gated pilot, the user immediately ran the real Automation status surface on the existing personal target and reported the following bounded safe state:

- status: `CONSISTENT`
- enabled: `false`
- desired enabled: `false`
- configured default enabled: `false`
- trigger count: `0`
- owned clock trigger count: `0`
- invalid event trigger count: `0`
- stored trigger ID present: `false`
- canonical trigger present: `false`
- duplicate trigger count: `0`
- interval: `5` minutes
- watermark present: `true`
- last-run marker present: `true`
- prerequisite ready: `true`
- real provider connection during status read: `NOT_EXECUTED`
- provider readiness: `GEMINI / gemini-3.6-flash / READY`
- OAuth: `READY`
- formal Gmail labels: `7/7 READY`
- dedicated Calendar: `READY`
- external request performed by status read: `false`
- Google Workspace trigger list: real read

The watermark and last-run markers are historical scan/run evidence and are not trigger residue.

This exact OFF state satisfies the placement prerequisite for the revised Code `2.8.23-prepilot` candidate.

## Mandatory no-retroactive-backlog boundary

The revised automatic Inbox pilot must **not** retroactively admit ordinary Inbox messages that predate the user's first explicit enable of the Code `2.8.23-prepilot` automatic pilot.

The existing overlap/watermark/page-token model is retained for reliability, but overlap must never broaden admission earlier than the automatic-pilot start boundary.

Implement a durable, non-secret, bounded automatic-pilot start marker (for example a dedicated Script Property such as `WORK_OS_V2_AUTOMATIC_INBOX_PILOT_STARTED_AT`, or an equivalently explicit contract). Requirements:

- the first successful explicit enable of the Code `2.8.23-prepilot` automatic Inbox pilot establishes the start boundary using the trusted runtime clock;
- a candidate Message whose provider timestamp is earlier than that boundary is never admitted, even if Gmail search overlap returns it;
- the start marker must not be inferred from the historical Work 0036/2.8.22 watermark or last-run markers;
- a failed/refused enable must not leave a misleading active-pilot start state;
- disabling Automation does not silently broaden the start boundary or make historical mail eligible;
- the boundary is safe to inspect as a boolean/presence/status signal, but user-facing diagnostics must not expose message IDs, subjects, senders, bodies, credentials, private URLs, or raw provider output;
- deterministic tests must prove a pre-start unlabeled Inbox Message is rejected and a post-start eligible unlabeled Inbox Message is admitted;
- tests must also prove overlap cannot bypass the start boundary.

This boundary exists specifically to prevent enabling 2.8.23 from immediately sending pre-pilot personal Inbox backlog to Gemini.

## Live target placement authorization

After all revised 2.8.23 implementation work is complete, and only after:

1. focused automatic-Inbox tests pass;
2. full deterministic inventory passes with missing `0` / extra `0`;
3. complete local validation gate passes;
4. Apps Script static validation passes;
5. 2.8.23 Phase 8B/8C release verifiers pass;
6. lineage and frozen 2.8.20/2.8.21/2.8.22 preservation pass;
7. secret/local-state scan reports zero hits;
8. `git diff --check` passes;
9. the exact pre-placement head is pushed; and
10. exact-head GitHub CI passes,

Codex is authorized to perform exactly one bounded placement tranche on the **same existing personal target only**:

- one guarded Phase 8C Code `2.8.23-prepilot` source update/push;
- then one independent isolated pull-back from that same target;
- then one exact byte/hash/inventory parity comparison.

The authorized placement is source replacement only. Automation must remain OFF throughout placement.

If a pre-operation eligibility check fails before a target write begins, Codex may repair local/repository state, re-run local/CI gates, and re-stage. Once an actual target push attempt begins, no second push attempt is authorized without a new ChatGPT addendum.

## Still prohibited during Codex work

Codex must not:

- enable Automation;
- create/delete/repair time triggers through Apps Script runtime functions;
- run the user-controlled automatic Inbox pilot;
- process Gmail Messages;
- invoke Gemini;
- mutate Task/Review/Calendar business state;
- run Setup, readiness, Dashboard, or diagnostic Apps Script functions;
- retry Dead Letters;
- inspect credential values;
- send/reply/forward/archive/delete/trash email;
- access an alternate personal target;
- access any company PC, company account, company Gmail, company Calendar, company Workspace, or company data;
- merge PR `#52`.

## Required final evidence

The revised `docs/handoffs/0037-report.md` must clearly distinguish the historical 2.8.22 label-gated completion from the final 2.8.23 automatic-Inbox candidate and record:

- final source/release/report commits;
- new source mode and admission contract;
- automatic-pilot start-boundary implementation and negative tests;
- focused/full test results;
- exact-head CI;
- one placement attempt result;
- one pull-back result;
- parity result;
- frozen-release preservation;
- Automation remained OFF;
- no user pilot/runtime Gmail/Gemini/Task/Review/Calendar action was executed by Codex;
- BLOCKER status.

PR `#52` remains Draft/Open/Unmerged until ChatGPT independently reviews the final candidate and the user later completes the controlled automatic-Inbox pilot.
