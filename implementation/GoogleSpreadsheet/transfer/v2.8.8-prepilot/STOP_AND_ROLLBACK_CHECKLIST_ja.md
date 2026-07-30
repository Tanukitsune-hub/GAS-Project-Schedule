# Phase 8B v2.8.8 Sandbox 再搬入 — 停止・rollback checklist

直ちに停止する条件:

- old/new SHA-256、package checksum、transfer checksum、allow-listの不一致
- allow-list外file、Phase 8C、`.clasp.json`、credential、実ID/URLの混入
- S90 Quick Diagnosticの真正なFAIL、authority/Protection error、unexpected OAuth
- AutomationがOFFでない、5分triggerが存在する、実データ混入の疑い
- Dashboardのforeign editor、domain edit、target audience、duplicate/wrong
  Protection、または真正なsurface conflict

停止後:

1. Setup、Diagnostic、Edit、Worker、Dashboard refresh、Calendar処理を追加で行わない。
2. Task、Ledger、snapshot、note、checkbox、Protection、Dashboardを手動修復しない。
3. safe status/code/stage/enum/countだけを`RESULTS_TEMPLATE_ja.md`へ記録する。
4. Workbook、package、historical evidenceを削除・上書き・resetしない。
5. rollbackは別途承認された検証済み旧payload手順だけで扱う。

停止またはrollbackはPhase 8B PASS、Phase 8C GO、production/pilot承認を
意味しません。
