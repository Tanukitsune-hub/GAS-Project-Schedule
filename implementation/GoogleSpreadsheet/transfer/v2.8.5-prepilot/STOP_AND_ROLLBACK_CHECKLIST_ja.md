# Stop / Rollback チェックリスト

状態: `READY_FOR_PHASE8B_SANDBOX_TRANSFER`（非機密 Phase 8B package の搬入のみ）

## 即時 STOP 条件

次のいずれか一つでも該当したら、追加操作、OAuth、Setup、Calendar I/O、copy を
止め、結果を `FAIL` または `NOT EXECUTED` として安全に記録してください。

- 最終 R5 status、Source/Release SHA、package hash、checksum、allow-list が一致しない。
- `TEST_MODE` が true でない、Automation が OFF でない、又は trigger 有効化が見える。
- 新規・空の Sandbox ではない、既存業務 Sheet/Calendar/Provider が見える。
- real email、個人情報、顧客情報、未公表情報、実 Workspace ID/URL、credential、
  token、実 Provider 設定が必要又は表示された。
- OAuth scope、advanced service、Calendar 対象、権限、会社の搬入経路について
  承認が確認できない。
- Task Authority Ledger の hidden/protection/header contract、Task row 1/2、
  Task 50 columns、Ledger 21 columns、又は authority validation が一致しない。
- `ORPHANED`、`QUARANTINED`、`UNRECOVERABLE` Task が Worker、Review、又は
  Calendar に流入しそうである。
- foreign / unowned Event、既存 Event、又は deterministic ownership を証明できない
  Event の変更・削除が必要になる。
- package 外の file を追加、package checksum を手編集、source/release を混在、
  又は Phase 8C を持ち込む必要が生じた。

## STOP 後に許可される安全な作業

1. Automation を OFF のまま維持し、trigger を新規に有効化しない。
2. `clasp push`、deployment、OAuth consent、実 Provider設定、実 Gmail/Calendar
   操作を行わない。
3. raw Task row、Authority Ledger、snapshot cell、又は package file を手修正して
   "復旧" しない。
4. safe error code、時刻、package hash、redacted observation だけを結果 template
   に記録する。実 ID、URL、内容、token は記録しない。
5. 会社の承認済み担当者に、STOP reason と必要な判断だけを渡す。

## Rollback の意味

この手順は code rollback や既存業務データの削除を自動実行しません。Sandbox で
異常が起きた場合は、承認済み担当者が次のうち適切なものを選びます。

- 新規・空の Sandbox を使用停止にし、証跡だけ残す。
- 監査済みの package を再度 checksum 照合し、別の新規 Sandbox からやり直す。
- 会社の Sandbox data-retention policy に従って、承認済みの方法で test artifact
  を保管又は廃棄する。

自動削除、Git reset、force 操作、authority silent rebaseline、snapshot/row からの
Task 再生成、既存 Event の一括削除は rollback ではなく禁止です。
