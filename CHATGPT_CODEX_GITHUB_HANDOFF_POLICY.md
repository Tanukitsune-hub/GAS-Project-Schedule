# ChatGPT–Codex GitHub Handoff Policy

最終更新日: 2026-07-28  
状態: Adopted  
対象Repository: `Tanukitsune-hub/GAS-Project-Schedule`

## 1. 目的

ChatGPTとCodexの間で、長い作業指示、監査結果、修正方針および実装結果を会話履歴だけに依存せず、GitHubを介して正確に引き継ぐ。

GitHubを、ChatGPTからCodexへの作業指示と、CodexからChatGPTへの実装結果・証跡の共通引継ぎ媒体として使用する。

## 2. 必須運用

このProjectでChatGPTがCodex向けの作業指示書を生成する場合、毎回、次をすべて実施する。

1. 完成した指示書を、回答前にこのRepositoryの`instructions/`配下へ保存する。
2. 長い指示は、1つのindexと番号付きの分割ファイルへ分けてよい。Codexが最初に読むentry pointをindexへ明記する。
3. 保存先branch、ファイルpathおよびGitHub上の参照URLを確認する。
4. ChatGPTの回答には、Codexのチャット欄へそのまま貼り付けられる短い指示文を必ず付ける。
5. 短い指示文には、少なくとも次を含める。
   - GitHub上の完全な参照URL
   - Repository名
   - 対象branch
   - 指示書のRepository内path
   - 指示書を唯一の作業指示として読む旨
   - 必須のstatus gateおよび禁止事項
6. 保存後にGitHubからファイルを再取得し、参照URL、内容およびbranchを検証する。
7. GitHub保存に失敗した場合、保存済みと報告してはならない。未保存であることと失敗理由を明示し、GitHub保存が完了するまで正式な引継ぎ完了とは扱わない。

## 3. 標準フロー

```text
ChatGPTがGitHub正本を読む
↓
ChatGPTが監査・分析を行う
↓
必要なCodex作業指示書を作成する
↓
instructions/へcommitする
↓
GitHubから保存内容を再取得して検証する
↓
参照URL付きの短いCodex貼付文を出力する
↓
CodexがGitHub上の指示書を読む
↓
Codexが実装・test・report・release証跡をGitHubへ保存する
↓
ChatGPTがGitHub上の確定成果物を再監査する
```

## 4. ファイル配置と命名

原則として次へ保存する。

```text
instructions/<Project_or_System>_<Version_or_Round>_<Purpose>_<YYYY-MM-DD>.md
```

長文を分割する場合は次の構成を使用する。

```text
instructions/<Instruction_Name>.md
instructions/<Instruction_Name>/
  01_*.md
  02_*.md
  ...
```

親ファイルをindex兼entry pointとし、読む順番と全ファイルへの相対linkを記載する。

## 5. 正本と役割

- GitHub: ChatGPTとCodexが共有する唯一の案件・開発正本
- ChatGPT: 正本を読み、監査し、次回作業指示をGitHubへ保存する
- Codex: GitHub上の指示を実行し、source、test、report、releaseおよび証跡をGitHubへ戻す
- 会話欄: GitHub上の正本を参照するための短い起動指示と結果要約を扱う

会話欄だけに存在し、GitHubへ保存されていない長い指示書は正式な作業指示として扱わない。

## 6. 指示書に含める基本項目

必要性に応じて、次を含める。

- Goal
- Context
- Constraints
- Target repository / branch / commit
- Target files
- Implementation steps
- Test and verification
- Git and release procedure
- Status gate
- Prohibited actions
- Required output format
- Not executed items
- Secret and personal information guardrails

## 7. 情報管理

指示書、貼付文、test、reportおよびcommitへ次を保存しない。

- API key、password、token
- Authorization header、Cookie、private key
- 個人情報
- 会社の未公表情報
- 実メール本文、添付資料、実AI request／response全文
- 実Spreadsheet ID、Calendar ID、Gmail Message ID、Thread ID、内部URL
- local `.clasp.json`その他の環境固有秘密情報

## 8. 変更管理

- 会話中の案を自動的に正本へ採用しない。
- Repository ownerが明示的に確定した方針だけを正本へ反映する。
- 過去の指示書はhistorical evidenceとして保持し、原則として上書きしない。
- 新しい指示書が旧指示を置換する場合、対象version、対象commit、置換関係を明記する。
- force push、reset、clean、unrelated revertにより証跡を消さない。

## 9. 完了条件

Codex向け指示書の作成は、次のすべてを満たした時点で完了とする。

```text
GitHubへの保存: 完了
保存commit: 確定
GitHubからの再取得: PASS
参照URL: 確認済み
Codex貼付文: 出力済み
秘密情報scan: 問題なし
```

## 10. Local clasp validation and company handoff gate

- GitHub Actions is a required non-Google validation lane. It must run locked
  JSON/YAML checks, Apps Script static validation, current regression suites,
  and repository verifiers without Google authentication, `clasp`, credential,
  OAuth, or secret access.
- `clasp` may be used only from a self PC and only for a personal, synthetic,
  non-company development Apps Script project. The local binding, target
  declaration, OAuth state, IDs, and pull-back files are ignored and must not
  be committed.
- A guarded local clasp report must separately state non-Google validation,
  target guard, push, pull-back parity, and safe runtime dry-run. A skipped,
  blocked, or unconfigured Google lane is `NOT_EXECUTED`/blocked, never PASS.
- Company PCs must use only a separately authorized manual reflection,
  authorization review, and minimal smoke procedure. No company-PC clasp,
  deployment, automatic trigger enablement, or real Workspace action is
  implied by local validation.
- Every handoff must state the local/CI status, clasp version when invoked,
  push/pull/runtime status, remaining company work, review focus, and whether
  the maximum status permits only reassessment rather than an automatic
  company handoff.
