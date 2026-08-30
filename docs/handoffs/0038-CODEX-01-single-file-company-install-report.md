# Work 0038 / Dispatch 0038-CODEX-01 — Completion Report

WORK_ID: `0038`

DISPATCH_ID: `0038-CODEX-01`

BALL: `CHATGPT`

STATUS: `RETURNED`

## Outcome

`COMPLETE — BLOCKER NONE`

The company manual-install path now uses exactly two paste actions: one
generated application bundle into `Code.gs`, followed by the validated
`appsscript.json` manifest. The modular Phase 8C source remains unchanged and
canonical.

## Git and delivery refs

- Implementation branch: `codex/0038-single-file-company-install`
- Implementation commit: `fc6db16ed4e20156799c11806c77f147b5f5f77a`
- Delivery branch: `delivery/0038-company-live-bundle`
- Delivery commit: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`
- No pull request was created; both required branches are pushed to GitHub.

## Copy-ready artifacts

Generated source artifact:

`implementation/GoogleSpreadsheet/release/work-0038-single-file-company-install/`

Delivery artifact:

`QUICK_INSTALL/Code.gs`
`QUICK_INSTALL/appsscript.json`
`QUICK_INSTALL/BUNDLE_PROVENANCE.json`
`QUICK_INSTALL/CHECKSUMS.sha256`

The delivery branch also retains the original `apps-script/` modular payload,
legacy `CHECKSUMS.sha256`, `DEPLOYMENT_MANIFEST.md`, and
`PHASE8C_SANDBOX_GUIDE.md` unchanged for provenance and optional engineering
use.

## Acceptance evidence

### Manual install count

The first path in both `README_FIRST.md` and
`COMPANY_LIVE_DEPLOYMENT_GUIDE.md` is:

1. paste `QUICK_INSTALL/Code.gs` into the default `Code.gs`;
2. reveal `appsscript.json` and paste `QUICK_INSTALL/appsscript.json` into it.

The guides explicitly prohibit recreating or pasting 22 separate `.gs` files.
`clasp` is documented only as an optional engineering path after the manual
path.

### Source and manifest identity

- Input: validated Phase 8C package
  `v2.8.25-prepilot-phase8c`, source commit
  `8364a2deb091d52ef322c9aa6cb67098f721d93e`.
- Source count: 22 `.gs` files, in explicit order `00_Config.gs` through
  `20_GeminiProvider.gs`, followed by `Menu.gs`.
- The generated provenance records each input byte length and SHA-256 and
  places each source byte sequence exactly once between deterministic markers.
- Generated and delivered `Code.gs`: 1,190,034 bytes,
  SHA-256 `355f07522b55834353d92f69947524e356c07189e8a2ebf27ec8113709c147ce`.
- Generated and delivered `appsscript.json`: 868 bytes,
  SHA-256 `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`.
- `BUNDLE_PROVENANCE.json` SHA-256:
  `60ef97190874f70bdbf9ff05a2a959177712d82439cd69762b3906ff79dbbec1`.
- `CHECKSUMS.sha256` SHA-256:
  `38562ba40c7dbbd416ed272d8de62941c0e43c4737209193089d8c53e24d1c15`.
- The original modular `apps-script/` tree remains
  `864cb41ab556d9f2914e63acf49ff4926b169d00`; the delivery quick-install
  tree is `da75892220a1eb3f7148a58dec52df5237fd7d12`.

### Bundle-specific validation

The new focused test validates the delivered design against the actual
combined artifact, not only the modular source. It proved:

- complete 22-file source inventory and exact byte/hash parity;
- one occurrence and explicit order for every source section;
- byte-identical manifest;
- combined-file syntax and VM load;
- non-live `WorkOsMigrations.getVersionState()` and Gemini synthetic guard
  smoke calls, plus exported automation entrypoint presence;
- two consecutive builds with byte-identical artifact and metadata output.

## Validation record

Commands and observed results:

| Command | Result |
|---|---|
| `node implementation/GoogleSpreadsheet/tools/build_work_0038_single_file_company_install.js` | PASS; 22 sources, artifact and hashes emitted |
| `node implementation/GoogleSpreadsheet/tests/work_0038_single_file_company_install_test.js` | PASS; parity, manifest, syntax, VM load, smoke, reproducibility |
| `Get-Content -Raw .../Code.gs \| node --check` | PASS; stdin syntax check for `.gs` extension |
| `node implementation/GoogleSpreadsheet/tools/validate_apps_script_v2.js` | PASS; 11/11 |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run verify:local` | PASS; 11/11, 87 suites, missing 0, extra 0 |
| `pnpm run verify:secret-scan` | PASS; zero secret/local-state hits |
| delivery quick-install secret scan | PASS; zero credential/private-ID/local-state hits |
| `git diff --check` | PASS |

All validation was local and non-Google. No company Apps Script paste, Setup,
OAuth, Gmail, Calendar, trigger, Gemini/provider request, credential handling,
or live runtime operation was executed by this dispatch. Those later company
actions remain user-controlled and are not claimed as PASS here.

## Issue classification

- BLOCKER: none.
- Non-blocking limitation: company-PC paste/runtime acceptance remains
  `NOT EXECUTED` by scope.
- Optional improvement: the user may later perform the bounded company setup
  and live-operation handoff under the separate Work 0038 company instructions.
