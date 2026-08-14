# Work 0031 Sandbox Quickstart - 2.8.18-prepilot

The package is a `TEST_MODE=true` local candidate with Automation OFF. It
contains 23 `.gs` files and `appsscript.json`; it contains no `.clasp.json`,
credential, key, private URL, or real Workspace identifier.

Machine gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`.

1. Verify the generated manifest, checksums, source commit, and release
   direct-child lineage.
2. Verify the actual Automation state is consistently OFF with zero scheduled
   and clock triggers.
3. Keep real key configuration and all Provider/Gmail/Task/Review/Calendar/
   Apps Script operations outside this Work.
4. If a later Work authorizes validation, use only the exact fictional
   synthetic message and the no-argument entrypoint; do not retry after an
   attempt begins.

The highest permitted Work 0031 status is
`READY_FOR_USER_GEMINI_KEY_CONFIGURATION_AND_ONE_MESSAGE_VALIDATION`.
