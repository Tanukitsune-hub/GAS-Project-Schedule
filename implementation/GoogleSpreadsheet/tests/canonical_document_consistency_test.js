'use strict';

/**
 * Canonical current-transfer contract consistency check.
 *
 * Historical T8/T9/T10 references remain valid evidence. This verifier reads only
 * the explicit current-transfer block in the four canonical documents.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const documentNames = [
  'README.md',
  'CURRENT_STATUS.md',
  'MASTER_PLAN.md',
  'PROJECT_CONTEXT.md'
];
const startMarker = '<!-- CURRENT_TRANSFER_CONTRACT_START -->';
const endMarker = '<!-- CURRENT_TRANSFER_CONTRACT_END -->';
const activeCompanyPcStartMarker =
  '<!-- ACTIVE_COMPANY_PC_TRANSFER_BOUNDARY_START -->';
const activeCompanyPcEndMarker =
  '<!-- ACTIVE_COMPANY_PC_TRANSFER_BOUNDARY_END -->';
const expectedKeys = [
  'Code',
  'Schema',
  'AI Schema',
  'Migration',
  'Gate',
  'Fixed transfer',
  'Transfer path'
];
const noGoGate = 'PHASE8B_SANDBOX_NO_GO_T1_01_SUMMARY';
const readyGate = 'READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER';
const expectedPath =
  'implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/';
const expectedActiveCompanyPcFields = {
  'Carriage scope': 'HASH_VERIFIED_FIVE_FILE_REPLACEMENT_ONLY',
  'Workspace action': 'ONE_SEPARATELY_APPROVED_READ_ONLY_T1_01_QUICK_DIAGNOSTIC',
  'T1-01 status': 'REVIEW_REQUIRED'
};
const historicalFixedRefs = [
  '69f843f6ea426ccb45d721a40508a35b0a59795d',
  '781f408fcf0853a5fffee9c00d3022ee5e17b1d7',
  '927d8567bce64461840cc6f72fbae0c1e636a8e6'
];

function parseContract(text, label) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  assert.ok(start >= 0, `${label}: current-transfer start marker missing`);
  assert.ok(end > start, `${label}: current-transfer end marker missing`);
  assert.strictEqual(
    text.indexOf(startMarker, start + startMarker.length),
    -1,
    `${label}: duplicate current-transfer block`
  );
  const block = text.slice(start + startMarker.length, end);
  const contract = {};
  block.split(/\r?\n/).forEach((line) => {
    const match = line.match(
      /^\|\s*([^|]+?)\s*\|\s*`([^`]*)`\s*\|\s*$/
    );
    if (match && match[1] !== 'Field' && match[1] !== '---') {
      contract[match[1].trim()] = match[2];
    }
  });
  assert.deepStrictEqual(
    Object.keys(contract).sort(),
    expectedKeys.slice().sort(),
    `${label}: current-transfer fields mismatch`
  );
  return contract;
}

function parseActiveCompanyPcBoundary(text, label) {
  const start = text.indexOf(activeCompanyPcStartMarker);
  const end = text.indexOf(activeCompanyPcEndMarker);
  assert.ok(start >= 0, `${label}: active Company-PC boundary start marker missing`);
  assert.ok(end > start, `${label}: active Company-PC boundary end marker missing`);
  assert.strictEqual(
    text.indexOf(activeCompanyPcStartMarker, start + activeCompanyPcStartMarker.length),
    -1,
    `${label}: duplicate active Company-PC boundary`
  );
  const block = text.slice(start + activeCompanyPcStartMarker.length, end);
  const boundary = {};
  block.split(/\r?\n/).forEach((line) => {
    const match = line.match(
      /^\|\s*([^|]+?)\s*\|\s*`([^`]*)`\s*\|\s*$/
    );
    if (match && match[1] !== 'Field' && match[1] !== '---') {
      boundary[match[1].trim()] = match[2];
    }
  });
  assert.deepStrictEqual(
    Object.keys(boundary).sort(),
    [
      'Gate',
      'Fixed transfer',
      'Transfer path',
      'Carriage scope',
      'Workspace action',
      'T1-01 status'
    ].sort(),
    `${label}: active Company-PC boundary fields mismatch`
  );
  return boundary;
}

function validateActiveCompanyPcBoundary(contract, text) {
  const boundary = parseActiveCompanyPcBoundary(text, 'README.md');
  const start = text.indexOf(activeCompanyPcStartMarker);
  const end = text.indexOf(activeCompanyPcEndMarker);
  const activeBlock = text.slice(start + activeCompanyPcStartMarker.length, end);
  assert.strictEqual(
    boundary.Gate,
    contract.Gate,
    'README.md: active Company-PC gate differs from current contract'
  );
  assert.strictEqual(
    boundary['Fixed transfer'],
    contract['Fixed transfer'],
    'README.md: active Company-PC fixed transfer differs from current contract'
  );
  assert.strictEqual(
    boundary['Transfer path'],
    contract['Transfer path'],
    'README.md: active Company-PC transfer path differs from current contract'
  );
  Object.entries(expectedActiveCompanyPcFields).forEach(([field, value]) => {
    assert.strictEqual(
      boundary[field],
      value,
      `README.md: active Company-PC ${field} differs from the sealed boundary`
    );
  });
  assert.match(
    activeBlock,
    /T10 is permitted only as the old-byte[\s\S]*not an active[\s\S]*carriage source/,
    'README.md: active Company-PC boundary must retain T10 as historical old-byte/hash evidence only'
  );
  assert.doesNotMatch(
    activeBlock,
    /(?:only|sole|current)\s+(?:approved\s+)?carriage source\s+(?:is|:)\s+(?:fixed\s+)?T10\b/i,
    'README.md: active Company-PC prose declares T10 as a carriage source'
  );
  assert.doesNotMatch(
    activeBlock,
    /READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE/,
    'README.md: active Company-PC prose contains the historical controlled-manual-acceptance gate'
  );
  assert.doesNotMatch(
    activeBlock,
    /implementation\/GoogleSpreadsheet\/transfer\/v2\.8\.10-prepilot\//,
    'README.md: active Company-PC prose contains the historical v2.8.10 transfer path'
  );
  return boundary;
}

function replaceActiveCompanyPcField(text, field, value) {
  const start = text.indexOf(activeCompanyPcStartMarker);
  const end = text.indexOf(activeCompanyPcEndMarker);
  assert.ok(start >= 0 && end > start, 'fixture: active Company-PC boundary missing');
  const block = text.slice(start, end);
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const replaced = block.replace(
    new RegExp(
      '^\\|\\s*' + escapedField + '\\s*\\|\\s*`[^`]+`\\s*\\|$',
      'm'
    ),
    `| ${field} | \`${value}\` |`
  );
  assert.notStrictEqual(replaced, block, `fixture: ${field} field missing`);
  return text.slice(0, start) + replaced + text.slice(end);
}

function appendActiveCompanyPcProse(text, prose) {
  const end = text.indexOf(activeCompanyPcEndMarker);
  assert.ok(end >= 0, 'fixture: active Company-PC boundary end marker missing');
  return text.slice(0, end) + prose + '\n' + text.slice(end);
}

function validateContracts(contracts) {
  const reference = contracts[0].contract;
  contracts.slice(1).forEach((entry) => {
    assert.strictEqual(
      JSON.stringify(entry.contract),
      JSON.stringify(reference),
      `${entry.name}: current-transfer contract differs`
    );
  });
  assert.strictEqual(reference.Code, '2.8.11-prepilot');
  assert.strictEqual(reference.Schema, '2.6');
  assert.strictEqual(reference['AI Schema'], '2.0');
  assert.strictEqual(reference.Migration, '3');
  assert.strictEqual(reference['Transfer path'], expectedPath);
  assert.ok(
    reference.Gate === noGoGate ||
      reference.Gate === readyGate,
    'current gate is not an allowed v2.8.11 gate'
  );
  assert.ok(
    !historicalFixedRefs.includes(reference['Fixed transfer']),
    'historical T8/T9/T10 must not be the current fixed transfer'
  );
  if (reference.Gate === noGoGate) {
    assert.strictEqual(reference['Fixed transfer'], 'PENDING_T11');
  } else {
    assert.match(reference['Fixed transfer'], /^[0-9a-f]{40}$/);
  }
  return reference;
}

function contractsFromTexts(texts) {
  return texts.map((item) => ({
    name: item.name,
    contract: parseContract(item.text, item.name)
  }));
}

const sourceTexts = documentNames.map((name) => ({
  name,
  text: fs.readFileSync(path.join(repositoryRoot, name), 'utf8')
}));

const tests = [];
function test(id, body) {
  const startedAt = Date.now();
  try {
    body();
    tests.push({ id, status: 'PASS', duration_ms: Date.now() - startedAt });
  } catch (error) {
    tests.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - startedAt,
      safe_message: String(error && error.message || error)
    });
  }
}

test('DOC-01_FOUR_CANONICAL_CURRENT_TRANSFER_CONTRACTS_MATCH', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  assert.strictEqual(contract['Transfer path'], expectedPath);
});

test('DOC-01B_ACTIVE_COMPANY_PC_BOUNDARY_MATCHES_CURRENT_CONTRACT', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  validateActiveCompanyPcBoundary(contract, readme.text);
});

test('DOC-02_SYNTHETIC_STALE_T8_CURRENT_REF_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item) => ({
    name: item.name,
    text: item.text.replace(
      /^\|\s*Fixed transfer\s*\|\s*`[^`]+`\s*\|$/m,
      `| Fixed transfer | \`${historicalFixedRefs[0]}\` |`
    )
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /historical T8\/T9\/T10/
  );
});

test('DOC-03_SYNTHETIC_STALE_T9_CURRENT_REF_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item) => ({
    name: item.name,
    text: item.text.replace(
      /^\|\s*Fixed transfer\s*\|\s*`[^`]+`\s*\|$/m,
      `| Fixed transfer | \`${historicalFixedRefs[1]}\` |`
    )
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /historical T8\/T9\/T10/
  );
});

test('DOC-03B_SYNTHETIC_STALE_T10_CURRENT_REF_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item) => ({
    name: item.name,
    text: item.text.replace(
      /^\|\s*Fixed transfer\s*\|\s*`[^`]+`\s*\|$/m,
      `| Fixed transfer | \`${historicalFixedRefs[2]}\` |`
    )
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /historical T8\/T9\/T10/
  );
});

test('DOC-04_SYNTHETIC_CURRENT_PATH_SKEW_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item, index) => ({
    name: item.name,
    text: index === 0
      ? item.text.replace(
        /^\|\s*Transfer path\s*\|\s*`[^`]+`\s*\|$/m,
        '| Transfer path | `transfer/v2.8.9-prepilot/` |'
      )
      : item.text
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /contract differs|Expected values/
  );
});

test('DOC-05_SYNTHETIC_ACTIVE_COMPANY_PC_T10_REF_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Fixed transfer',
    historicalFixedRefs[2]
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /active Company-PC fixed transfer differs/
  );
});

test('DOC-06_SYNTHETIC_ACTIVE_COMPANY_PC_OLD_GATE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Gate',
    'READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /active Company-PC gate differs/
  );
});

test('DOC-07_SYNTHETIC_ACTIVE_COMPANY_PC_OLD_PATH_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Transfer path',
    'implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /active Company-PC transfer path differs/
  );
});

test('DOC-07A_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_T10_SOURCE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    `The only approved carriage source is fixed T10 \`${historicalFixedRefs[2]}\`.`
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /prose declares T10 as a carriage source/
  );
});

test('DOC-07B_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_OLD_GATE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    'The active gate is READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE.'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /prose contains the historical controlled-manual-acceptance gate/
  );
});

test('DOC-07C_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_OLD_PATH_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    'Use implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/ for carriage.'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /prose contains the historical v2\.8\.10 transfer path/
  );
});

test('DOC-07D_CLEARLY_LABELLED_HISTORICAL_T10_EVIDENCE_REMAINS_ALLOWED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = readme.text + [
    '',
    '## Historical evidence fixture (nonoperative)',
    `Fixed T10 \`${historicalFixedRefs[2]}\` is historical old-byte/hash evidence only.`
  ].join('\n');
  assert.doesNotThrow(() => validateActiveCompanyPcBoundary(contract, fixture));
});

test('DOC-08_HISTORICAL_T10_MANIFEST_BASELINE_REMAINS_ALLOWED', () => {
  const manifestPath = path.join(
    repositoryRoot,
    'implementation',
    'GoogleSpreadsheet',
    'transfer',
    'v2.8.11-prepilot',
    'COMPANY_PC_PATCH_MANIFEST.json'
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.strictEqual(manifest.old_fixed_ref, historicalFixedRefs[2]);
  assert.strictEqual(manifest.old_version, 'v2.8.10-prepilot');
  assert.strictEqual(manifest.new_version, 'v2.8.11-prepilot');
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  assert.doesNotThrow(() => validateActiveCompanyPcBoundary(contract, readme.text));
});

const failed = tests.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'canonical_document_consistency',
  environment: 'LOCAL_STATIC',
  real_google_workspace: 'NOT_EXECUTED',
  passed: tests.length - failed.length,
  failed: failed.length,
  tests
}, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
