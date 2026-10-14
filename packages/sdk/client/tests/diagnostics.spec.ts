/** Per-instance SDK diagnostic language through the fake runtime process. */
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { createProcessDeepSeekHarness, validatedSessionEvent } from '../src/api.ts'
import { createProcessHarnessClient, HarnessClient, SdkProtocolError, TransportClosedError } from '../src/client.ts'
import { resolveDshLaunch, type RuntimeProcessOptions } from '../src/launch.ts'
import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

function runtime(language: DiagnosticLocale, env: NodeJS.ProcessEnv = {}): RuntimeProcessOptions {
  return {
    command: process.execPath,
    args: ['--import', import.meta.resolve('tsx/esm'), fileURLToPath(new URL('./fake-runtime.ts', import.meta.url))],
    environment: () => ({ ...process.env, ...env }),
    description: 'fake runtime',
    initializeTimeoutMs: 5_000,
    language,
  }
}

describe('SDK diagnostic language', () => {
  it('captures selection per launch and propagates only the child DSH_LANG', () => {
    const env = { DSH_LANG: 'ja', LANG: 'en_US.UTF-8' }
    const ja = resolveDshLaunch({ dshBin: '/bin/dsh', env })
    const en = resolveDshLaunch({ dshBin: '/bin/dsh', env, language: 'en' })
    env.DSH_LANG = 'en'
    expect(ja.language).toBe('ja')
    expect(ja.environment().DSH_LANG).toBe('ja')
    expect(en.environment().DSH_LANG).toBe('en')
    expect(ja.description).toBe('dsh プロファイル "sdk"')
    expect(en.description).toBe('dsh profile "sdk"')
  })

  it('uses Chinese diagnostics for an explicit SDK instance language', async () => {
    const client = createProcessHarnessClient(runtime('zh', { FAKE_MALFORMED: '1' }))
    try {
      await expect(client.initialize({ cwd: process.cwd(), provider: 'fake', model: 'fake' }))
        .rejects.toThrow('initialize 未返回服务器标识：{}')
    } finally { await client.close() }
  })

  it('isolates simultaneous instances and preserves raw runtime errors', async () => {
    const ja = createProcessHarnessClient(runtime('ja', { FAKE_MALFORMED: '1' }))
    const en = createProcessHarnessClient(runtime('en', { FAKE_MALFORMED: '1' }))
    const raw = createProcessHarnessClient(runtime('ja', { FAKE_INIT_ERROR: '1' }))
    try {
      const params = { cwd: process.cwd(), provider: 'fake', model: 'fake' }
      await expect(ja.initialize(params)).rejects.toThrow('initialize がサーバー識別情報を返しませんでした: {}')
      await expect(en.initialize(params)).rejects.toThrow('initialize returned no server identity: {}')
      await expect(raw.initialize(params)).rejects.toMatchObject({ name: 'JsonRpcResponseError', code: 7, message: 'scripted init failure' })
      const subscription = ja.subscribe()
      subscription.close()
      await expect(subscription.next()).rejects.toMatchObject({ name: 'TransportClosedError', message: '通知の購読を閉じました' })
    } finally {
      await Promise.all([ja.close(), en.close(), raw.close()])
    }
    expect(() => { ja.start() }).toThrow(TransportClosedError)
    expect(() => { ja.start() }).toThrow('DeepSeek Harness ランタイムクライアントは閉じています')
  })

  it('uses the instance language for malformed event JSON without rewriting the payload', async () => {
    const harness = createProcessDeepSeekHarness(runtime('ja', { FAKE_MALFORMED_EVENT: '1' }))
    try {
      await expect(harness.run('test')).rejects.toThrow('session.event にイベントエンベロープがありません: 42')
    } finally {
      await harness.close()
    }
    expect(() => validatedSessionEvent(42, 'ja')).toThrow(SdkProtocolError)
  })

  it('propagates language to the child and preserves model text in high-level instances', async () => {
    const harness = createProcessDeepSeekHarness(runtime('en', { FAKE_ECHO_ENV: 'DSH_LANG', FAKE_TEXT: 'raw answer' }), { language: 'ja' })
    try {
      const result = await harness.run('test')
      expect(result.finalResponse).toBe('DSH_LANG=ja\nraw answer')
      expect(harness.client.language).toBe('ja')
    } finally {
      await harness.close()
    }
  })

  it('keeps method names and raw stderr in Japanese timeout diagnostics', async () => {
    const client = createProcessHarnessClient({ ...runtime('ja', { FAKE_HANG_PROMPT: '1', FAKE_STDERR: 'raw stderr' }), requestTimeoutMs: 50 })
    try {
      await client.initialize({ cwd: process.cwd(), provider: 'fake', model: 'fake' })
      await expect(client.prompt('raw-id', [])).rejects.toThrow(
        'fake runtime の session/prompt は 50ms 待機後にタイムアウトしました; 標準エラー末尾:\nraw stderr',
      )
    } finally {
      await client.close()
    }
  })

  it('retains raw malformed working-directory JSON and localizes prompt failures', async () => {
    const client = createProcessHarnessClient(runtime('ja', { FAKE_MALFORMED_DIRECTORY: '1', FAKE_MALFORMED_PROMPT: '1' }))
    try {
      await expect(client.getWorkingDirectory('raw-id')).rejects.toThrow(
        'session/working-directory/get が作業ディレクトリを返しませんでした: {"cwd":17}',
      )
      await expect(client.prompt('raw-id', [])).rejects.toThrow('session/prompt がメッセージ ID を返しませんでした: {}')
    } finally {
      await client.close()
    }
  })

  it('preserves initialization and cleanup causes under a Japanese summary', async () => {
    const first = new Error('raw initialization'), second = new Error('raw cleanup')
    const start = vi.spyOn(HarnessClient.prototype, 'start').mockImplementation(() => {})
    const initialize = vi.spyOn(HarnessClient.prototype, 'initialize').mockRejectedValue(first)
    const close = vi.spyOn(HarnessClient.prototype, 'close').mockRejectedValue(second)
    try {
      const harness = createProcessDeepSeekHarness(runtime('ja'))
      await expect(harness.start()).rejects.toMatchObject({
        name: 'AggregateError', message: 'DeepSeek Harness の初期化と後処理が失敗しました', errors: [first, second],
      })
    } finally {
      start.mockRestore()
      initialize.mockRestore()
      close.mockRestore()
    }
  })

  it.each([
    [{ type: 'turn/end', data: { reason: 17 } }, 'turn/end に終了理由のエンベロープがありません: 17'],
    [{ type: 'turn/end', data: { reason: { kind: 'aborted' } } }, 'turn/end の中止理由が不正です: {"kind":"aborted"}'],
    [{ type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'hook' } } } },
      'turn/end のフック中止理由が不正です: {"kind":"aborted","reason":{"kind":"hook"}}'],
    [{ type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'raw-reason' } } } },
      'turn/end の中止理由が不明です: {"kind":"aborted","reason":{"kind":"raw-reason"}}'],
    [{ type: 'assistant/message', data: { message: { content: 17 } } },
      'assistant/message イベントの内容が不正です: {"type":"assistant/message","data":{"message":{"content":17}}}'],
    [{ type: 'turn/end' }, 'turn/end イベントのデータが不正です: {"type":"turn/end"}'],
  ])('retains invalid event values in diagnostics (%j)', (value, message) => {
    expect(() => validatedSessionEvent(value, 'ja')).toThrow(message)
  })

  it.each(['user', 'parent', 'disposed', 'legacy', 'hook'])('accepts stable abort discriminators (%s)', (kind) => {
    const value = { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind, reason: 'raw reason' } } } }
    expect(validatedSessionEvent(value, 'ja')).toBe(value)
  })


  it('localizes spawn and exit summaries while retaining system errors and stderr', async () => {
    const missing = createProcessHarnessClient({ ...runtime('ja'), command: '/missing-dsh-localization-test-command' })
    const subscription = missing.subscribe()
    try {
      await expect(missing.request('initialize', {}, 5000)).rejects.toThrow('起動エラー: spawn /missing-dsh-localization-test-command ENOENT')
      await expect(subscription.next()).rejects.toThrow('DeepSeek Harness ランタイムを起動できませんでした')
    } finally {
      await missing.close()
    }
    const exiting = createProcessHarnessClient(runtime('ja', { FAKE_EXIT_BEFORE_INIT: '1', FAKE_STDERR: 'raw exit stderr' }))
    const exited = exiting.subscribe()
    try {
      await expect(exiting.request('initialize', {}, 5000)).rejects.toThrow('終了コード: 3')
      await expect(exited.next()).rejects.toThrow('DeepSeek Harness ランタイムが終了しました')
      await expect(exiting.request('later')).rejects.toThrow('DeepSeek Harness ランタイムは実行されていません')
    } finally {
      await exiting.close()
    }
  })

})
