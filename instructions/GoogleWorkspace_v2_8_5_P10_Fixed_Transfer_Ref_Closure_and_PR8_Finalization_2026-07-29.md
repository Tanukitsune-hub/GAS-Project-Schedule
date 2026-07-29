# Google Workspace Personal Work OS v2.8.5
# P10固定搬入ref検証・PR #8最終化指示

- Date: 2026-07-29
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Fixed transfer-envelope ref to verify: `1a1f9df65dacf3a031409d724cb2906b58900f77` (P10)
- Fixed Source A5.4: `6c4f737c676b3121c42aafabe9d0c677cacd69bb`
- Fixed Release B5.4: `3e5790672740626f3bec4592c3c7c0b86b47f3b1`
- Existing P9 evidence: `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b`
- Starting status: `READY_FOR_PHASE8B_SANDBOX_TRANSFER` with an audit-record closure issue
- Maximum status after completion: `READY_FOR_PHASE8B_SANDBOX_TRANSFER`

## 1. Goal

P10自身を固定refとしてfresh cloneから再検証し、P10が変更したtransfer manifest、operator documentation、canonical transfer checksumsおよび正本文書について、GitHub上の確定証跡を作成してください。

P10より後の証跡commitは、P10を「会社PCへ搬入可能な固定transfer ref」として記録するだけとし、transfer folder、release package、source、tests、toolsを変更してはいけません。これにより、証跡commit自身をtransfer対象へ含める自己参照ループを作らないでください。

この作業は機能追加、Phase 8B実行、会社PCへの実搬入、OAuth consent、deployment、`clasp push`、Automation/trigger有効化、Provider設定、実Google Workspace操作を行うものではありません。

## 2. 最初に読むもの

作業開始前に、対象Repository内で存在するものを次の順に確認してください。

1. root `README.md`
2. rootおよび対象directoryに適用される`AGENTS.md`（存在する場合）
3. `CONTRIBUTING.md`（存在する場合）
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`
5. `CURRENT_STATUS.md`
6. `DECISIONS.md`
7. `PROJECT_CONTEXT.md`
8. `MASTER_PLAN.md`
9. `docs/TASK_AUTHORITY_PROTOCOL.md`
10. `docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`
11. `audits/2026-07-29/GoogleWorkspace_v2_8_5_R5_Final_Independent_Reaudit_and_Company_PC_Transfer_Readiness_2026-07-29.md`
12. `implementation/GoogleSpreadsheet/transfer/v2.8.5-prepilot/`の全ファイル
13. Phase 8B packageのmanifest、checksums、quickstart、manual acceptance guide
14. 関連するverification scripts、tests、release builders
15. PR #8のbody、changed files、review threads、checks

報告文や既存audit conclusionを検証の代替にしないでください。

## 3. 既知のレビュー所見

ChatGPTによるGitHub直接レビューでは次を確認しています。

### PASS確認済み

- PR #8はDraft、base `main`、head `codex/r5-independent-reaudit-transfer-prep`、GitHub上はmergeable。
- A5.4→B5.4は1 commitで、B5.4はPhase 8B 27 files、Phase 8C 25 files、Round 5 report 1 fileだけ。
- P9→P10は1 commit。
- P10の`TRANSFER_CHECKSUMS.sha256`に記録されたoperator documentation 7件は、GitHubから取得した本文をUTF-8/LFへcanonicalizeして独立再計算し、7/7一致。
- `COPY_ALLOWLIST.txt`はPhase 8B packageの27 pathsだけで、Phase 8C、repository、source、tests、toolsを含まない。
- Phase 8B `00_Config.gs`は`AI_PROVIDER='MOCK'`、`EXTERNAL_AI_ENABLED=false`、`AUTOMATION_ENABLED=false`。
- Phase 8B manifestは`TEST_MODE=true`、Automation OFF、payload 23、package files 27を記録。
- appsscript manifestのscopeは記録どおりで、実OAuth consentは未実施。

### 閉じるべき所見 `REVIEW-P10-01`

P10の`CURRENT_STATUS.md`およびfinal audit reportは、statusを`READY_FOR_PHASE8B_SANDBOX_TRANSFER`とする一方で、P10 recordを`SELF`とし「final P10 clone remains subject to the same local/static verification before user-facing completion」と記載しています。

また、final auditの独立validation targetはP9です。しかしP10はtransfer manifest、operator documentation、`TRANSFER_CHECKSUMS.sha256`を変更しています。

ChatGPT側でoperator documentation checksum 7/7は再計算済みですが、Repository自身の正式な証跡として、固定P10 SHAをfresh clone検証し、P10をtransfer refとして確定する必要があります。

Severity: Medium（audit/provenance closure）。Source/release payloadの不具合ではありませんが、PR mergeおよび会社PC搬入前に解消してください。

### GitHub-native CI limitation

P10およびPR #8にはGitHub Actions workflow run / combined statusがありません。既存のtest evidenceはRepository内のCodex実行報告です。今回新しいCI構築をscopeへ追加しませんが、最終報告でこの制約を明示してください。

## 4. Git baseline

最初にremote、working tree、branch、fixed refsを確認してください。

```powershell
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch --prune origin
git rev-parse origin/codex/r5-independent-reaudit-transfer-prep
git cat-file -e 1a1f9df65dacf3a031409d724cb2906b58900f77^{commit}
git cat-file -e 6c4f737c676b3121c42aafabe9d0c677cacd69bb^{commit}
git cat-file -e 3e5790672740626f3bec4592c3c7c0b86b47f3b1^{commit}
git cat-file -e ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b^{commit}
git merge-base --is-ancestor 6c4f737c676b3121c42aafabe9d0c677cacd69bb 3e5790672740626f3bec4592c3c7c0b86b47f3b1
git merge-base --is-ancestor 3e5790672740626f3bec4592c3c7c0b86b47f3b1 1a1f9df65dacf3a031409d724cb2906b58900f77
git diff --name-status 6c4f737c676b3121c42aafabe9d0c677cacd69bb..3e5790672740626f3bec4592c3c7c0b86b47f3b1
git diff --name-status ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b..1a1f9df65dacf3a031409d724cb2906b58900f77
```

remote divergence、SHA不存在、lineage不一致、unexpected release/source changeがあれば`NO-GO_LINEAGE`で停止してください。

既存worktree、stage済み、untracked、historical commitsを破棄しないでください。必要ならfixed P10からtemporary cloneまたはseparate worktreeを使用してください。

## 5. P10 fixed-ref fresh-clone verification

新しいHTTPS cloneまたは同等のremote-only fresh worktreeで、checkout対象をP10 `1a1f9df65dacf3a031409d724cb2906b58900f77`へ固定してください。

最低限、次を再実行し、exact resultを記録してください。

1. 全`implementation/GoogleSpreadsheet/tests/*.js`
2. F016 fault injection
3. `tools/validate_apps_script_v2.js`
4. remote publication consistency tests
5. PowerShell parser for release/transfer tools
6. Phase 8B verifier
7. Phase 8C verifier（carriage対象ではないがrelease boundary regression確認）
8. `verify_phase8b_transfer_envelope.ps1`
9. Phase 8B 27/27 allow-list verification
10. canonical UTF-8/LF operator checksum 7/7
11. package tree digest
12. package checksum、payload hash、manifest hash
13. A5.4からB5.4 packageのindependent rebuild byte parity
14. secret scan、local-path scan、credential/ID scan
15. P9→P10でimmutable source/release payloadが変わっていないこと
16. P10 transfer folderにPhase 8C、repository source、tests、tools、credentials、実ID/URL、実データが含まれないこと

expected values:

```text
P10: 1a1f9df65dacf3a031409d724cb2906b58900f77
Source A5.4: 6c4f737c676b3121c42aafabe9d0c677cacd69bb
Release B5.4: 3e5790672740626f3bec4592c3c7c0b86b47f3b1
Phase 8B package files/payload: 27 / 23
Phase 8B payload SHA-256: 8c423f402ce8bb1de7aaa35ab70129b9af45c8abf1d0ccfe20dade8d44dea738
Phase 8B package tree SHA-256: 1d6c78332c39734e8e5d05b30735d5379ba82b8f5d20556553064624d6292060
Phase 8B CHECKSUMS.sha256 SHA-256: 1ecd877676d84bc6fc02bed60e090619c11b908aebd56805935edaf6c80a5a79
Phase 8B DEPLOYMENT_MANIFEST.md SHA-256: f305c8c5439cd1bfee425ea5130709380080ade5833d87b7dce29cadb73d3f66
Phase 8C payload SHA-256: 64e7ec4cf9d452db7c713275e0b2451ff194da9a737c539b8af96b324708ba10
Operator checksum records: 7/7
TEST_MODE: true
AI provider: MOCK
External AI enabled: false
Automation enabled: false
```

一つでも不一致があれば`TRANSFER_NO_GO`とし、statusをREADYのまま維持しないでください。

## 6. 証跡commitの境界

P10検証がすべてPASSした場合、P10を固定transfer refとして記録する新しいevidence-only commitを作成してください。

変更を許可するのは原則として次だけです。

- 新しいP10 fixed-ref verification report（Markdown）
- 同verification result（JSON）
- `CURRENT_STATUS.md`
- `README.md`
- `MASTER_PLAN.md`
- `PROJECT_CONTEXT.md`
- 必要な場合のみ`DECISIONS.md`またはverification matrixの証跡参照
- PR #8 body

次を変更してはいけません。

- `implementation/GoogleSpreadsheet/transfer/v2.8.5-prepilot/`全体
- `implementation/GoogleSpreadsheet/release/`全体
- `implementation/GoogleSpreadsheet/apps-script-v2/`
- tests、tools、builders、protocol implementation
- Source A5.4、Release B5.4、P10の既存内容

正本文書では次を明確にしてください。

- fixed, independently verified transfer refはP10 `1a1f9df...`
- evidence-only closure commitはtransfer対象ではない
- P10の`SELF`および「P10 verification pending」という未完了表現をcurrent canonical statusから除去する
- historical reports/package manifestsの生成時`NO-GO`はprovenanceとして保持する
- statusは`READY_FOR_PHASE8B_SANDBOX_TRANSFER`のまま
- statusはcarriage onlyであり、OAuth、Setup、Apps Script import、execution、Phase 8B PASSを許可しない
- GitHub Actions/CIは未構成で、test evidenceはfresh clone local/static reportである

## 7. Git・PR

- reset、clean、rebase、amend、force push、unrelated revertは禁止です。
- normal non-force pushのみ使用してください。
- PR #8を更新し、Draftのまま維持してください。
- mergeは行わないでください。
- PR bodyへfixed P10 verification report、exact results、remaining execution gatesを追記してください。
- working treeをcleanにしてください。ただし既存の別worktreeやhistorical artifactsは破棄しないでください。

## 8. 完了条件

次をすべて満たした場合のみ完了です。

- P10 fixed-ref fresh clone verification PASS
- operator checksum 7/7 PASS
- Phase 8B package 27/27 allow-list、checksums、tree digest PASS
- A5.4/B5.4 lineage、release boundary、rebuild parity PASS
- source/release/transfer folderに変更なし
- current canonical docsがP10 verified transfer refを明示
- evidence-only commitをnormal push
- PR #8更新、Draft維持、merge未実施
- no real Workspace action、OAuth、deployment、`clasp push`、Automation/trigger、Provider、real data

最高statusは`READY_FOR_PHASE8B_SANDBOX_TRANSFER`のままです。Phase 8B PASS、Phase 8C GO、production ready、pilot readyを宣言しないでください。

## 9. 最終報告

最終報告へ次を含めてください。

1. Conclusion / status
2. fixed P10 clone HEAD
3. exact lineage
4. exact test/validator/verifier results
5. checksum/hash values
6. changed-file boundary
7. evidence-only commit SHA
8. remote branch HEAD
9. PR #8 URL・Draft state・merge未実施
10. GitHub Actions/CI未構成という制約
11. NOT EXECUTED items
12. unresolved findings
13. Review Focus
14. elapsed time / token usage（取得不能ならunavailable）

Review Focus:

- P10を固定transfer refとして閉じているか
- evidence commitがtransfer/source/releaseを変更していないか
- carriageとOAuth/Setup/executionを明確に分離しているか
- PR #8をmergeしていないか
