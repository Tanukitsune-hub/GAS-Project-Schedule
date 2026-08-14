# Current Verification Matrix - 2.8.18-prepilot

Gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

| Requirement | Integrated mechanism | Primary evidence | Boundary |
|---|---|---|---|
| Task authority and recovery | PREPARED/COMMITTED ledger and quarantine | authority suites | Local fake runtime |
| Review/CAS and idempotency | durable state and write-time metadata | Review/Worker suites | Local fake runtime |
| Gmail decoding and exact selection | strict dual representation and labels | Gmail suites | Local; no Work 0030 Gmail runtime |
| Gemini callable surface | no-argument menu/function-selector entrypoints | Work 0029 runtime suite | No Apps Script invocation |
| Actual Automation-OFF guard | canonical runtime trigger/property state | Work 0029 runtime suite | No trigger mutation |
| Provider response grammar | strict `thought* model_output`, opaque thought metadata | Work 0030 parser suite | Fake transport only |
| Provider schema and generation bound | documented subset, low thinking, 4096 cap | Provider suite | Fake transport only |
| Source/release identity | A18/B18 direct-child lineage, manifests, checksums | release verifiers/local gate | Local/fresh clone/CI |
| Gemini transport endpoint | exact `/v1beta/interactions` creation endpoint | Work 0031 endpoint suite | Fake transport only |
| Secret and local-state exclusion | tracked path/content scan | secret-scan suites | Local/CI |

Historical A14/B14, A15/B15, and A17/B17 identities remain immutable. Local and CI
evidence does not establish native Google, OAuth, real Provider, production, or
pilot acceptance. Work 0031 does not configure or inspect a real API key.
