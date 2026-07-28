# 会社PC向け Phase 8B Sandbox 搬入資料

状態: `PENDING_R5_REMOTE_VERIFICATION`

このフォルダは、R5 corrective integration の remote publication と fresh
clone verification が完了した場合に限り有効になる、非機密 Phase 8B
Sandbox package の搬入手順です。現在は準備資料であり、まだ搬入・実行の
承認ではありません。

## 最重要の境界

- 持ち込んでよい候補は
  `implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/` **のみ**です。
- `v2.8.5-prepilot-phase8c/`、リポジトリ全体、source、tests、tools、過去の
  release、instructions、audit 作業ツリーを持ち込んではいけません。
- `TEST_MODE=true` と Automation OFF を維持します。
- 会社の承認済み搬入経路だけを使います。USB、Drive、メール、GitHub 等の
  経路が許可されているとは推測しません。
- この資料は、Phase 8B PASS、Phase 8C GO、production ready、pilot ready、
  OAuth consent、deployment、`clasp push`、Automation/trigger 有効化を許可
  しません。

## 読む順番

1. `TRANSFER_MANIFEST.md` — SHA、inventory、許可範囲を照合する。
2. `COPY_ALLOWLIST.txt` — コピー対象を一つずつ確認する。
3. `STOP_AND_ROLLBACK_CHECKLIST_ja.md` — 開始前に停止条件を確認する。
4. `SYNTHETIC_TEST_DATA_SPECIFICATION_ja.md` — 合成・非機密データだけを準備する。
5. `PHASE8B_ACCEPTANCE_CHECKLIST_ja.md` — Sandbox の手動確認を一件ずつ実施する。
6. `RESULTS_TEMPLATE_ja.md` — PASS / FAIL / NOT EXECUTED を安全な証跡だけで記録する。

## 実行前の必須条件

- R5 final remote verification report が `READY_FOR_PHASE8B_SANDBOX_TRANSFER`
  を明記していること。
- package の `CHECKSUMS.sha256`、manifest、payload hash、transfer manifest を
  独立に照合していること。
- 新規・空の Google Spreadsheet と、承認済みの専用テスト用 sub-calendar が
  用意されていること。既存の業務 Spreadsheet や業務 Calendar は使いません。
- Mock AI と、自分宛ての完全 synthetic / 非機密入力だけを使うこと。
- 実 Provider credential、実案件、個人情報、未公表情報、実メール本文、実
  Workspace ID/URL を使用または記録しないこと。

不明な承認、scope、既存データ、Calendar 対象、package SHA、又は挙動が一つ
でもある場合は、操作せず `STOP` してください。
