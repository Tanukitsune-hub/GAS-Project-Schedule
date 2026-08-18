'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..', '..', '..');
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const workflowNames = fs.readdirSync(workflowDirectory)
  .filter((name) => /\.(?:yml|yaml)$/i.test(name))
  .sort();
const workflow = fs.readFileSync(path.join(workflowDirectory, 'ci.yml'), 'utf8');
const attributes = fs.readFileSync(path.join(repositoryRoot, '.gitattributes'), 'utf8');

assert.deepStrictEqual(workflowNames, ['ci.yml']);
assert.match(workflow, /^name:\s*CI\s*$/m);
assert.match(workflow, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
assert.match(workflow, /node-version:\s*22/);
assert.match(workflow, /pnpm run verify:ci/);
assert.doesNotMatch(workflow, /\bclasp\b/i);
assert.doesNotMatch(workflow, /\bsecrets\b/i);
assert.doesNotMatch(workflow, /google(?:[_ -]?(?:credential|auth|token|secret))/i);
assert.match(attributes, /apps-script-v2\/\*\* text eol=lf/);
assert.match(attributes, /release\/\*\* text eol=lf/);

process.stdout.write(`${JSON.stringify({
  suite: 'ci_workflow_contract',
  passed: 10,
  failed: 0,
  policy: 'non_google_ci_only'
}, null, 2)}\n`);
