## Target files

対象は必要なものだけとし、無関係なrefactorを行わないでください。

### Canonical documents

```text
PROJECT_CONTEXT.md
MASTER_PLAN.md
DECISIONS.md
CURRENT_STATUS.md
README.md
docs/TASK_AUTHORITY_PROTOCOL.md
docs/visualizations/index.html
docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html
```

### Implementation

```text
implementation/GoogleSpreadsheet/V2_IMPLEMENTATION_SPEC.md
implementation/GoogleSpreadsheet/V2_CODEX_IMPLEMENTATION_PLAN.md
implementation/GoogleSpreadsheet/apps-script-v2/
implementation/GoogleSpreadsheet/apps-script-v2/README.md
implementation/GoogleSpreadsheet/apps-script-v2/CHANGELOG.md
implementation/GoogleSpreadsheet/tests/
implementation/GoogleSpreadsheet/tools/
implementation/GoogleSpreadsheet/release/
implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
```

### 新規作成候補

必要な場合だけ、次を追加してください。

```text
docs/R4_VERIFICATION_MATRIX.md
audits/2026-07-28/
  GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md
```

remote publication verificationは独立監査PASSではありません。名称・本文ともに`Independent Reaudit PASS`と誤認させないでください。

---

## Implementation steps

## Step 0: 現在のlocal状態を破壊せず固定する

最初に、現在位置を確認し、出力を作業reportへ保存してください。

```bash
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git branch -vv
git log --oneline --decorate --graph --all -40
git diff --stat
git diff --cached --stat
```

次も確認してください。

```bash
git cat-file -e 9705def085b66b5e521c7ec93804c228eb60e7ba^{commit}
git cat-file -e 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf^{commit}
git show --no-patch --format=fuller 9705def085b66b5e521c7ec93804c228eb60e7ba
git show --no-patch --format=fuller 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
```

どちらかのcommitがlocalにも存在しない場合は、最終報告との不一致として`NO-GO`で停止してください。似たcommitを推測で代用してはいけません。

---

## Step 1: remoteを取得し、観測値を更新する

```bash
git fetch --prune origin
git rev-parse origin/main
git rev-parse origin/codex/r4-authority-protocol
git log --oneline --decorate -10 origin/codex/r4-authority-protocol
```

2026-07-28の観測値は次でしたが、remoteが更新されていれば現在値を優先してください。

```text
origin/main:
  6723f9885e365c75a95254e35eb636573853750f

origin/codex/r4-authority-protocol:
  d5d4f0fed3cd32d36b8ee3eb6a0a9f78ec01f6a6
```

networkまたは認証に失敗した場合:

- retry loopを無制限に行わない
- repositoryを書き換えない
- pushしない
- safe errorと実行済みcommandを報告する
- statusを`NO-GO_REMOTE_ACCESS`とする

---

## Step 2: A5／B5のlineageを検証する

次を確認してください。

```bash
git rev-parse 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf^
git merge-base --is-ancestor origin/codex/r4-authority-protocol 9705def085b66b5e521c7ec93804c228eb60e7ba
git merge-base --is-ancestor 9705def085b66b5e521c7ec93804c228eb60e7ba 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
git rev-list --count origin/codex/r4-authority-protocol..9705def085b66b5e521c7ec93804c228eb60e7ba
git rev-list --count 9705def085b66b5e521c7ec93804c228eb60e7ba..753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
```

期待条件:

```text
B5の第一親 = A5
remote branch HEADはA5のancestor
A5はremote branchからSource変更だけを積む
B5はA5からRelease変更だけを積む
```

次のdiffをfile単位で保存してください。

```bash
git diff --name-status origin/codex/r4-authority-protocol..9705def085b66b5e521c7ec93804c228eb60e7ba
git diff --name-status 9705def085b66b5e521c7ec93804c228eb60e7ba..753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
git diff --stat origin/codex/r4-authority-protocol..9705def085b66b5e521c7ec93804c228eb60e7ba
git diff --stat 9705def085b66b5e521c7ec93804c228eb60e7ba..753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
```

B5のdiffは原則として次だけでなければなりません。

```text
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/**
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/**
implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
```

これ以外のsource、test、tool、canonical docsがB5に入っている場合は、provenance境界不一致として補正対象です。

---

## Step 3: Repository topologyを検証する

A5とB5のtracked treeを確認してください。

```bash
git ls-tree -r --name-only 9705def085b66b5e521c7ec93804c228eb60e7ba
git ls-tree -r --name-only 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
git ls-files
```

canonical implementationは必ず次のsubtreeに置きます。

```text
implementation/GoogleSpreadsheet/
```

次のroot-level重複が存在してはいけません。

```text
apps-script-v2/
tests/
tools/
release/
AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
V2_IMPLEMENTATION_SPEC.md
V2_CODEX_IMPLEMENTATION_PLAN.md
```

確認例:

```bash
git ls-tree -r --name-only 9705def085b66b5e521c7ec93804c228eb60e7ba \
  | grep -E '^(apps-script-v2|tests|tools|release)/|^AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT\.md$'
```

Windows PowerShellでは同等の`Select-String`を使用して構いません。

### topologyが不正な場合

現在worktreeを破壊せず、別worktreeまたは別branchで補正してください。

例:

```bash
git worktree add ../GAS-Project-Schedule-r4-publication-review \
  -b codex/r4-publication-review \
  origin/codex/r4-authority-protocol
```

その別worktreeで:

- A5／B5の変更内容を`git show`／`git diff`から確認する
- source、test、tool、docsをcanonical pathへ適用する
- root-level重複を新規作成しない
- 既存A5／B5を削除・rewriteしない
- 補正Source commitと補正Release commitを新しく作る

元のA5／B5はhistorical local candidateとして保持してください。

---

## Step 4: Source commitの必須内容を確認する

Source commitには次が必要です。

```text
Apps Script source
tests
tools
canonical docs
CHANGELOG
workflow visualization
TASK_AUTHORITY_PROTOCOL.md
R4 verification evidenceまたはtraceability
```

Source commitには新しいrelease packageとRound 4 release reportを含めません。

次を確認してください。

```bash
git show --name-status --stat 9705def085b66b5e521c7ec93804c228eb60e7ba
```

### Source A5が不完全な場合

既存A5／B5をamendしないでください。  
B5の後ろに次の2commitを追加して構いません。

```text
Corrected Source A5.1
Corrected Release B5.1
```

条件:

- A5.1はsource、tests、tools、canonical docs、CHANGELOG、visualization、verification matrixだけを変更
- B5.1はA5.1から生成した2つのrelease packageとRound 4 reportだけを変更
- B5.1の第一親はA5.1
- 最終報告では旧A5／B5と補正A5.1／B5.1を区別する
- independent re-audit対象は最終補正pairとする

---

## Step 5: 正本4文書とarchitectureの整合を修正する

### 5.1 statusの整合

次を同じcandidate statusへ統一してください。

```text
PROJECT_CONTEXT.md
MASTER_PLAN.md
CURRENT_STATUS.md
README.md
```

公開前／公開後の表現を区別します。

公開前:

```text
Local candidate complete
Remote publication pending
Overall Status: NO-GO_REMOTE_PUBLICATION
```

remote到達性とfresh-clone verificationの完了後:

```text
Code 2.8.5-prepilot
Schema 2.6
AI Schema 2.0
Migration 3
Overall Status: READY_FOR_INDEPENDENT_REAUDIT
Automation: OFF
```

`READY_FOR_INDEPENDENT_REAUDIT`は、少なくとも最終Source／Release commitがGitHubから解決可能になり、fresh cloneで検証できた後だけ使用してください。

### 5.2 source of truthの階層を明文化する

現行正本では`タスク一覧`をTaskの正本としています。  
R4設計ではhidden ledgerを唯一のauthorityとしています。

矛盾を放置せず、次のように層を分けて明文化してください。

```text
Business / user-facing system of record:
  Google Sheets「タスク一覧」
  利用者が確認・編集する唯一の日常画面

Technical integrity / recovery authority:
  protected hidden Task Authority Ledger
  edit前のraw row、snapshot cell、legacy noteはauthorityではない

Commit rule:
  Task一覧上の利用者編集は、共通coordinatorがledgerへcommitした時点で
  business stateとして確定する

Derivative:
  CalendarとOutboxはTask business stateの派生物であり正本ではない
```

「ledgerがあるためタスク一覧は正本ではない」と単純に置換せず、利用者向け正本と技術的recovery authorityの役割を分けてください。

### 5.3 Decision追加

`DECISIONS.md`へ次の趣旨の新Decisionを追加してください。IDは既存最大IDの次を使用します。

```text
Code 2.8.5 / Schema 2.6以降、
Taskの技術的完全性・復旧authorityとして
protected hidden Task Authority Ledger + versioned two-slot protocolを採用する。

タスク一覧はbusiness/user-facing system of recordであり、
raw editはledger commit完了前には確定状態と扱わない。

snapshot cellとlegacy noteはruntime authorityとして使用せず、
legacy noteはstrict migration anchorに限定する。
```

理由、置換対象、failure recovery、quarantine、migration、残存リスクも記載してください。

### 5.4 構成metadata

すべてのcurrent document、code、test、visualization、manual acceptanceを次へ合わせます。

```text
Total Sheets: 11
User-facing Sheets: 6
Hidden management Sheets: 5
Task columns: 50
```

hidden Sheet一覧へTask Authority Ledgerを追加してください。  
正式な日本語Sheet名と内部定数名を一意にし、source・schema・diagnostic・docsで統一してください。

### 5.5 stale metadata検索

historical auditや旧releaseを除くcurrent filesについて、次の残存を検索してください。

```bash
git grep -n -E \
  '2\.8\.4-prepilot|Schema 2\.5|Migration 2|47列|47 columns|10個のSheet|10 Sheet|管理4|hidden 4|WORK_OS_TASK_AUTHORITY_V2'
```

次はhistorical evidenceのため機械的に書き換えません。

```text
old release directories
historical audit reports
Round 1～3 implementation reports
historical changelog entries
```

current metadataとhistorical記録を区別してください。

---
