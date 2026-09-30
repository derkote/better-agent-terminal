import * as assert from 'node:assert/strict'

import {
  accountChipProviderOf,
  accountEventProvider,
  accountSwitchedEvent,
  cliRuntimeOf,
  usageProviderOf,
} from '../renderer/src/providers/account-routing.ts'
import { normalizeRemoteAuthCapabilities, supportsRemoteLogin } from '../renderer/src/utils/remote-auth.ts'
import { PROVIDER_MANIFEST } from '../shared/providers.mjs'

function testAccountChipProvider() {
  // Before the registry the chip covered exactly these presets (WorkspaceView
  // refreshAccountChip); Fugu had none and now gets its own provider's chip.
  const expected: Record<string, string | null> = {
    'claude-code': 'claude',
    'claude-code-v2': 'claude',
    'claude-code-worktree': 'claude',
    'claude-channel': 'claude',
    'claude-cli-agent': 'claude',
    'claude-cli': null,
    'claude-cli-worktree': null,
    'codex-agent': 'codex',
    'codex-agent-worktree': 'codex',
    'codex-fugu': 'fugu',
    'codex-cli': null,
    none: null,
  }
  for (const preset of PROVIDER_MANIFEST.presets) {
    assert.equal(accountChipProviderOf(preset.id), expected[preset.id], `chip provider of ${preset.id}`)
  }
  assert.equal(accountChipProviderOf(undefined), null)
  assert.equal(accountChipProviderOf('unknown-preset'), null)
}

function testAccountEvents() {
  assert.equal(accountSwitchedEvent('claude'), 'claude-account-switched')
  assert.equal(accountSwitchedEvent('codex'), 'codex-account-switched')
  assert.equal(accountSwitchedEvent('fugu'), 'fugu-account-switched')
  // Host broadcasts claude:account-changed {agent}; older hosts only send
  // claude/codex, and anything unrecognised was always treated as claude.
  assert.equal(accountEventProvider('codex'), 'codex')
  assert.equal(accountEventProvider('fugu'), 'fugu')
  assert.equal(accountEventProvider('claude'), 'claude')
  assert.equal(accountEventProvider(undefined), 'claude')
  assert.equal(accountEventProvider('something-else'), 'claude')
}

function testUsageAndRuntime() {
  assert.equal(usageProviderOf('claude'), 'claude')
  assert.equal(usageProviderOf('codex'), 'codex')
  assert.equal(usageProviderOf('fugu'), null)
  assert.equal(usageProviderOf(undefined), null)
  assert.equal(cliRuntimeOf('claude'), 'claude')
  assert.equal(cliRuntimeOf('codex'), 'codex')
  assert.equal(cliRuntimeOf('fugu'), 'codex')
  assert.equal(cliRuntimeOf('nope'), undefined)
}

function testRemoteLoginIsKeyedByAuthKind() {
  const current = normalizeRemoteAuthCapabilities({
    capabilities: { remoteAuth: { claude: 'paste-code-v1', codex: 'device-code-v1', fugu: 'paste-code-v1' } },
  })
  assert.deepEqual(current, { claude: 'paste-code-v1', codex: 'device-code-v1' },
    'only providers with a remote sign-in ceremony are kept')
  assert.equal(supportsRemoteLogin(current, 'claude'), true)
  assert.equal(supportsRemoteLogin(current, 'codex'), true)
  // API-key providers have no remote sign-in ceremony.
  assert.equal(supportsRemoteLogin({ fugu: 'paste-code-v1' }, 'fugu'), false)
  assert.equal(supportsRemoteLogin(current, 'nope'), false)
}

testAccountChipProvider()
testAccountEvents()
testUsageAndRuntime()
testRemoteLoginIsKeyedByAuthKind()
console.log('provider-accounts: passed')
