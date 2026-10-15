/** SDK-owned diagnostics preserve JSON-RPC identities and peer text. */
import { Context } from '@deepseek-ai/cordis'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol'
import { HarnessSdkJsonRpcServer } from '../src/server.ts'

describe('SDK server diagnostic language', () => {
  it.each(['en', 'ja', 'zh'] as const)('localizes owned failures per server while retaining method names and wire codes (%s)', async (language) => {
    const toServer = new PassThrough()
    const toClient = new PassThrough()
    const serverTransport = new JsonRpcLineTransport(toServer, toClient, language)
    const clientTransport = new JsonRpcLineTransport(toClient, toServer, 'en')
    const localized = new HarnessSdkJsonRpcServer(new Context(), serverTransport, { language })
    const en = new HarnessSdkJsonRpcServer(new Context(), clientTransport, { language: 'en' })
    serverTransport.onRequest((method, params) => localized.handleRequest(method, params))
    serverTransport.start()
    clientTransport.start()
    try {
      await expect(clientTransport.request('unknown/method', {})).rejects.toMatchObject({
        name: 'JsonRpcResponseError', code: -32603,
        message: { en: 'unknown DeepSeek Harness SDK runtime method: unknown/method', ja: '不明な DeepSeek Harness SDK ランタイムメソッドです: unknown/method', zh: '未知 DeepSeek Harness SDK 运行时方法：unknown/method' }[language],
      })
      await expect(localized.handleRequest('session/wait', {})).rejects.toThrow({ en: 'session/wait requires a sessionId string', ja: 'session/wait には文字列の sessionId が必要です', zh: 'session/wait 需要字符串 sessionId' }[language])
      await expect(en.handleRequest('session/wait', {})).rejects.toThrow('session/wait requires a sessionId string')
      await expect(localized.initialize({ cwd: process.cwd(), provider: 'raw-provider', model: 'model' }))
        .rejects.toThrow({ en: 'no adapter registered for provider "raw-provider"', ja: 'プロバイダー "raw-provider" のアダプターが登録されていません', zh: '没有为提供方“raw-provider”注册适配器' }[language])
      await expect(localized.prompt({ sessionId: 'raw-id', contentBlocks: [] })).rejects.toThrow({ en: 'SDK server is not initialized', ja: 'SDK サーバーが初期化されていません', zh: 'SDK 服务器未初始化' }[language])
      await expect(localized.handleRequest('initialize', { cwd: '.', provider: 'raw', model: 'raw', reasoningEffort: '' }))
        .rejects.toThrow({ en: 'initialize reasoningEffort must be a non-empty string', ja: 'initialize の reasoningEffort は空でない文字列である必要があります', zh: 'initialize 的 reasoningEffort 必须是非空字符串' }[language])
      await expect(localized.handleRequest('initialize', { cwd: '.', provider: 'raw', model: 'raw', maxTokens: 0 }))
        .rejects.toThrow({ en: 'initialize maxTokens must be a positive safe integer', ja: 'initialize の maxTokens は正の安全な整数である必要があります', zh: 'initialize 的 maxTokens 必须是正安全整数' }[language])
      await expect(localized.handleRequest('session/working-directory/get', { sessionId: '' }))
        .rejects.toThrow({ en: 'working-directory requests require a non-empty sessionId', ja: 'working-directory リクエストには空でない sessionId が必要です', zh: 'working-directory 请求需要非空 sessionId' }[language])
      await expect(localized.handleRequest('session/working-directory/set', { sessionId: 'raw-id' }))
        .rejects.toThrow({ en: 'working-directory set requires a path string', ja: 'working-directory set には文字列の path が必要です', zh: 'working-directory set 需要字符串 path' }[language])
      await expect(localized.handleRequest('session/resume', { sessionId: '' })).rejects.toThrow({
        en: 'session/resume requires a non-empty sessionId string',
        ja: 'session/resume には空でない文字列の sessionId が必要です',
        zh: 'session/resume 需要非空字符串 sessionId',
      }[language])
    } finally {
      await Promise.all([localized.shutdown(), en.shutdown()])
      serverTransport.close()
      clientTransport.close()
    }
  })
})
