'use strict';

/**
 * Canonical current-transfer contract consistency check.
 *
 * Historical T8/T9 references remain valid evidence. This verifier reads only
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
const expectedKeys = [
  'Code',
  'Schema',
  'AI Schema',
  'Migration',
  'Gate',
  'Fixed transfer',
  'Transfer path'
];
const noGoGate = 'PHASE8B_SANDBOX_NO_GO_DASHBOARD_WRITE_VISIBILITY';
const readyGate = 'READY_FOR_PHASE8B_SANDBOX_RETRANSFER';
const expectedPath =
  'implementation/GoogleSpreadsheet/transfer/v2.8.10-prepilot/';
const historicalFixedRefs = [
  '69f843f6ea426ccb45d721a40508a35b0a59795d',
  '781f408fcf0853a5fffee9c00d3022ee5e17b1d7'
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

function validateContracts(contracts) {
  const reference = contracts[0].contract;
  contracts.slice(1).forEach((entry) => {
    assert.strictEqual(
      JSON.stringify(entry.contract),
      JSON.stringify(reference),
      `${entry.name}: current-transfer contract differs`
    );
  });
  assert.strictEqual(reference.Code, '2.8.10-prepilot');
  assert.strictEqual(reference.Schema, '2.6');
  assert.strictEqual(reference['AI Schema'], '2.0');
  assert.strictEqual(reference.Migration, '3');
  assert.strictEqual(reference['Transfer path'], expectedPath);
  assert.ok(
    reference.Gate === noGoGate || reference.Gate === readyGate,
    'current gate is not an allowed v2.8.10 gate'
  );
  assert.ok(
    !historicalFixedRefs.includes(reference['Fixed transfer']),
    'historical T8/T9 must not be the current fixed transfer'
  );
  if (reference.Gate === noGoGate) {
    assert.strictEqual(reference['Fixed transfer'], 'PENDING_T10');
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
    /historical T8\/T9/
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
    /historical T8\/T9/
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
