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
    expect(resolveDshLaunch({ dshBin: '/bin/dsh', language: 'zh', profile: '日本語-profile' }).description).toBe('dsh 配置文件 "日本語-profile"')
  })

  it('uses Chinese diagnostics for an explicit SDK instance language', async () => {
    const client = createProcessHarnessClient(runtime('zh', { FAKE_MALFORMED: '1' }))
    try {
      await expect(client.initialize({ cwd: process.cwd(), provider: 'fake', model: 'fake' }))
        .rejects.toThrow('initialize 未返回服务器标识：{}')
    } finally { await client.close() }
  })

  it.each(['ja', 'zh'] as const)('isolates simultaneous instances and preserves raw runtime errors (%s)', async (language) => {
    const localized = createProcessHarnessClient(runtime(language, { FAKE_MALFORMED: '1' }))
    const en = createProcessHarnessClient(runtime('en', { FAKE_MALFORMED: '1' }))
    const raw = createProcessHarnessClient(runtime(language, { FAKE_INIT_ERROR: '1' }))
    try {
      const params = { cwd: process.cwd(), provider: 'fake', model: 'fake' }
      await expect(localized.initialize(params)).rejects.toThrow((language === 'ja' ? 'initialize がサーバー識別情報を返しませんでした: {}' : 'initialize 未返回服务器标识：{}'))
      await expect(en.initialize(params)).rejects.toThrow('initialize returned no server identity: {}')
      await expect(raw.initialize(params)).rejects.toMatchObject({ name: 'JsonRpcResponseError', code: 7, message: 'scripted init failure' })
      const subscription = localized.subscribe()
      subscription.close()
      await expect(subscription.next()).rejects.toMatchObject({ name: 'TransportClosedError', message: (language === 'ja' ? '通知の購読を閉じました' : '通知订阅已关闭') })
    } finally {
      await Promise.all([localized.close(), en.close(), raw.close()])
    }
    await expect(localized.subscribe().next()).rejects.toThrow(language === 'ja' ? 'DeepSeek Harness ランタイムを閉じました' : 'DeepSeek Harness 运行时已关闭')
    expect(() => { localized.start() }).toThrow(TransportClosedError)
    expect(() => { localized.start() }).toThrow((language === 'ja' ? 'DeepSeek Harness ランタイムクライアントは閉じています' : 'DeepSeek Harness 运行时客户端已关闭'))
  })

  it.each(['ja', 'zh'] as const)('uses the instance language for malformed event JSON without rewriting the payload (%s)', async (language) => {
    const harness = createProcessDeepSeekHarness(runtime(language, { FAKE_MALFORMED_EVENT: '1' }))
    try {
      await expect(harness.run('test')).rejects.toThrow((language === 'ja' ? 'session.event にイベントエンベロープがありません: 42' : 'session.event 未包含事件封装：42'))
    } finally {
      await harness.close()
    }
    expect(() => validatedSessionEvent(42, language)).toThrow(SdkProtocolError)
  })

  it.each(['ja', 'zh'] as const)('propagates language to the child and preserves model text in high-level instances (%s)', async (language) => {
    const harness = createProcessDeepSeekHarness(runtime('en', { FAKE_ECHO_ENV: 'DSH_LANG', FAKE_TEXT: 'raw answer' }), { language })
    try {
      const result = await harness.run('test')
      expect(result.finalResponse).toBe(`DSH_LANG=${language}\nraw answer`)
      expect(harness.client.language).toBe(language)
    } finally {
      await harness.close()
    }
  })

  it.each(['ja', 'zh'] as const)('keeps method names and raw stderr in localized timeout diagnostics (%s)', async (language) => {
    const client = createProcessHarnessClient({ ...runtime(language, { FAKE_HANG_PROMPT: '1', FAKE_STDERR: 'raw stderr' }), requestTimeoutMs: 50 })
    try {
      await client.initialize({ cwd: process.cwd(), provider: 'fake', model: 'fake' })
      await expect(client.prompt('raw-id', [])).rejects.toThrow(
        (language === 'ja' ? 'fake runtime の session/prompt は 50ms 待機後にタイムアウトしました; 標準エラー末尾:\nraw stderr' : 'fake runtime 的 session/prompt 等待 50ms 后超时; 标准错误末尾：\nraw stderr'),
      )
    } finally {
      await client.close()
    }
  })

  it.each(['ja', 'zh'] as const)('retains raw malformed working-directory JSON and localizes prompt failures (%s)', async (language) => {
    const client = createProcessHarnessClient(runtime(language, { FAKE_MALFORMED_DIRECTORY: '1', FAKE_MALFORMED_PROMPT: '1' }))
    try {
      await expect(client.getWorkingDirectory('raw-id')).rejects.toThrow(
        (language === 'ja' ? 'session/working-directory/get が作業ディレクトリを返しませんでした: {"cwd":17}' : 'session/working-directory/get 未返回工作目录：{"cwd":17}'),
      )
      await expect(client.prompt('raw-id', [])).rejects.toThrow((language === 'ja' ? 'session/prompt がメッセージ ID を返しませんでした: {}' : 'session/prompt 未返回消息 ID：{}'))
    } finally {
      await client.close()
    }
  })

  it.each(['ja', 'zh'] as const)('preserves initialization and cleanup causes under a localized summary (%s)', async (language) => {
    const first = new Error('raw initialization'), second = new Error('raw cleanup')
    const start = vi.spyOn(HarnessClient.prototype, 'start').mockImplementation(() => {})
    const initialize = vi.spyOn(HarnessClient.prototype, 'initialize').mockRejectedValue(first)
    const close = vi.spyOn(HarnessClient.prototype, 'close').mockRejectedValue(second)
    try {
      const harness = createProcessDeepSeekHarness(runtime(language))
      await expect(harness.start()).rejects.toMatchObject({
        name: 'AggregateError', message: (language === 'ja' ? 'DeepSeek Harness の初期化と後処理が失敗しました' : 'DeepSeek Harness 初始化和清理失败'), errors: [first, second],
      })
    } finally {
      start.mockRestore()
      initialize.mockRestore()
      close.mockRestore()
    }
  })

  it.each(['en', 'ja', 'zh'] as const)('retains invalid event values in localized diagnostics (%s)', (language) => {
    const cases = [
      { value: { type: 'turn/end', data: { reason: 17 } }, raw: '17', text: {
        en: 'turn/end carried no reason envelope', ja: 'turn/end に終了理由のエンベロープがありません', zh: 'turn/end 未包含原因封装',
      } },
      { value: { type: 'turn/end', data: { reason: { kind: 'aborted' } } }, raw: '{"kind":"aborted"}', text: {
        en: 'turn/end carried a malformed aborted reason', ja: 'turn/end の中止理由が不正です', zh: 'turn/end 包含格式错误的中止原因',
      } },
      { value: { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'hook' } } } }, raw: '{"kind":"aborted","reason":{"kind":"hook"}}', text: {
        en: 'turn/end carried a malformed hook abort reason', ja: 'turn/end のフック中止理由が不正です', zh: 'turn/end 包含格式错误的钩子中止原因',
      } },
      { value: { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind: 'raw-reason' } } } }, raw: '{"kind":"aborted","reason":{"kind":"raw-reason"}}', text: {
        en: 'turn/end carried an unknown abort reason', ja: 'turn/end の中止理由が不明です', zh: 'turn/end 包含未知中止原因',
      } },
      { value: { type: 'assistant/message', data: { message: { content: 17 } } }, raw: '{"type":"assistant/message","data":{"message":{"content":17}}}', text: {
        en: 'assistant/message event carried malformed content', ja: 'assistant/message イベントの内容が不正です', zh: 'assistant/message 事件包含格式错误的内容',
      } },
      { value: { type: 'turn/end' }, raw: '{"type":"turn/end"}', text: {
        en: 'turn/end event carried malformed data', ja: 'turn/end イベントのデータが不正です', zh: 'turn/end 事件包含格式错误的数据',
      } },
    ]
    for (const { value, raw, text } of cases) {
      expect(() => validatedSessionEvent(value, language)).toThrow(text[language])
      expect(() => validatedSessionEvent(value, language)).toThrow(raw)
    }
  })

  it.each(['user', 'parent', 'disposed', 'legacy', 'hook'])('accepts stable abort discriminators (%s)', (kind) => {
    const value = { type: 'turn/end', data: { reason: { kind: 'aborted', reason: { kind, reason: 'raw reason' } } } }
    expect(validatedSessionEvent(value, 'ja')).toBe(value)
  })


  it.each(['ja', 'zh'] as const)('localizes spawn and exit summaries while retaining system errors and stderr (%s)', async (language) => {
    const missing = createProcessHarnessClient({ ...runtime(language), command: '/missing-dsh-localization-test-command' })
    const subscription = missing.subscribe()
    try {
      await expect(missing.request('initialize', {}, 5000)).rejects.toThrow((language === 'ja' ? '起動エラー: spawn /missing-dsh-localization-test-command ENOENT' : '启动错误：spawn /missing-dsh-localization-test-command ENOENT'))
      await expect(subscription.next()).rejects.toThrow((language === 'ja' ? 'DeepSeek Harness ランタイムを起動できませんでした' : 'DeepSeek Harness 运行时启动失败'))
    } finally {
      await missing.close()
    }
    const exiting = createProcessHarnessClient(runtime(language, { FAKE_EXIT_BEFORE_INIT: '1', FAKE_STDERR: 'raw exit stderr' }))
    const exited = exiting.subscribe()
    try {
      await expect(exiting.request('initialize', {}, 5000)).rejects.toThrow((language === 'ja' ? '終了コード: 3' : '退出代码：3'))
      await expect(exited.next()).rejects.toThrow((language === 'ja' ? 'DeepSeek Harness ランタイムが終了しました' : 'DeepSeek Harness 运行时已退出'))
      await expect(exiting.request('later')).rejects.toThrow((language === 'ja' ? 'DeepSeek Harness ランタイムは実行されていません' : 'DeepSeek Harness 运行时未运行'))
    } finally {
      await exiting.close()
    }
  })

})
