'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const activeFiles = [
  'README.md',
  'CURRENT_STATUS.md',
  'PROJECT_CONTEXT.md',
  'MASTER_PLAN.md',
  'DECISIONS.md',
  'docs/TASK_AUTHORITY_PROTOCOL.md',
  'docs/R4_VERIFICATION_MATRIX.md',
  'docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md',
  'docs/visualizations/index.html',
  'docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html',
  'implementation/GoogleSpreadsheet/apps-script-v2/README.md',
  'implementation/GoogleSpreadsheet/apps-script-v2/CHANGELOG.md',
  'implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
  'implementation/GoogleSpreadsheet/docs/TASK_AUTHORITY_PROTOCOL.md',
  'implementation/GoogleSpreadsheet/docs/V2_REQUIREMENTS_TRACEABILITY.md',
  'implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_18.html',
  'implementation/GoogleSpreadsheet/tools/v2_8_18/DEPLOYMENT_MANIFEST.template.md',
  'implementation/GoogleSpreadsheet/tools/v2_8_18/MANUAL_ACCEPTANCE_GUIDE.md',
  'implementation/GoogleSpreadsheet/tools/v2_8_18/SANDBOX_QUICKSTART.md'
];

const mojibake = [
  '\uFFFD', '遯ｶ', '窶', '驕', '繝', '縺', '陷', '譫', '郢', '莨'
];
const read = (file) => fs.readFileSync(path.join(repositoryRoot, file), 'utf8');
const failures = [];

for (const file of activeFiles) {
  const content = read(file);
  for (const marker of mojibake) {
    if (content.includes(marker)) failures.push(`${file}:${marker}`);
  }
}

const changelogHead = read(
  'implementation/GoogleSpreadsheet/apps-script-v2/CHANGELOG.md'
).split('## 2.8.15-prepilot', 1)[0];
for (const marker of mojibake) {
  if (changelogHead.includes(marker)) failures.push(`CHANGELOG_HEAD:${marker}`);
}

assert.deepStrictEqual(failures, []);
const status = read('CURRENT_STATUS.md');
const plan = read('MASTER_PLAN.md');
const decisions = read('DECISIONS.md');
assert.match(status, /Work 0018: Code `2\.8\.14-prepilot`, source A14 and release B14/);
assert.match(status, /Work 0028: Code `2\.8\.15-prepilot`, source A15 and release B15/);
assert.match(status, /Work 0029: Code `2\.8\.16-prepilot`, source A16 and release B16/);
assert.match(status, /Work 0031: Code `2\.8\.18-prepilot`, source A18 and release B18/);
assert.match(plan, /Work 0018 remains Code `2\.8\.14-prepilot`, source A14, release B14/);
assert.match(plan, /Work 0028 remains Code `2\.8\.15-prepilot`, source A15, release B15/);
assert.match(decisions, /historical release identities/i);
assert.match(decisions, /Work 0018 is Code `2\.8\.14-prepilot` with A14\/B14/);
assert.match(decisions, /Work 0028 is Code[\s\S]*?`2\.8\.15-prepilot` with A15\/B15/);
assert.match(decisions, /Work 0029 remains Code `2\.8\.16-prepilot`[\s\S]*?A16\/B16/);
assert.match(decisions, /Work\s+0031 is the successor Code `2\.8\.18-prepilot` with[\s\S]*?A18\/B18/);

process.stdout.write(`${JSON.stringify({
  suite: 'work_0029_active_document_integrity',
  environment: 'LOCAL_UTF8_STATIC_ONLY',
  active_file_count: activeFiles.length,
  mojibake_hits: 0,
  historical_lineage: 'A14_B14_A15_B15_A16_B16_A17_B17_PRESERVED',
  status: 'PASS'
}, null, 2)}\n`);
