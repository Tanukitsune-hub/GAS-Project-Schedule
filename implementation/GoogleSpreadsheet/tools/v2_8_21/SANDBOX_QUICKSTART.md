# Work 0036 Sandbox Quickstart - 2.8.21-prepilot

The package is a `TEST_MODE=true` local candidate with Automation OFF. It
contains 23 `.gs` files and `appsscript.json`; the separately built Phase 8C
payload excludes `99_TestHarness.gs` and contains 22 `.gs` files plus the
manifest. Neither package contains a `.clasp.json`, credential, key, private
URL, or real Workspace identifier.

Machine gate: `READY_FOR_USER_PERSONAL_AUTOMATION_E2E`.

1. Verify the generated manifest, checksums, source commit, and release
   direct-child lineage.
2. Verify the actual Automation state is consistently OFF with zero scheduled
   and clock triggers.
3. Verify the exact synthetic subject/body/query guard and the one-candidate
   bound before any future runtime qualification.
4. Keep real key configuration and all Provider/Gmail/Task/Review/Calendar/
   Apps Script operations outside this Work.
5. If a later Work authorizes validation, use only the exact fictional
   synthetic message and the no-argument entrypoint; do not retry after an
   attempt begins.

The highest permitted Work 0036 status is
`READY_FOR_USER_PERSONAL_AUTOMATION_E2E`.
