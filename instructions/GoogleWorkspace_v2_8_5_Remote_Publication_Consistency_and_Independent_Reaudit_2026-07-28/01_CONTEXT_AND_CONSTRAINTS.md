# Task

Google Workspace Personal Work OS v2.8.5-prepilot候補について、ローカルSource A5／Release B5のGit系譜、Repository階層、正本文書、Task Authority Ledger実装、test、release provenanceを再点検し、GitHub上で独立再監査可能な状態へ安全に公開してください。

今回の作業は、単なる再pushではありません。  
GitHub上の正本とローカル候補の差分を固定し、誤った階層・不完全な正本更新・自己参照できないcommit SHA記載・test coverage不足がないことを確認したうえで、必要な補正を行い、通常のfast-forward pushで公開する作業です。

---

## Recommended reasoning level

Extra High

理由:

- protected hidden ledgerとversioned two-slot protocolを含む状態機械の検証が必要
- Source／Releaseの2段階provenanceとGit履歴の検証が必要
- ローカル作業場所とGitHub canonical pathの不一致可能性がある
- Task／Review／Calendar／Migration／Edit／Diagnosticの横断整合性を確認する必要がある
- 既存commitを保持したまま、必要時だけ補正commit pairを作る必要がある

---

## Goal

次の状態へ到達させてください。

1. `Tanukitsune-hub/GAS-Project-Schedule`だけを正本として扱う。
2. 報告済みローカルcommitをまず検証する。
   - Source A5: `9705def085b66b5e521c7ec93804c228eb60e7ba`
   - Release B5: `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf`
3. A5／B5の親子関係、remote branchからの系譜、変更fileの境界、canonical pathを確認する。
4. GitHub上のcurrent branchへ、誤配置や履歴改変なしで公開する。
5. 公開後、別worktreeまたはfresh cloneから完全再検証する。
6. 正本4文書、README、Decision、architecture、version、Sheet数、Task列数、test、release manifestを相互整合させる。
7. 問題がある場合、既存A5／B5をamend、reset、rebase、force pushで書き換えず、補正Source／Release commit pairを追加する。
8. 最高statusは`READY_FOR_INDEPENDENT_REAUDIT`とする。
9. Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyは宣言しない。

---

## Context

### 1. GitHub上で確認済みの現在地

2026-07-28時点でGitHub connectorから確認した状態は次のとおりです。

```text
Repository:
  Tanukitsune-hub/GAS-Project-Schedule

Default branch:
  main

Observed main HEAD:
  6723f9885e365c75a95254e35eb636573853750f

Observed remote branch:
  codex/r4-authority-protocol

Observed remote branch HEAD:
  d5d4f0fed3cd32d36b8ee3eb6a0a9f78ec01f6a6

Remote branch difference from main:
  ahead by 1 commit
  added file only:
    docs/TASK_AUTHORITY_PROTOCOL.md
```

GitHub上では、報告済みA5／B5のSHAを解決できませんでした。

```text
9705def085b66b5e521c7ec93804c228eb60e7ba: remoteで未確認
753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf: remoteで未確認
```

したがって、Code 2.8.5-prepilotの実装、39 suites／582 PASS、release package、Round 4 reportは、現時点ではGitHub正本から独立確認できません。

### 2. GitHub正本の現在のGate

GitHub `main`の正本は現在、次の状態です。

```text
Code: 2.8.4-prepilot
Schema: 2.5
AI Schema: 2.0
Migration: 2
Overall Status: REAUDIT_NO_GO
Automation: OFF
```

`CURRENT_STATUS.md`とroot `README.md`は`REAUDIT_NO_GO`です。

一方、`PROJECT_CONTEXT.md`と`MASTER_PLAN.md`の冒頭には、旧Round 3時点の`READY_FOR_INDEPENDENT_REAUDIT`が残っています。これは現在のGitHub正本内の既存不整合です。

### 3. 公開済みR4設計

`docs/TASK_AUTHORITY_PROTOCOL.md`では次を選定しています。

```text
protected hidden Task Authority Ledger
+ versioned two-slot protocol
```

設計上:

- hidden ledgerだけをtechnical authorityとする
- Task row、`authoritative_snapshot_json`、旧noteはprojectionまたはmigration anchorとする
- Schema 2.6でhidden ledger Sheetを1つ追加する
- Task control fieldとして次の3列を追加する
  - authority_generation
  - authority_hash
  - authority_state
- Setup、Diagnostic、Task write、Migration、Edit、Worker、Review、Calendarが共通validatorを使用する
- PREPARED／COMMITTEDのtwo-slot state machineで部分失敗から回復する
- authority不正rowはQUARANTINED／UNRECOVERABLE／ORPHANEDへ分類する

この設計を採る場合、現行構成の次のmetadataも連動して更新される必要があります。

```text
Sheet count:
  10 -> 11

Hidden management Sheet count:
  4 -> 5

Task columns:
  47 -> 50
```

### 4. Repository階層に関する重要確認

GitHubのcanonical implementation pathは次です。

```text
implementation/GoogleSpreadsheet/apps-script-v2/
implementation/GoogleSpreadsheet/tests/
implementation/GoogleSpreadsheet/tools/
implementation/GoogleSpreadsheet/release/
```

一方、Codex最終報告のローカルpathは次の形式でした。

```text
C:/Users/kondo/OneDrive/ドキュメント/CodexWorkspace/GoogleSpreadsheet/apps-script-v2/
C:/Users/kondo/OneDrive/ドキュメント/CodexWorkspace/GoogleSpreadsheet/tests/
C:/Users/kondo/OneDrive/ドキュメント/CodexWorkspace/GoogleSpreadsheet/release/
```

これは単なるlocal worktree rootの違いである可能性もありますが、誤ってGitHub rootへ次のdirectoryを追加する危険もあります。

```text
apps-script-v2/
tests/
tools/
release/
AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
```

push前に、tracked pathがcanonical subtreeへ入っていることを必ず確認してください。推測で問題なしと扱ってはいけません。

### 5. commit self-reference

Git commitは、自分自身の確定SHAを同じcommit内のfileへ事前に埋め込めません。

したがって:

- Source commit内でSource自身の確定SHAを記載する場合は`SELF`または`pending`とする
- Release B5内のmanifest／reportでB5自身の確定SHAを記載する場合は`SELF`とする
- A5／B5の確定SHAは、push後の別のpublication evidence／status commit、独立監査report、GitHub evidenceで記録する
- B5内にB5の確定SHAが文字列として記載されている場合は、その生成手順と整合性を疑い、必ず確認する

---

## Constraints

### Repositoryと履歴

- 唯一の正本は`Tanukitsune-hub/GAS-Project-Schedule`
- 旧`context-hub`を参照、更新、同期、完了報告先に使用しない
- `git reset`を使用しない
- `git clean`を使用しない
- `git push --force`、`--force-with-lease`を使用しない
- unrelated revertを行わない
- 既存A5／B5をamendまたはrebaseで書き換えない
- 既存のstage済み・untracked・historical artifactを削除しない
- remote branchが進んでいる場合、推測でmergeまたは上書きしない
- `main`へ直接pushまたはmergeしない
- 公開先は原則`codex/r4-authority-protocol`
- branch保護、認証、networkに失敗した場合はNO-GOで停止し、失敗commandとsafe errorだけを報告する

### 実装・安全性

- Automation defaultは`OFF`
- `TEST_MODE=true`をPhase 8B packageのdefaultとする
- deployment、`clasp push`、実Google Workspace変更を行わない
- 実Gmail、実Calendar Event、実Provider、OAuth consentを実行しない
- external I/Oをmain Script Lock内へ置かない
- snapshot cellへの通常fallbackを復活させない
- live raw Task rowからsilent rebaselineしない
- Protectionだけをauthorityの唯一の防御にしない
- quarantine rowをWorker、Review、Calendarの通常処理へ含めない
- failing testを削除、弱体化、不適切にSKIPPED化しない
- 実Workspace未実施項目をlocal PASSへ昇格しない

### 情報管理

次をRepository、test fixture、report、logへ保存しない。

- API key
- password
- token
- Authorization header
- Cookie
- private key
- 実Spreadsheet ID
- 実Calendar ID
- 実Gmail Message ID／Thread ID
- 実Workspace URL
- 実メール本文・件名・送信者
- 個人情報
- 会社の未公表情報
- 実AI request／response全文
- local `.clasp.json`

---
