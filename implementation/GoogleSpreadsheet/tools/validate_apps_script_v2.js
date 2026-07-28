'use strict';

/**
 * Static and global-evaluation validation for apps-script-v2.
 *
 * No Google Workspace or external service is contacted.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.join(root, 'apps-script-v2');
const files = fs.readdirSync(sourceRoot)
  .filter((name) => name.endsWith('.gs'))
  .sort();
const records = files.map((name) => ({
  name,
  source: fs.readFileSync(path.join(sourceRoot, name), 'utf8')
}));
const combined = records.map((record) =>
  `\n/* FILE:${record.name} */\n${record.source}`
).join('\n');

const checks = [];
function check(id, ok, details = {}) {
  checks.push({
    id,
    status: ok ? 'PASS' : 'FAIL',
    details
  });
}

check('GS_FILE_COUNT', files.length === 22, {
  expected: 22,
  actual: files.length
});

const individualSyntaxFailures = [];
records.forEach((record) => {
  try {
    new Function(record.source);
  } catch (error) {
    individualSyntaxFailures.push({
      file: record.name,
      message: String(error && error.message || error).slice(0, 160)
    });
  }
});
check('INDIVIDUAL_GS_SYNTAX', individualSyntaxFailures.length === 0, {
  files_checked: files.length,
  failures: individualSyntaxFailures
});

let concatenatedSyntaxError = '';
try {
  new Function(combined);
} catch (error) {
  concatenatedSyntaxError =
    String(error && error.message || error).slice(0, 160);
}
check('CONCATENATED_GS_SYNTAX', !concatenatedSyntaxError, {
  error: concatenatedSyntaxError
});

const topLevelSymbols = [];
records.forEach((record) => {
  const pattern = /^(?:var\s+([A-Za-z_$][\w$]*)|function\s+([A-Za-z_$][\w$]*)\s*\()/gm;
  let match;
  while ((match = pattern.exec(record.source)) !== null) {
    topLevelSymbols.push({
      name: match[1] || match[2],
      file: record.name
    });
  }
});
const duplicateSymbols = Array.from(
  topLevelSymbols.reduce((map, item) => {
    if (!map.has(item.name)) map.set(item.name, []);
    map.get(item.name).push(item.file);
    return map;
  }, new Map())
).filter(([, owners]) => owners.length > 1)
  .map(([name, owners]) => ({ name, files: owners }));
check('TOP_LEVEL_SYMBOL_DUPLICATES', duplicateSymbols.length === 0, {
  duplicates: duplicateSymbols
});

let globalEvaluationError = '';
try {
  vm.runInNewContext(combined, {
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Error,
    TypeError,
    Map,
    Set
  }, {
    filename: 'apps-script-v2-concatenated.gs',
    timeout: 5000
  });
} catch (error) {
  globalEvaluationError =
    String(error && error.stack || error).split('\n').slice(0, 3).join(' ');
}
check('GLOBAL_EVALUATION', !globalEvaluationError, {
  error: globalEvaluationError
});

const configContext = {};
vm.createContext(configContext);
vm.runInContext(
  records.find((record) => record.name === '00_Config.gs').source,
  configContext,
  { filename: '00_Config.gs' }
);
const config = configContext.WorkOsConfig;
const unresolvedConfig = new Set();
const configRefPattern = /\bWorkOsConfig((?:\.[A-Za-z_$][\w$]*)+)/g;
let configMatch;
while ((configMatch = configRefPattern.exec(combined)) !== null) {
  const chain = configMatch[1].slice(1).split('.');
  let current = config;
  let resolved = true;
  for (const key of chain) {
    if (
      current == null ||
      !(key in Object(current))
    ) {
      resolved = false;
      break;
    }
    current = current[key];
  }
  if (!resolved) unresolvedConfig.add(`WorkOsConfig.${chain.join('.')}`);
}
check('CONFIG_REFERENCES_RESOLVED', unresolvedConfig.size === 0, {
  unresolved: Array.from(unresolvedConfig).sort()
});

const namespaceDefinitions = new Set(
  topLevelSymbols.map((item) => item.name)
);
Array.from(combined.matchAll(/@typedef\s+\{[^}]+\}\s+(WorkOs[A-Z][A-Za-z0-9_$]*)/g))
  .forEach((match) => namespaceDefinitions.add(match[1]));
const namespaceReferences = new Set(
  Array.from(combined.matchAll(/\b(WorkOs[A-Z][A-Za-z0-9_$]*)\b/g))
    .map((match) => match[1])
);
const unresolvedNamespaces = Array.from(namespaceReferences)
  .filter((name) => !namespaceDefinitions.has(name))
  .sort();
check('WORKOS_NAMESPACES_RESOLVED', unresolvedNamespaces.length === 0, {
  unresolved: unresolvedNamespaces
});

const taskAppendSource = records.find((record) =>
  record.name === '08_TaskRepository.gs'
).source;
const appendFunctions = [
  'findLogicalEmptyRow',
  'insertTask'
].map((name) => {
  const match = taskAppendSource.match(new RegExp(
    `function ${name}\\([\\s\\S]*?(?=\\n  function |\\n  return Object\\.freeze)`
  ));
  return { name, source: match ? match[0] : '' };
});
check('NO_GET_LAST_ROW_TASK_APPEND_PATH', appendFunctions.every((item) =>
  !/\.getLastRow\s*\(/.test(item.source)
), {
  checked_functions: appendFunctions.map((item) => item.name),
  ledger_get_last_row_is_bounded: /function readAuthorityLedgerContext[\s\S]*?AUTHORITY_LEDGER_MAX_DATA_ROWS/.test(
    taskAppendSource
  )
});
check('AUTHORITY_LEDGER_BOUNDED_RECOVERY_CONTRACT',
  /AUTHORITY_LEDGER_MAX_DATA_ROWS/.test(taskAppendSource) &&
  /AUTHORITY_LEDGER_CHUNK_ROWS/.test(taskAppendSource) &&
  /function reconcileMissingAuthorityRecords/.test(taskAppendSource) &&
  /ORPHANED/.test(taskAppendSource),
  {}
);
check('NO_SIMPLE_ONEDIT', !/^function\s+onEdit\s*\(/m.test(combined), {});

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /AIza[0-9A-Za-z_-]{20,}/g,
  /ya29\.[A-Za-z0-9_-]{20,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /https?:\/\/[^/\s:@]+:[^@\s/]+@/g,
  /https:\/\/(?:docs\.google\.com\/(?:spreadsheets|document)|drive\.google\.com|script\.google\.com|calendar\.google\.com)\//g
];
const reviewedSyntheticFixtures = [
  'Authorization: Bearer abc.def token=secret-value API_KEY=top-secret',
  'Authorization: Bearer synthetic-secret-token',
  'https://user:password@example.invalid/?api_key=hidden'
];
const sourceScanRecords = records.concat([
  'appsscript.json',
  'README.md',
  'CHANGELOG.md',
  '.clasp.json.example'
].map((name) => ({
  name,
  source: fs.readFileSync(path.join(sourceRoot, name), 'utf8')
})));
const secretHits = [];
sourceScanRecords.forEach((record) => {
  let scanSource = record.source;
  if (record.name === '99_TestHarness.gs') {
    reviewedSyntheticFixtures.forEach((fixture) => {
      scanSource = scanSource.split(fixture).join('');
    });
  }
  secretPatterns.forEach((pattern) => {
    pattern.lastIndex = 0;
    if (pattern.test(scanSource)) {
      secretHits.push({ file: record.name, pattern: pattern.source });
    }
  });
});
check('SOURCE_SECRET_SCAN', secretHits.length === 0, {
  files_checked: sourceScanRecords.length,
  real_secret_hits: secretHits,
  reviewed_synthetic_fixtures: reviewedSyntheticFixtures.length
});

const failed = checks.filter((item) => item.status === 'FAIL');
process.stdout.write(`${JSON.stringify({
  suite: 'validate_apps_script_v2',
  environment: 'LOCAL_STATIC_AND_VM',
  google_workspace_real: 'NOT_EXECUTED',
  files: files,
  passed: checks.length - failed.length,
  failed: failed.length,
  checks
}, null, 2)}\n`);
if (failed.length) {
  process.exitCode = 1;
}
