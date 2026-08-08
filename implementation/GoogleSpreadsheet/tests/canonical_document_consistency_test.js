'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const moduleRoot = path.join(repositoryRoot, 'implementation', 'GoogleSpreadsheet');
const expected = {
  code: '2.8.12-prepilot', schema: '2.6', aiSchema: '2.0', migration: '3',
  gate: 'READY_FOR_CONTROLLED_SANDBOX_VALIDATION'
};

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

let passed = 0;
function check(body) {
  body();
  passed += 1;
}

const config = read('implementation/GoogleSpreadsheet/apps-script-v2/00_Config.gs');
check(() => assert.match(config, /CODE_VERSION:\s*'2\.8\.12-prepilot'/));
check(() => assert.match(config, /SCHEMA_VERSION:\s*'2\.6'/));
check(() => assert.match(config, /AI_SCHEMA_VERSION:\s*'2\.0'/));
check(() => assert.match(config, /MIGRATION_VERSION:\s*'3'/));
check(() => assert.match(config, /TEST_MODE:\s*true/));
check(() => assert.match(config, /AUTOMATION_ENABLED:\s*false/));

const activeDocuments = [
  'README.md', 'CURRENT_STATUS.md', 'DECISIONS.md', 'PROJECT_CONTEXT.md',
  'MASTER_PLAN.md', 'docs/TASK_AUTHORITY_PROTOCOL.md',
  'docs/R4_VERIFICATION_MATRIX.md',
  'implementation/GoogleSpreadsheet/apps-script-v2/README.md',
  'implementation/GoogleSpreadsheet/docs/V2_MANUAL_ACCEPTANCE_GUIDE.md',
  'implementation/GoogleSpreadsheet/tools/v2_8_12/DEPLOYMENT_MANIFEST.template.md',
  'implementation/GoogleSpreadsheet/tools/v2_8_12/MANUAL_ACCEPTANCE_GUIDE.md',
  'implementation/GoogleSpreadsheet/tools/v2_8_12/SANDBOX_QUICKSTART.md'
];
for (const file of activeDocuments) {
  const content = read(file);
  check(() => assert.ok(content.includes(expected.code), `${file}: code version`));
  check(() => assert.ok(content.includes(expected.gate), `${file}: gate`));
}

const visualizationPaths = [
  'docs/visualizations/index.html',
  'docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html',
  'implementation/GoogleSpreadsheet/visualizations/task_authority_protocol_v2_8_12.html'
];
for (const file of visualizationPaths) {
  const content = read(file);
  check(() => assert.match(content, /data-code-version="2\.8\.12-prepilot"/));
  check(() => assert.match(content, /data-schema-version="2\.6"/));
  check(() => assert.match(content, /data-ai-schema-version="2\.0"/));
  check(() => assert.match(content, /data-migration-version="3"/));
  check(() => assert.match(content,
    /data-release-status="READY_FOR_CONTROLLED_SANDBOX_VALIDATION"/));
}

check(() => assert.strictEqual(
  fs.existsSync(path.join(moduleRoot, 'transfer', 'v2.8.12-prepilot')),
  false,
  'Work 0002 must not create an active transfer package'
));

const contractPath = path.join(repositoryRoot, 'CURRENT_CONTRACT.json');
const releasePaths = [
  path.join(moduleRoot, 'release', 'v2.8.12-prepilot'),
  path.join(moduleRoot, 'release', 'v2.8.12-prepilot-phase8c')
];
if (!fs.existsSync(contractPath)) {
  check(() => assert.ok(releasePaths.every((target) => !fs.existsSync(target)),
    'Source A12 must not contain generated v2.8.12 release packages'));
} else {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  check(() => assert.strictEqual(contract.code_version, expected.code));
  check(() => assert.strictEqual(contract.schema_version, expected.schema));
  check(() => assert.strictEqual(contract.ai_schema_version, expected.aiSchema));
  check(() => assert.strictEqual(contract.migration_version, expected.migration));
  check(() => assert.strictEqual(contract.highest_gate, expected.gate));
  check(() => assert.strictEqual(contract.automation, false));
  check(() => assert.strictEqual(contract.active_transfer, null));
  check(() => assert.strictEqual(contract.active_deployment, null));
  check(() => assert.ok(releasePaths.every((target) =>
    fs.statSync(target).isDirectory()),
    'Release B12 must contain both generated packages'));
}

process.stdout.write(`${JSON.stringify({
  suite: 'canonical_document_consistency', passed, failed: 0,
  release_stage: fs.existsSync(contractPath) ? 'B12_OR_LATER' : 'A12_SOURCE'
}, null, 2)}\n`);
