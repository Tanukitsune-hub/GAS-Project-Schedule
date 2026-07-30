# Phase 8B v2.8.7 Sandbox 再搬入 — 停止・rollback checklist

直ちに停止する条件:

- old/new SHA-256、package checksum、transfer checksum、allow-listの不一致。
- allow-list外のfile、Phase 8C、`.clasp.json`、credential、real ID/URLを発見。
- S90 Quick Diagnosticの真のFAIL、authority/Protection error、unexpected OAuth。
- AutomationがOFFでない、time-driven triggerが存在する、実データ混入の疑い。

停止後:

1. Setup、diagnostic、edit、Worker、Calendar処理を追加で行わない。
2. Task、Ledger、snapshot、note、checkbox、Protection、Dashboardを手修復しない。
3. safe status/code/stageと時刻だけを`RESULTS_TEMPLATE_ja.md`へ記録する。
4. Workbook、package、historic evidenceを削除・上書き・resetしない。
5. rollbackは検証済み旧payloadへの別途承認手順だけで扱う。

停止またはrollbackはPhase 8B PASS、Phase 8C GO、production/pilot承認を意味しない。
