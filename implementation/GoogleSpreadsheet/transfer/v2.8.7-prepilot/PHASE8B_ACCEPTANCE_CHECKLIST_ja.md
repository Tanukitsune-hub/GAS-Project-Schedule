# Phase 8B v2.8.7 Sandbox 再搬入 — 受入チェックリスト

- [ ] Transfer self reference、A7、B7、package / transfer checksumsが一致する。
- [ ] `COPY_ALLOWLIST.txt`の27 filesだけが対象で、Phase 8Cは除外されている。
- [ ] Company-PC patch manifestのold/new SHA-256が全対象fileで一致する。
- [ ] `TEST_MODE=true`、Automation `OFF`、time-driven trigger `OFF`を確認する。
- [ ] 実データ、実Gmail、既存Calendar、個人情報、credentials、ID/URLを使わない。
- [ ] S00–S80 complete / S90-S99 incomplete のresume契約を確認する。
- [ ] Gmail label、専用Calendar、Properties、owner edit triggerを複製・削除しない。
- [ ] 失敗時は手動repairをせず、stop/rollback checklistへ進む。

すべての実Workspace項目は、別途実施されるまで`NOT_EXECUTED`である。このchecklistは
Phase 8B PASS、Phase 8C GO、production/pilot readyを宣言しない。
