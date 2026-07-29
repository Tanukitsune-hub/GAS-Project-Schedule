# Phase 8B Sandbox 再搬入パッケージ — 日本語導入手順

## この資料の位置づけ

このフォルダは、`v2.8.6-prepilot` の非機密 Phase 8B Sandbox package を
将来の承認済み経路で搬入するための**説明資料**です。実行手順ではありませ
ん。Automation は常に `OFF` です。

このフォルダを作成した時点では、パッケージの生成 gate は
`PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` です。`TRANSFER_MANIFEST.md` に記載
された固定 transfer ref が独立 fresh-clone 検証を通過し、別の evidence-only
記録で `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` が明記されるまで、搬入・
Apps Script import・Setup 実行を行わないでください。

## 搬入許可後にのみ行う事前確認

1. 固定 transfer ref、Source A6、Release B6 を
   `TRANSFER_MANIFEST.md` と照合します。
2. `TRANSFER_CHECKSUMS.sha256` により、この transfer folder 内の全資料
   （checksum file 自身を除く）を確認します。
3. `COPY_ALLOWLIST.txt` の 27 ファイルだけを、同じ相対パスで安全な
   一時保管場所へコピーします。リポジトリ全体、Phase 8C package、
   `.clasp.json`、source/tests/tools はコピーしません。
4. package 内の `CHECKSUMS.sha256` で、コピー済みの全 27 ファイルを照合
   します。不一致が一つでもあれば停止します。
5. `PHASE8B_ACCEPTANCE_CHECKLIST_ja.md`、
   `STOP_AND_ROLLBACK_CHECKLIST_ja.md`、
   `SYNTHETIC_TEST_DATA_SPECIFICATION_ja.md` を読み、
   `RESULTS_TEMPLATE_ja.md` を空のまま準備します。

## 厳守事項

- 実データ、実メール、既存 Calendar、個人情報、未公表情報を使わない。
- OAuth、Provider 設定、deployment、`clasp push`、trigger、Automation を
  有効化しない。
- 失敗した v2.8.5 / P10 環境を手作業で直して再利用しない。
- Task Authority Ledger を手動で hide/protect しない。v2.8.6 Setup が
  S20 で安全かつ冪等に管理します。
- エラー、hash 不一致、想定外の権限表示があれば直ちに停止し、
  `FAILED_SANDBOX_RECOVERY_GUIDE_ja.md` に従います。

この準備は、Phase 8B PASS、Phase 8C GO、production ready、pilot ready を
意味しません。
