## Step 11: 補正が必要な場合のcommit手順

### 既存A5／B5が完全に正しい場合

- A5／B5をそのままcandidate pairとして使用
- push前に全検証を完了
- normal fast-forward push
- push後にpublication evidence docs commitを追加してよい

### 補正が必要な場合

既存A5／B5を保持し、次を追加します。

```text
Corrected Source A5.1
Corrected Release B5.1
Publication Evidence P5
```

#### Corrected Source A5.1

含める:

- source
- tests
- tools
- canonical architecture docs
- DECISIONS
- README
- CHANGELOG
- visualization
- verification matrix

含めない:

- regenerated release package
- Round 4 release report

#### Corrected Release B5.1

第一親はA5.1とする。

含める変更は次だけ:

```text
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot/**
implementation/GoogleSpreadsheet/release/v2.8.5-prepilot-phase8c/**
implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND4_IMPLEMENTATION_REPORT.md
```

#### Publication Evidence P5

push成功後、必要な場合だけ作成します。

含めてよいもの:

```text
CURRENT_STATUS.md
README.md
audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md
```

目的:

- exact Source SHA
- exact Release SHA
- remote branch SHA
- fresh-clone verification結果
- current Gate
- independent re-audit pending

P5はsource/release payloadを変更してはいけません。

---

## Step 12: push前のremote divergence確認

push直前に再fetchしてください。

```bash
git fetch origin
git rev-parse origin/codex/r4-authority-protocol
git merge-base --is-ancestor origin/codex/r4-authority-protocol <FINAL_HEAD>
```

remote branchが開始時から第三者により進んでいる場合:

- force pushしない
- 自動mergeしない
- current local candidateを上書きしない
- 差分を報告して`NO-GO_REMOTE_DIVERGED`で停止する

---

## Step 13: normal push

全条件を満たした場合だけ、通常pushします。

```bash
git push origin <LOCAL_BRANCH>:codex/r4-authority-protocol
```

禁止:

```bash
git push --force
git push --force-with-lease
```

push後に確認します。

```bash
git ls-remote origin refs/heads/codex/r4-authority-protocol
git fetch origin
git log --oneline --decorate -10 origin/codex/r4-authority-protocol
git branch -vv
```

Source／Release SHAがremoteから解決できることを確認してください。

---

## Step 14: fresh clone／別worktreeで再検証する

現在worktreeのcacheやuntracked fileに依存しないことを確認します。

例:

```bash
git clone --no-local <ORIGIN_URL> ../GAS-Project-Schedule-r4-fresh
cd ../GAS-Project-Schedule-r4-fresh
git checkout codex/r4-authority-protocol
```

確認:

```bash
git status --short --branch
git rev-parse HEAD
git cat-file -e <FINAL_SOURCE_SHA>^{commit}
git cat-file -e <FINAL_RELEASE_SHA>^{commit}
git diff --name-status <FINAL_SOURCE_SHA>..<FINAL_RELEASE_SHA>
```

fresh clone上で:

- all `tests/*.js`
- static validator
- release checksum
- source parity
- scope allow-list
- Advanced Service allow-list
- secret scan
- provenance
- topology check
- current metadata consistency check

を再実行してください。

release packageは、可能ならfresh cloneでSource commitから別directoryへ再buildし、Release commitのpackageとbyte／checksum比較してください。

---

## Step 15: statusを確定する

### 次をすべて満たす場合

```text
READY_FOR_INDEPENDENT_REAUDIT
```

条件:

- final Source／Release commitsがGitHub上で解決可能
- canonical pathが正しい
- root-level duplicateなし
- four canonical docsとREADMEが整合
- Decision追加済み
- 11 Sheets／hidden 5／Task 50 columnsがcurrent artifacts全体で一致
- shared validatorとtwo-slot protocolの実装確認
- test traceability complete
- all local／fresh-clone tests FAIL 0
- release verification PASS
- secret scan PASS
- Automation OFF
- real Workspace項目はNOT EXECUTED
- Phase 8B／8C GOを宣言していない

### 1つでも満たさない場合

```text
NO-GO
```

具体的なreason codeを付けてください。

例:

```text
NO-GO_REMOTE_ACCESS
NO-GO_REMOTE_DIVERGED
NO-GO_COMMIT_LINEAGE
NO-GO_REPOSITORY_TOPOLOGY
NO-GO_CANONICAL_INCONSISTENCY
NO-GO_AUTHORITY_IMPLEMENTATION
NO-GO_TEST_COVERAGE
NO-GO_RELEASE_PROVENANCE
```

---
