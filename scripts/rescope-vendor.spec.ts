/** Recorded npm evidence stays intact while authored files and exact edits remain checked. */

import { describe, expect, it } from 'vitest'
import { exactEditState, isRescopeExcluded, isRescopeSkipped, rewriteRescopeReference } from './rescope-vendor.ts'

const ANCHOR = '\n## Sync procedure'
const INSERTED = `\n15. **rescope**: one log entry.\n${ANCHOR}`
const CORDIS_PRESET_ID = 'cord' + 'is'
const SCHEMASTERY_PACKAGE = 'schema' + 'stery'
const CORDIS_PACKAGE_SPECIFIERS = [
  "import { Context } from '" + CORDIS_PRESET_ID + "'",
  "import '" + CORDIS_PRESET_ID + "'",
  "await import('" + CORDIS_PRESET_ID + "')",
  "require('" + CORDIS_PRESET_ID + "')",
  "require.resolve('" + CORDIS_PRESET_ID + "')",
  "import.meta.resolve('" + CORDIS_PRESET_ID + "')",
  "vi.mock('" + CORDIS_PRESET_ID + "')",
  "jest.requireActual('" + CORDIS_PRESET_ID + "')",
  "vi.importActual('" + CORDIS_PRESET_ID + "')",
]

describe('rescope file selection', () => {
  it('preserves the recorded npm resolution', () => {
    expect(isRescopeExcluded('scripts/dependency-catalog/package-lock.json')).toBe(true)
  })

  it.each([
    'scripts/dependency-catalog/package.json',
    'scripts/dependency-catalog/source.ts',
    'scripts/other/package-lock.json',
    'packages/example/src/index.ts',
    'packages/example/package.json',
  ])('keeps %s subject to upstream package-name checks', (file) => {
    expect(isRescopeExcluded(file)).toBe(false)
  })

  it.each([
    'apps/cli/tests/optional-bundle-transitions.e2e.ts',
    'apps/web/tests/agent-preset-selection.e2e.ts',
    'apps/web/tests/developer-tools-settings.e2e.ts',
    'docs/subsystems/schedule.md',
    'docs/subsystems/schedule.zh.md',
    'docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.md',
    'docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.zh.md',
    'docs/user/guide/schedule.md',
    'docs/user/guide/schedule.zh.md',
    'packages/bundle/web-app/cordis.patch.yml',
    'packages/client/ui-agent-preset/src/client/CreatePluginMenuItem.tsx',
    'packages/client/ui-agent-preset/tests/components.client.spec.tsx',
    'packages/client/ui-agent-preset/tests/create-plugin-menu-item.client.spec.tsx',
    'packages/client/ui-agent-preset/tests/section-store.client.spec.ts',
    'packages/extensions/cordis-host-runner/tests/inspect-registry.spec.ts',
    'snapshots/session/cordis-inspect-liveness/client-fixture.mjs',
    'snapshots/session/cordis-inspect-timeout/client-fixture.mjs',
    'docs/upgrade-guide/v0.2.1-alpha.1/subagent-preset-composition/guide.md',
    'docs/upgrade-guide/v0.2.1-alpha.1/subagent-preset-composition/guide.zh.md',
  ])('preserves the Cordis product identifier in %s', (file) => {
    expect(isRescopeSkipped(file, CORDIS_PRESET_ID)).toBe(true)
    for (const packageSpecifier of CORDIS_PACKAGE_SPECIFIERS) {
      for (const name of [CORDIS_PRESET_ID, `@deepseek-ai/${CORDIS_PRESET_ID}`, `@deepseek-ai/${CORDIS_PRESET_ID}/src/index`]) {
        expect(isRescopeSkipped(file, CORDIS_PRESET_ID, packageSpecifier.replace(CORDIS_PRESET_ID, name))).toBe(false)
      }
    }
    const mixed = `const id = '${CORDIS_PRESET_ID}'; const module = await import('${CORDIS_PRESET_ID}')`
    expect(isRescopeSkipped(file, CORDIS_PRESET_ID, mixed, mixed.indexOf(`'${CORDIS_PRESET_ID}'`))).toBe(true)
    expect(isRescopeSkipped(file, CORDIS_PRESET_ID, mixed, mixed.lastIndexOf(`'${CORDIS_PRESET_ID}'`))).toBe(false)
    expect(isRescopeSkipped(file, SCHEMASTERY_PACKAGE)).toBe(false)
  })
})

it('round trips package references while retaining mixed product identifiers', () => {
  const file = 'apps/cli/tests/optional-bundle-transitions.e2e.ts'
  const original = `const id = '${CORDIS_PRESET_ID}'; const module = await import('${CORDIS_PRESET_ID}/src/index')`
  const scoped = original.replace(`import('${CORDIS_PRESET_ID}/`, `import('@deepseek-ai/${CORDIS_PRESET_ID}/`)
  expect(rewriteRescopeReference(original, file)).toBe(scoped)
  expect(rewriteRescopeReference(scoped, file, true)).toBe(original)
  expect(rewriteRescopeReference(scoped, file)).toBe(scoped)
  const yaml = 'packages/bundle/web-app/cordis.patch.yml'
  const upstream = `- name: ${CORDIS_PRESET_ID}`
  const renamed = `- name: @deepseek-ai/${CORDIS_PRESET_ID}`
  expect(rewriteRescopeReference(upstream, yaml)).toBe(renamed)
  expect(rewriteRescopeReference(renamed, yaml, true)).toBe(upstream)
})

describe('exactEditState', () => {
  it('classifies an insertion by its target form, so a duplicate is invalid', () => {
    expect(exactEditState(`log\n${ANCHOR}\n`, ANCHOR, INSERTED, 1)).toBe('pending')
    expect(exactEditState(`log${INSERTED}\n`, ANCHOR, INSERTED, 1)).toBe('applied')
    // The anchor survives an insertion, so counting the source form would have
    // called this pending and inserted the entry a second time.
    expect(exactEditState(`log${INSERTED}${INSERTED}\n`, ANCHOR, INSERTED, 1)).toBe('invalid')
    expect(exactEditState('log\n', ANCHOR, INSERTED, 1)).toBe('invalid')
  })

  it('classifies a deletion by its source form, and requires its remainder to survive', () => {
    const remainder = 'exclude:\n'
    const withEntries = 'exclude:\n  - cordis@4\n'
    expect(exactEditState(withEntries, withEntries, remainder, 1)).toBe('pending')
    expect(exactEditState(remainder, withEntries, remainder, 1)).toBe('applied')
    // Upstream dropped the whole field: the source form is gone, but so is the
    // remainder, so this is a moved site rather than a completed deletion.
    expect(exactEditState('unrelated:\n', withEntries, remainder, 1)).toBe('invalid')
  })

  it('requires a replacement to leave no source form and the exact target count', () => {
    expect(exactEditState('a = 1\n', 'a = 1', 'b = 2', 1)).toBe('pending')
    expect(exactEditState('b = 2\n', 'a = 1', 'b = 2', 1)).toBe('applied')
    expect(exactEditState('b = 2\nb = 2\n', 'a = 1', 'b = 2', 1)).toBe('invalid')
    // A moved or partially applied site: neither state is complete.
    expect(exactEditState('a = 1\nb = 2\n', 'a = 1', 'b = 2', 1)).toBe('invalid')
    expect(exactEditState('x\n', 'a = 1', 'b = 2', 1)).toBe('invalid')
  })
})
