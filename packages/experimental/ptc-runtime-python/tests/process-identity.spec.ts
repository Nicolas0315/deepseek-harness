import { afterEach, describe, expect, it, vi } from 'vitest'
import { readProcessStart } from '../src/index.ts'

const procRead = vi.hoisted(() => vi.fn<() => string>())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    readFileSync(...args: Parameters<typeof actual.readFileSync>) {
      if (args[0] === '/proc/42424242/stat') return procRead()
      return actual.readFileSync(...args)
    },
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  procRead.mockReset()
})

describe('Python worker process identity', () => {
  it('reads field 22 after a process name containing closing parentheses', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
    procRead.mockReturnValue('42424242 (worker ) with ) spaces) S 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 87654321 23 24')
    expect(readProcessStart(42424242)).toBe('87654321')
    expect(procRead).toHaveBeenCalledOnce()
  })

  it('permits teardown when the process has already disappeared', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('linux')
    procRead.mockImplementation(() => {
      throw Object.assign(new Error('process exited'), { code: 'ENOENT' })
    })
    expect(readProcessStart(42424242)).toBeUndefined()
    expect(procRead).toHaveBeenCalledOnce()
  })

  it('does not access procfs on Darwin', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
    expect(readProcessStart(42424242)).toBeUndefined()
    expect(procRead).not.toHaveBeenCalled()
  })
})
