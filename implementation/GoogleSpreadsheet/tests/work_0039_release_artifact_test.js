'use strict';

const verifier = require('../tools/verify_work_0039_release');

// Work 0039 remains frozen after a successor becomes CURRENT_CONTRACT.
// Exercise the original verifier against its exact accepted release source.
const fs = require('node:fs');
const path = require('node:path');
const sourceCommit = '7c8b4c7709ab00b4d315f910b9271f3c4945b702';
const provenance = JSON.parse(fs.readFileSync(path.join(__dirname,
  '../release/work-0039-single-file-company-install/BUNDLE_PROVENANCE.json'), 'utf8'));
const result = {
  source_commit: sourceCommit,
  phase8b: verifier.verifyPackage({ packageName: 'v2.8.26-prepilot', phase8b: true, sourceCommit }),
  phase8c: verifier.verifyPackage({ packageName: 'v2.8.26-prepilot-phase8c', phase8b: false, sourceCommit }),
  bundle: verifier.verifyBundle(sourceCommit, provenance.prepared_at),
  reproducibility: verifier.verifyReproducibility(sourceCommit, provenance.prepared_at)
};
process.stdout.write(`${JSON.stringify({
  suite: 'work_0039_release_artifact',
  environment: 'LOCAL_NON_GOOGLE_RELEASE_AND_BUNDLE_VALIDATION',
  status: 'PASS',
  source_commit: result.source_commit,
  phase8b_payload_files: result.phase8b.payload_file_count,
  phase8c_payload_files: result.phase8c.payload_file_count,
  bundle_source_files: result.bundle.source_file_count,
  two_paste_order: ['Code.gs', 'appsscript.json'],
  txt_transport: 'BYTE_IDENTICAL',
  reproducibility: result.reproducibility.deterministic_rebuild,
  live_google_workspace: 'NOT_EXECUTED',
  real_gemini_request: 'NOT_EXECUTED',
  real_openai_request: 'NOT_EXECUTED'
}, null, 2)}\n`);
