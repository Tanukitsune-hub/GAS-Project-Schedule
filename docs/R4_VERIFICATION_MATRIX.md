# Current Verification Matrix - 2.8.23-prepilot

Gate: `READY_FOR_USER_AUTOMATIC_INBOX_SHADOW_PILOT`

| Requirement | Integrated mechanism | Primary evidence | Boundary |
|---|---|---|---|
| Task authority and recovery | PREPARED/COMMITTED ledger and quarantine | authority suites | Local fake runtime |
| Review/CAS and idempotency | durable state and write-time metadata | Review/Worker suites | Local fake runtime |
| Gmail decoding and exact selection | strict dual representation and labels | Gmail suites | Local; no Work 0030 Gmail runtime |
| Gemini callable surface | no-argument menu/function-selector entrypoints | Work 0029 runtime suite | No Apps Script invocation |
| Actual Automation-OFF guard | canonical runtime trigger/property state | Work 0029 runtime suite | No trigger mutation |
| Provider response grammar | strict `thought* model_output`, opaque thought metadata | Work 0030 parser suite | Fake transport only |
| Provider schema and generation bound | documented subset, low thinking, 4096 cap | Provider suite | Fake transport only |
| Provider schema compatibility projection | canonical/provider field, enum, and complexity drift tests | Work 0033 schema suite | Synthetic VM only |
| Source/release identity | A21/B21 direct-child lineage, manifests, checksums, historical A20/B20 preservation | release verifiers/local gate | Local/fresh clone/CI |
| Gemini runtime diagnostics | bounded provider error envelope, Message finalization, exact candidate pin | Work 0032 diagnostics suite | Synthetic fakes only |
| Automatic Inbox Personal Shadow Pilot | ordinary eligible Inbox, `手動/除外` Thread-wide veto, category/newsletter/Calendar hard exclusions, start boundary, one-message run | Work 0037 pilot and worker suites | Local fake runtime; user pilot not executed |
| Secret and local-state exclusion | tracked path/content scan | secret-scan suites | Local/CI |

Historical A14/B14, A15/B15, and A17/B17 identities remain immutable. Local and CI
evidence does not establish native Google, OAuth, real Provider, production, or
pilot acceptance. Work 0033 does not configure or inspect a real API key.
