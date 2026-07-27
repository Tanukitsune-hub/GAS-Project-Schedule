# ChatGPT–Codex GitHub Handoff Policy Adoption

- Date: 2026-07-28
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/r4-authority-protocol`
- Status: Adopted operating policy

## Instruction

今後、このRepositoryに関するCodex作業では、次の正本を最初に確認してください。

1. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`
2. `PROJECT_CONTEXT.md`
3. `DECISIONS.md`のD-036
4. `README.md`の「ChatGPT–Codex連携方針」

ChatGPTからCodexへの作業引継ぎは、会話欄だけではなくGitHub上の`instructions/`を正式な指示書として行います。

ChatGPTの短い貼付文にGitHub URLがある場合は、URL先のindexと関連ファイルをすべて読み、対象Repository、branch、commit、status gate、禁止事項を確認してから作業を開始してください。

Codexは作業結果として、必要なsource、test、report、releaseおよび非機密証跡を同じGitHub Repositoryへ保存してください。ChatGPTはGitHub上の確定成果物を再監査します。

## Guardrails

- 旧`context-hub`を現行の参照、更新、同期先にしない
- 指示書の一部だけを読んで開始しない
- 会話欄の要約でGitHub上の詳細指示を置き換えない
- API key、password、token、個人情報、会社の未公表情報、実Workspace ID／URLを保存しない
- force push、reset、clean、unrelated revertで証跡を失わない
- GitHub保存・参照に失敗した場合は、成功したものとして続行しない

## Completion

この方針は新機能実装を要求するものではありません。以後のCodex作業で継続適用してください。
