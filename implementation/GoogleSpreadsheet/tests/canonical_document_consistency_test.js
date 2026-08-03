'use strict';

/**
 * Canonical current company-handoff contract consistency check.
 *
 * Historical T8/T9/T10/T11 references remain valid evidence. The current
 * contract must record Instruction 0010 canonical parity and the closed
 * Instruction 0015 closure while keeping company carriage suspended.
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
const currentRuntimeDocumentNames = [
  'docs/development-validation-gates.md',
  'docs/company-handoff.md',
  'docs/TASK_AUTHORITY_PROTOCOL.md',
  'docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md',
  'implementation/GoogleSpreadsheet/apps-script-v2/README.md'
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
  'Transfer path',
  'Company handoff'
];
const noCompanyHandoff =
  'NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW';
const currentDevelopmentGate = 'READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION';
const allowedGates = [
  noCompanyHandoff,
  currentDevelopmentGate,
  'NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP',
  'READY_FOR_LOCAL_CLASP_VALIDATION',
  'READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION',
  'READY_FOR_COMPANY_HANDOFF_REASSESSMENT',
  'READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW'
];
const expectedPath = 'NO_ACTIVE_COMPANY_TRANSFER';
const expectedActiveCompanyPcFields = {
  'Company handoff': noCompanyHandoff,
  'Transfer state': 'T11_SUSPENDED',
  'Current carriage source': 'NO_ACTIVE_COMPANY_TRANSFER',
  'Workspace action': 'NONE_AUTHORIZED',
  'T1-01 status': 'REVIEW_REQUIRED'
};
const historicalFixedRefs = [
  '69f843f6ea426ccb45d721a40508a35b0a59795d',
  '781f408fcf0853a5fffee9c00d3022ee5e17b1d7',
  '927d8567bce64461840cc6f72fbae0c1e636a8e6',
  'a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33'
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
      'Company handoff',
      'Transfer state',
      'Current carriage source',
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
  Object.entries(expectedActiveCompanyPcFields).forEach(([field, value]) => {
    assert.strictEqual(
      boundary[field],
      value,
      `README.md: active Company-PC ${field} differs from the sealed boundary`
    );
  });
  assert.match(
    activeBlock,
    /0005[\s\S]*SUPERSEDED_NOT_EXECUTED[\s\S]*no company-PC carriage/i,
    'README.md: active Company-PC boundary must record instruction 0005 as superseded'
  );
  assert.doesNotMatch(
    activeBlock,
    /HASH_VERIFIED_FIVE_FILE_REPLACEMENT_ONLY|ONE_SEPARATELY_APPROVED_READ_ONLY_T1_01_QUICK_DIAGNOSTIC/,
    'README.md: active Company-PC boundary still authorizes the historical T11 transfer'
  );
  assert.doesNotMatch(
    activeBlock,
    /(?:replace|carry|transfer).{0,80}(?:five|5).{0,80}files/i,
    'README.md: active Company-PC prose still authorizes a five-file carriage'
  );
  assert.doesNotMatch(
    activeBlock,
    /Quick Diagnostic re-observation/i,
    'README.md: active Company-PC prose still authorizes a Workspace action'
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
  assert.ok(allowedGates.includes(reference.Gate),
    'current gate is not an allowed local-clasp governance gate');
  assert.strictEqual(reference.Gate, currentDevelopmentGate,
    'current gate must preserve the Instruction 0010 canonical-parity result');
  assert.strictEqual(reference['Fixed transfer'], 'T11_SUSPENDED');
  assert.strictEqual(reference['Company handoff'], noCompanyHandoff);
  assert.ok(!historicalFixedRefs.includes(reference['Fixed transfer']),
    'historical fixed refs must not be an active transfer source');
  return reference;
}

function validateInstruction0010CurrentParity(text, label) {
  assert.match(
    text,
    /Instruction 0010/i,
    `${label}: current Instruction 0010 evidence label missing`
  );
  assert.match(
    text,
    /independent(?:ly)?[\s\S]{0,160}pull-back/i,
    `${label}: current Instruction 0010 canonical parity evidence missing`
  );
  assert.match(
    text,
    /(?:exact|all)[\s\S]{0,80}`?23`?(?:-file| canonical files| files)/i,
    `${label}: current Instruction 0010 canonical file-count evidence missing`
  );
  assert.match(
    text,
    /Cloud[\s\S]{0,260}(?:runtime|OAuth)[\s\S]{0,260}NOT_EXECUTED/i,
    `${label}: remaining runtime-readiness boundary missing`
  );
}

function validateInstruction0011RuntimeBoundary(text, label) {
  assert.match(text, /Instruction 0011/i,
    `${label}: current Instruction 0011 evidence label missing`);
  assert.match(text, /runtime[\s\S]{0,220}(?:push\/pull parity|overlay parity)[\s\S]{0,220}(?:passed|PASS)/i,
    `${label}: runtime overlay parity evidence missing`);
  assert.match(text, /(?:sole|exactly one|single)[\s\S]{0,180}runQuickDiagnostic[\s\S]{0,220}BLOCKED_BY_AUTH/i,
    `${label}: exactly-one runtime stop evidence missing`);
  assert.match(text, /versioned[\s\S]{0,220}(?:not retried|not retested|no second|no retry|prohibited a retry)/i,
    `${label}: corrected deployment no-retry boundary missing`);
  assert.match(text, /ATTEMPTED_FAILED_CLOSED/i,
    `${label}: functional acceptance closed state missing`);
}

function validateInstruction0013RuntimeBoundary(text, label) {
  assert.match(text, /Instruction 0013/i,
    `${label}: current Instruction 0013 evidence label missing`);
  assert.match(text,
    /(?:preflight|binding)[\s\S]{0,360}visible\s+versioned\s+deployment/i,
    `${label}: corrected versioned deployment proof missing`);
  assert.match(text, /(?:not (?:the )?HEAD|not HEAD-only|was not HEAD-only)/i,
    `${label}: corrected deployment HEAD-only rejection missing`);
  assert.match(text,
    /(?:exactly one|one authorized|one deployed-version|sole deployed-version)[\s\S]{0,180}runQuickDiagnostic/i,
    `${label}: exactly-one deployed-version runtime evidence missing`);
  assert.match(text, /no\s+bounded\s+(?:diagnostic\s+)?(?:body|result)/i,
    `${label}: absent bounded diagnostic body evidence missing`);
  assert.match(text, /REMOTE_QUICK_DIAGNOSTIC_FAILED_CLOSED/i,
    `${label}: closed runtime category missing`);
  assert.match(text, /VERSIONED_RUNTIME_FUNCTION_NOT_FOUND/i,
    `${label}: closed runtime subtype missing`);
  assert.match(text,
    /(?:no\s+retry|retry\s+is\s+(?:not\s+)?permitted|permits\s+no\s+retry)/i,
    `${label}: Instruction 0013 no-retry boundary missing`);
  assert.match(text, /ATTEMPTED_FAILED_CLOSED/i,
    `${label}: functional acceptance closed state missing`);
}

function validateInstruction0014RuntimeBoundary(text, label) {
  assert.match(text, /Instruction 0014/i,
    `${label}: current Instruction 0014 evidence label missing`);
  assert.match(text,
    /clasp 3\.3\.0[\s\S]{0,320}(?:project configuration|project config)[\s\S]{0,260}scripts\.run/i,
    `${label}: clasp execution-binding root cause missing`);
  assert.match(text,
    /(?:staged|staging)[\s\S]{0,300}(?:HEAD|pull-back|pulled)[\s\S]{0,300}(?:wrapper|runQuickDiagnostic)/i,
    `${label}: staged and pulled wrapper proof missing`);
  assert.match(text,
    /fresh[\s\S]{0,220}(?:immutable|versioned)[\s\S]{0,300}(?:pulled|pull-back)[\s\S]{0,220}(?:exact|same|payload)/i,
    `${label}: fresh deployment version lineage proof missing`);
  assert.match(text,
    /(?:exactly one|sole|one authorized)[\s\S]{0,180}Instruction 0014[\s\S]{0,180}runQuickDiagnostic/i,
    `${label}: exactly-one Instruction 0014 runtime evidence missing`);
  assert.match(text, /no bounded (?:diagnostic )?(?:body|result)/i,
    `${label}: absent bounded Instruction 0014 result missing`);
  assert.match(text, /RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED/i,
    `${label}: Instruction 0014 closed status missing`);
  assert.match(text, /BLOCKED_BY_AUTH/i,
    `${label}: Instruction 0014 closed category missing`);
  assert.match(text, /RUNTIME_AUTHORIZATION_REJECTED/i,
    `${label}: Instruction 0014 safe subtype missing`);
  assert.match(text,
    /(?:no retry|retry is (?:not )?permitted|permits no retry)/i,
    `${label}: Instruction 0014 no-retry boundary missing`);
  assert.match(text, /ATTEMPTED_FAILED_CLOSED/i,
    `${label}: functional acceptance closed state missing`);
}

function validateInstruction0015RuntimeBoundary(text, label) {
  assert.match(text, /Instruction 0015/i,
    `${label}: current Instruction 0015 evidence label missing`);
  assert.match(text, /force-refreshed/i,
    `${label}: forced OAuth refresh proof missing`);
  assert.match(text, /(?:existing|named)[\s\S]{0,180}(?:OAuth|profile)/i,
    `${label}: existing named OAuth profile proof missing`);
  assert.match(text,
    /(?:all\s+)?(?:`?7`?|seven)[\s\S]{0,180}(?:runtime-manifest|runtime manifest)[\s\S]{0,240}(?:`?19`?|nineteen)\s+(?:granted\s+)?(?:scopes|grants)/i,
    `${label}: closed scope-coverage counts missing`);
  assert.match(text, /INCONCLUSIVE_NOT_EXPOSED_BY_APPS_SCRIPT_METADATA/,
    `${label}: ownership uncertainty boundary missing`);
  assert.match(text,
    /(?:staged|staging)[\s\S]{0,300}HEAD[\s\S]{0,300}(?:immutable|versioned)[\s\S]{0,260}(?:pulled|pull-back)[\s\S]{0,220}(?:wrapper|runQuickDiagnostic)/i,
    `${label}: staged, HEAD, and immutable-version wrapper proof missing`);
  assert.match(text,
    /(?:exactly one|sole|one authorized)[\s\S]{0,180}Instruction 0015[\s\S]{0,180}runQuickDiagnostic/i,
    `${label}: exactly-one Instruction 0015 runtime evidence missing`);
  assert.match(text, /no bounded (?:diagnostic )?(?:body|result)/i,
    `${label}: absent bounded Instruction 0015 result missing`);
  assert.match(text, /RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED/i,
    `${label}: Instruction 0015 closed status missing`);
  assert.match(text, /BLOCKED_BY_AUTH/i,
    `${label}: Instruction 0015 closed category missing`);
  assert.match(text, /RUNTIME_AUTHORIZATION_REJECTED/i,
    `${label}: Instruction 0015 safe subtype missing`);
  assert.match(text,
    /(?:no retry|retry is (?:not )?permitted|permits no retry)/i,
    `${label}: Instruction 0015 no-retry boundary missing`);
  assert.match(text, /ATTEMPTED_FAILED_CLOSED/i,
    `${label}: functional acceptance closed state missing`);
}

function validateCurrentRuntimeDocumentSupersession(text, label) {
  assert.match(text, /Instruction 0014/i,
    `${label}: Instruction 0014 supersession missing`);
  assert.match(text, /(?:scripts\.run|deployment-bound)/i,
    `${label}: deployment-bound execution correction missing`);
  assert.match(text, /Instruction 0015/i,
    `${label}: Instruction 0015 supersession missing`);
  assert.match(text, /force-refreshed/i,
    `${label}: named-profile refresh evidence missing`);
  assert.match(text, /(?:`?7`?)[\s\S]{0,160}(?:`?19`?)[\s\S]{0,160}(?:scope|grant)/i,
    `${label}: closed scope-coverage counts missing`);
  assert.match(text, /INCONCLUSIVE_NOT_EXPOSED_BY_APPS_SCRIPT_METADATA/,
    `${label}: ownership uncertainty boundary missing`);
  assert.match(text, /RUNTIME_QUICK_DIAGNOSTIC_FAILED_CLOSED/i,
    `${label}: final closed runtime status missing`);
  assert.match(text, /BLOCKED_BY_AUTH/i,
    `${label}: final closed runtime category missing`);
  assert.match(text, /RUNTIME_AUTHORIZATION_REJECTED/i,
    `${label}: final closed runtime subtype missing`);
  assert.match(text, /ATTEMPTED_FAILED_CLOSED/i,
    `${label}: functional acceptance closed state missing`);
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
const currentRuntimeTexts = currentRuntimeDocumentNames.map((name) => ({
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

test('DOC-01A_VISIBLE_CURRENT_GATE_LABELS_MATCH_SEALED_CONTRACT', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const visibleGatePatterns = {
    'README.md': /^\|\s*Current gate\s*\|\s*\x60([^\x60]+)\x60\s*\|\s*$/m,
    'CURRENT_STATUS.md': /^Overall status:\s+\x60([^\x60]+)\x60$/m,
    'MASTER_PLAN.md': /^Current publication gate:\s+\x60([^\x60]+)\x60$/m,
    'PROJECT_CONTEXT.md': /^Publication gate:\s+\x60([^\x60]+)\x60$/m
  };
  sourceTexts.forEach((entry) => {
    const match = entry.text.match(visibleGatePatterns[entry.name]);
    assert.ok(match, `${entry.name}: visible current-gate label missing`);
    assert.strictEqual(
      match[1],
      contract.Gate,
      `${entry.name}: visible current-gate label differs from sealed contract`
    );
  });
});

test('DOC-01B_ACTIVE_COMPANY_PC_BOUNDARY_MATCHES_CURRENT_CONTRACT', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  validateActiveCompanyPcBoundary(contract, readme.text);
});

test('DOC-01C_STALE_PRE_ACCESS_NETWORK_GATE_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item) => ({
    name: item.name,
    text: item.text.replace(
      /^\|\s*Gate\s*\|\s*`[^`]+`\s*\|$/m,
      '| Gate | `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP` |'
    )
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /Instruction 0010 canonical-parity result/
  );
});

test('DOC-01C1_CURRENT_DOCUMENTS_RECORD_THE_0010_PARITY_BOUNDARY', () => {
  sourceTexts.forEach((entry) => {
    validateInstruction0010CurrentParity(entry.text, entry.name);
  });
  const fixture = sourceTexts.map((entry) => ({
    name: entry.name,
    text: entry.text.replace(
      /Instruction 0010/g,
      'Instruction UNKNOWN'
    )
  }));
  assert.throws(
    () => fixture.forEach((entry) =>
      validateInstruction0010CurrentParity(entry.text, entry.name)
    ),
    /Instruction 0010 evidence label missing/
  );
});

test('DOC-01C2_CURRENT_DOCUMENTS_RECORD_THE_0011_RUNTIME_STOP', () => {
  sourceTexts.forEach((entry) => {
    validateInstruction0011RuntimeBoundary(entry.text, entry.name);
  });
});

test('DOC-01C3_CURRENT_DOCUMENTS_RECORD_THE_0013_RUNTIME_STOP', () => {
  sourceTexts.forEach((entry) => {
    validateInstruction0013RuntimeBoundary(entry.text, entry.name);
  });
});

test('DOC-01C4_CURRENT_DOCUMENTS_RECORD_THE_0014_RUNTIME_STOP', () => {
  sourceTexts.forEach((entry) => {
    validateInstruction0014RuntimeBoundary(entry.text, entry.name);
  });
});

test('DOC-01C5_CURRENT_DOCUMENTS_RECORD_THE_0015_RUNTIME_STOP', () => {
  sourceTexts.forEach((entry) => {
    validateInstruction0015RuntimeBoundary(entry.text, entry.name);
  });
});

test('DOC-01C6_CURRENT_RUNTIME_DOCUMENTS_RECORD_THE_0015_SUPERSESSION', () => {
  currentRuntimeTexts.forEach((entry) => {
    validateCurrentRuntimeDocumentSupersession(entry.text, entry.name);
  });
  const fixture = currentRuntimeTexts.map((entry) => ({
    name: entry.name,
    text: entry.text.replace(/Instruction 0015/g, 'Instruction UNKNOWN')
  }));
  assert.throws(
    () => fixture.forEach((entry) =>
      validateCurrentRuntimeDocumentSupersession(entry.text, entry.name)
    ),
    /Instruction 0015 supersession missing/
  );
});

test('DOC-01D_STALE_LOCAL_FAILURE_COMPANY_HANDOFF_IS_REJECTED', () => {
  const fixture = sourceTexts.map((item) => ({
    name: item.name,
    text: item.text.replace(
      /^\|\s*Company handoff\s*\|\s*`[^`]+`\s*\|$/m,
      '| Company handoff | `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE` |'
    )
  }));
  assert.throws(
    () => validateContracts(contractsFromTexts(fixture)),
    /NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW/
  );
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
    /T11_SUSPENDED/
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
    /T11_SUSPENDED/
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
    /T11_SUSPENDED/
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

test('DOC-05_SYNTHETIC_ACTIVE_COMPANY_PC_T11_CARRIAGE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Current carriage source',
    historicalFixedRefs[3]
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /Current carriage source differs/
  );
});

test('DOC-06_SYNTHETIC_ACTIVE_COMPANY_PC_HANDOFF_GO_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Company handoff',
    'READY_FOR_COMPANY_HANDOFF_REASSESSMENT'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /Company handoff differs/
  );
});

test('DOC-07_SYNTHETIC_ACTIVE_COMPANY_PC_WORKSPACE_ACTION_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = replaceActiveCompanyPcField(
    readme.text,
    'Workspace action',
    'ONE_SEPARATELY_APPROVED_READ_ONLY_T1_01_QUICK_DIAGNOSTIC'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /Workspace action differs/
  );
});

test('DOC-07A_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_T11_CARRIAGE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    `Replace the five files from fixed T11 \`${historicalFixedRefs[3]}\`.`
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /still authorizes a five-file carriage/
  );
});

test('DOC-07B_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_QUICK_DIAGNOSTIC_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    'Run one Quick Diagnostic re-observation after transfer.'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /still authorizes a Workspace action/
  );
});

test('DOC-07C_SYNTHETIC_ACTIVE_COMPANY_PC_PROSE_OLD_T11_SCOPE_IS_REJECTED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = appendActiveCompanyPcProse(
    readme.text,
    'The old scope is HASH_VERIFIED_FIVE_FILE_REPLACEMENT_ONLY.'
  );
  assert.throws(
    () => validateActiveCompanyPcBoundary(contract, fixture),
    /still authorizes the historical T11 transfer/
  );
});

test('DOC-07D_CLEARLY_LABELLED_HISTORICAL_T11_EVIDENCE_REMAINS_ALLOWED', () => {
  const contract = validateContracts(contractsFromTexts(sourceTexts));
  const readme = sourceTexts.find((item) => item.name === 'README.md');
  const fixture = readme.text + [
    '',
    '## Historical T11 evidence fixture (nonoperative)',
    `Fixed T11 \`${historicalFixedRefs[3]}\` is historical and suspended evidence only.`
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
