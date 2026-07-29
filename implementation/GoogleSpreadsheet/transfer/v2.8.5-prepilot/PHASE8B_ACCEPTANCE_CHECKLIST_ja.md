# Phase 8B Sandbox 受入チェックリスト

状態: `PENDING_R5_FINAL_HEAD_VERIFICATION`（P9 の remote/fresh-clone 検証待ち）

各行を人が一件ずつ確認し、`RESULTS_TEMPLATE_ja.md` に `PASS`、`FAIL`、又は
`NOT EXECUTED` を記録してください。local test の PASS を実 Google Workspace
の PASS として転記してはいけません。

## 開始前

- [ ] 最終 R5 audit report の status が `READY_FOR_PHASE8B_SANDBOX_TRANSFER` である。
- [ ] `TRANSFER_MANIFEST.md` の Source、Release、固定 audit ref、payload hash、
      package-tree hash を独立に照合した。
- [ ] `CHECKSUMS.sha256` の全 26 record と package の 27 files を照合した。
- [ ] `COPY_ALLOWLIST.txt` 以外をコピーしていない。
- [ ] `TEST_MODE=true` と Automation OFF を確認した。
- [ ] 新規・空の Sandbox Spreadsheet を使用する。既存業務 Sheet は対象外である。
- [ ] Mock AI、synthetic data、承認済み専用 test sub-calendar だけを使用する。
- [ ] OAuth、実 Provider credential、実 Gmail、既存 Calendar、deployment、
      `clasp push`、time-driven trigger を使わないことを確認した。

## 構造と authority

- [ ] Workbook は 11 Sheets、hidden 5 である。
- [ ] `タスク一覧` は 50 columns、Task Authority Ledger は 21 columns である。
- [ ] Task header row 1/2 と Ledger header/visibility/protection は canonical である。
- [ ] 有効な Task は ledger から再構成され、snapshot cell、note、raw row が
      authority fallback に使われない。
- [ ] 無効、欠損、duplicate、orphan の authority は `QUARANTINED`、
      `UNRECOVERABLE`、又は `ORPHANED` として隔離される。
- [ ] multi-row edit で一行が無効でも、正常 authority の peer は ledger の
      canonical projection に復元される。

## Calendar / Outbox（承認済みの専用 test sub-calendar がある場合のみ）

- [ ] authority excluded job は `CANCELLED` となり、Calendar I/O を行わない。
- [ ] 正常 job は external I/O 前に durable Outbox intent を持つ。
- [ ] authority loss / crash recovery の確認は、合成 Task と専用 test Event だけで
      行い、既存 Event を検索・更新・削除しない。
- [ ] foreign / unowned Event の疑いがある場合、delete を行わず即 STOP する。

- [ ] R5 compensation preservation は synthetic のみで確認する。`DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` の target type、deterministic Event ID、`DELETE` / `PENDING` が later forced re-enqueue 後も残り、Task patch が 0 件であることを安全な観測だけで記録する。不明又は foreign / unowned Event の疑いがあれば実行せず STOP する。

## Migration / diagnostics

- [ ] Migration 3 は Schema 2.5 legacy note anchor だけを one-time seed に使う。
- [ ] Setup、Quick Diagnostic、Deep Diagnostic、Migration、edit、Worker、Review、
      Calendar は authority validator を fail-closed で使う。
- [ ] Quick / Deep Diagnostic は read-only として記録される。

## 終了

- [ ] すべての結果を安全な error code、時刻、reviewer、redacted evidence だけで記録した。
- [ ] `FAIL`、不明、scope drift、既存データ検出、又は実データ混入があれば STOP
      checklist に従った。
- [ ] この checklist の完了を Phase 8B PASS、Phase 8C GO、production/pilot ready
      と解釈していない。
