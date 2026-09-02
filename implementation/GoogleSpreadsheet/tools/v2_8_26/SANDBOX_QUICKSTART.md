# Work 0039 Sandbox Quickstart - {{PACKAGE}}

This is Code `2.8.26-prepilot`, a `TEST_MODE={{TEST_MODE}}` candidate with Automation OFF. The Phase
8B package contains the full 25-file modular `.gs` payload and
`appsscript.json`; the Phase 8C package excludes `99_TestHarness.gs` and
contains 24 `.gs` files plus the manifest. Neither package contains a
`.clasp.json`, credential, key, private URL, or real Workspace identifier.

Machine gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`.

1. Verify the generated manifest, checksums, source commit, and package
   inventory.
2. Verify the code-owned provider selection property, with absent selection
   resolving to Gemini and no Sheet-driven provider override.
3. Verify provider switching is blocked unless Automation is consistently OFF,
   owned clock triggers are zero, no worker lease is active, and no in-flight or
   retry-pending state exists.
4. Verify OpenAI request fixtures use the direct Responses endpoint,
   `store=false`, no tools/background/stream, and separate credential lookup.
5. Keep company data governance, real credentials, all Provider/Gmail/Task/
   Review/Calendar/Apps Script operations, deployment, and Automation outside
   this Work.

The highest permitted Work 0039 status is
`READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`. OpenAI company runtime remains
blocked while data governance is `NOT_APPROVED_OR_UNKNOWN`.
