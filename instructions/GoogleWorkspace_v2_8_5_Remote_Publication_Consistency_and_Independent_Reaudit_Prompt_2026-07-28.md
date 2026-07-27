# Google Workspace Personal Work OS v2.8.5
# Remote Publication・整合性確認・独立再監査準備指示

- 作成日: 2026-07-28
- 唯一の正本Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- 対象branch: `codex/r4-authority-protocol`
- 最高到達可能status: `READY_FOR_INDEPENDENT_REAUDIT`
- Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyの宣言は禁止

このindexと、下記6ファイルを番号順にすべて読み、全体を1つの作業指示として実行してください。一部だけを読んで作業を開始してはいけません。

## Instruction files

1. [Context・Goal・Constraints](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/01_CONTEXT_AND_CONSTRAINTS.md)
2. [Target files・Git baseline・正本整合](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/02_TARGETS_AND_GIT_BASELINE.md)
3. [Task Authority Ledger独立再監査](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/03_AUTHORITY_REAUDIT.md)
4. [Calendar intent・Test traceability・Release](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/04_TESTS_AND_RELEASE.md)
5. [補正commit・Remote publication・Status gate](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/05_PUBLICATION_AND_STATUS.md)
6. [Verification・完了条件・最終報告形式・Codex貼付文](./GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_2026-07-28/06_VERIFICATION_AND_OUTPUT.md)

## Core instruction

最初に、報告済みローカルcommitの実在、親子関係、remote branchからの系譜、canonical pathを確認してください。

```text
Source A5: 9705def085b66b5e521c7ec93804c228eb60e7ba
Release B5: 753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf
```

既存A5／B5、stage済み・untracked・historical artifactを破棄せず、reset、clean、amend、rebase、force push、unrelated revertを行わないでください。問題がある場合は、別worktreeまたは追加の補正Source／Release commit pairで修正してください。

全local test、static validation、fresh clone verification、release checksum／parity／scope allow-list／secret scanがPASSし、normal fast-forward push後にfinal Source／Release SHAがGitHubから解決できる場合だけ、`READY_FOR_INDEPENDENT_REAUDIT`へ到達したものとしてください。

## Codexチャット欄へ貼り付ける指示文

```text
次のGitHub上の指示書を唯一の作業指示として読み込み、indexに記載された全6ファイルを番号順に確認したうえで、Tanukitsune-hub/GAS-Project-Scheduleだけを対象に実行してください。

参照URL: https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/codex/r4-authority-protocol/instructions/GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_Prompt_2026-07-28.md

対象index: `instructions/GoogleWorkspace_v2_8_5_Remote_Publication_Consistency_and_Independent_Reaudit_Prompt_2026-07-28.md`

報告済みlocal Source A5 `9705def085b66b5e521c7ec93804c228eb60e7ba`／Release B5 `753fdbf43ae7d5f7d2df7d3945dbb8c67e00eeaf`を最初に検証し、GitHub canonical path、commit lineage、正本4文書、Task Authority Ledger、11 Sheets／hidden 5／50 Task columns、test traceability、release provenanceを完全に確認してください。

既存A5／B5、stage済み・untracked・historical artifactを破棄せず、reset、clean、amend、rebase、force push、unrelated revertを行わないでください。問題があれば別worktreeまたは追加の補正Source／Release commit pairで直してください。

全local test、static validation、fresh clone verification、release checksum/parity/secret scanがPASSし、normal fast-forward push後にfinal Source／Release SHAがGitHubから解決できる場合だけ、最高statusをREADY_FOR_INDEPENDENT_REAUDITとしてください。Phase 8B GO/PASS、Phase 8C GO、Production ready、Pilot readyは宣言しないでください。
```
