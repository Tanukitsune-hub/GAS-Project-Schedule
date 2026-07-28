# Google Workspace Personal Work OS v2.8.5
# GitHub認証後 Remote Publication再開指示

- Date: 2026-07-28
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Instruction branch: `codex/r4-publication-resume`
- Target remote branch: `codex/r4-authority-protocol`
- Current status: `NO-GO_REMOTE_ACCESS`
- Maximum status after successful completion: `READY_FOR_INDEPENDENT_REAUDIT`

## 1. Goal

前回作業でローカル作成・検証済みのCorrected Source A5.2／Release B5.2を、GitHub認証後に通常のfast-forward pushで公開し、remoteとfresh cloneから再確認してください。

新たな機能追加、設計変更、test弱体化、commit履歴の書換えは行いません。

## 2. Fixed commits

```text
Historic A5: 9705def085b66b5e521c7ec93804c228eb60e7ba
Historic B5: 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
Final corrected Source A5.2: ff658bacf1e85864e4008efa32863635e446d47d
Final corrected Release B5.2: d6dda2b3eb9307e7033dcdd5f4718260c4944451
Expected remote base: 6082865d9b618eacb0470807787a37ff3aa5f11b
Target branch: codex/r4-authority-protocol
```

上記SHAを推測で置換しないでください。localに存在しない、親子関係が異なる、remoteがdivergeしている場合はNO-GOで停止してください。

## 3. Authentication gate

最初に次を確認してください。

```powershell
git credential-manager github login
git ls-remote origin refs/heads/codex/r4-authority-protocol
```

認証UIが必要な場合は、ユーザーによるログイン完了後に同じ作業を再開してください。認証できていない状態でpushを試行し続けないでください。

## 4. Pre-push verification

```powershell
git rev-parse --show-toplevel
git status --short --branch
git remote -v
git fetch --prune origin
git rev-parse origin/codex/r4-authority-protocol
git cat-file -e ff658bacf1e85864e4008efa32863635e446d47d^{commit}
git cat-file -e d6dda2b3eb9307e7033dcdd5f4718260c4944451^{commit}
git rev-parse d6dda2b3eb9307e7033dcdd5f4718260c4944451^
git merge-base --is-ancestor origin/codex/r4-authority-protocol ff658bacf1e85864e4008efa32863635e446d47d
git merge-base --is-ancestor ff658bacf1e85864e4008efa32863635e446d47d d6dda2b3eb9307e7033dcdd5f4718260c4944451
git diff --name-status ff658bacf1e85864e4008efa32863635e446d47d..d6dda2b3eb9307e7033dcdd5f4718260c4944451
```

必須条件:

- remote branch HEADが前回観測の`6082865...`または、その後に追加された本指示書・方針文書だけを含む正当なfast-forward系譜である
- A5.2がremote HEADのdescendantである
- B5.2の第一親がA5.2である
- Source→Release差分が、2つのrelease packageとRound 4 reportだけである
- working treeの既存変更・untracked・historical artifactを破棄しない

remoteに未知のcommitが増えている場合は自動mergeせず、`NO-GO_REMOTE_DIVERGED`で停止してください。

## 5. Push

全条件を満たす場合だけ、forceを使わずに実行してください。

```powershell
git push origin d6dda2b3eb9307e7033dcdd5f4718260c4944451:refs/heads/codex/r4-authority-protocol
```

禁止:

- `git push --force`
- `git push --force-with-lease`
- reset
- clean
- rebase
- amend
- unrelated revert

## 6. Remote verification

push後に次を確認してください。

```powershell
git ls-remote origin refs/heads/codex/r4-authority-protocol
git fetch origin
git rev-parse origin/codex/r4-authority-protocol
git cat-file -e ff658bacf1e85864e4008efa32863635e446d47d^{commit}
git cat-file -e d6dda2b3eb9307e7033dcdd5f4718260c4944451^{commit}
```

GitHub URLから、少なくとも次を確認してください。

- Source A5.2
- Release B5.2
- `CURRENT_STATUS.md`
- `README.md`
- Round 4 report
- Phase 8B／8C package manifests

## 7. Fresh clone verification

remoteからfresh cloneし、前回実施済みの検証を再実行してください。

最低限:

- all 41 test files
- Apps Script validator
- Phase 8B checksum／source parity／secret scan／provenance
- Phase 8C audited transform parity／allow-lists／secret scan／provenance
- Source→Release diff boundary
- root-level duplicate pathなし
- Automation OFF

実測値を報告し、過去値を固定転記しないでください。

## 8. Publication evidence

remote publicationとfresh clone検証が完了した場合だけ、必要に応じてpublication evidence commitを追加してください。

変更可能範囲:

```text
CURRENT_STATUS.md
README.md
audits/2026-07-28/GoogleWorkspace_v2_8_5_Remote_Publication_Verification_2026-07-28.md
```

Source／tests／tools／release packageを変更してはいけません。

記載内容:

- exact Source A5.2 SHA
- exact Release B5.2 SHA
- remote branch final SHA
- fresh clone verification結果
- highest status `READY_FOR_INDEPENDENT_REAUDIT`
- independent re-audit pending
- Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyは未宣言

publication evidenceを追加した場合もnormal pushだけを使用してください。

## 9. Guardrails

- 旧`context-hub`を参照・更新・同期しない
- deployment、`clasp push`、実Workspace操作を行わない
- Automationを有効化しない
- 実Gmail、実Calendar、実Provider、OAuth consentを実行しない
- secret、個人情報、未公表情報、実Workspace ID／URLを保存しない
- 実Workspace未実施項目をPASSへ昇格しない

## 10. Completion gate

次をすべて満たす場合のみ:

```text
READY_FOR_INDEPENDENT_REAUDIT
```

- A5.2／B5.2がGitHub上で解決可能
- remote branchがnormal fast-forwardで更新済み
- fresh clone検証FAIL 0
- release検証PASS
- secret scan PASS
- Automation OFF
- independent re-audit pendingと明記

認証、divergence、lineage、test、release verificationのいずれかに問題があれば、具体的なNO-GO reason codeで停止してください。

## 11. Required report

```markdown
# Conclusion
- Status:
- Reason:
- Highest gate reached:
- Independent re-audit status:

## Authentication
- Credential command:
- Authentication result:

## Git lineage
- Remote start SHA:
- Source A5.2:
- Release B5.2:
- B5.2 parent:
- Remote final SHA:
- Publication evidence SHA:

## Push
- Command:
- Result:
- Force push used: NO

## Fresh clone verification
- Test files:
- PASS / FAIL / SKIPPED:
- Validator:
- Phase 8B:
- Phase 8C:
- Secret scan:

## Guardrails
- reset / clean / rebase / amend: NO
- deployment / clasp push: NO
- Automation enabled: NO
- Real Workspace actions: NOT EXECUTED
- Phase 8B GO/PASS declared: NO
- Phase 8C GO declared: NO
- Production/Pilot ready declared: NO
```
