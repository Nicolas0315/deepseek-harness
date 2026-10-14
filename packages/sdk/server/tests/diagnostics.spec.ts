/** SDK-owned diagnostics preserve JSON-RPC identities and peer text. */
import { Context } from '@deepseek-ai/cordis'
import { PassThrough } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { JsonRpcLineTransport } from '@deepseek-ai/dsh-sdk-protocol'
import { HarnessSdkJsonRpcServer } from '../src/server.ts'

describe('SDK server diagnostic language', () => {
  it('localizes owned failures per server while retaining method names and wire codes', async () => {
    const toServer = new PassThrough()
    const toClient = new PassThrough()
    const serverTransport = new JsonRpcLineTransport(toServer, toClient, 'ja')
    const clientTransport = new JsonRpcLineTransport(toClient, toServer, 'en')
    const ja = new HarnessSdkJsonRpcServer(new Context(), serverTransport, { language: 'ja' })
    const en = new HarnessSdkJsonRpcServer(new Context(), clientTransport, { language: 'en' })
    serverTransport.onRequest((method, params) => ja.handleRequest(method, params))
    serverTransport.start()
    clientTransport.start()
    try {
      await expect(clientTransport.request('unknown/method', {})).rejects.toMatchObject({
        name: 'JsonRpcResponseError', code: -32603,
        message: '不明な DeepSeek Harness SDK ランタイムメソッドです: unknown/method',
      })
      await expect(ja.handleRequest('session/wait', {})).rejects.toThrow('session/wait には文字列の sessionId が必要です')
      await expect(en.handleRequest('session/wait', {})).rejects.toThrow('session/wait requires a sessionId string')
      await expect(ja.initialize({ cwd: process.cwd(), provider: 'raw-provider', model: 'model' }))
        .rejects.toThrow('プロバイダー "raw-provider" のアダプターが登録されていません')
      await expect(ja.prompt({ sessionId: 'raw-id', contentBlocks: [] })).rejects.toThrow('SDK サーバーが初期化されていません')
      await expect(ja.handleRequest('initialize', { cwd: '.', provider: 'raw', model: 'raw', reasoningEffort: '' }))
        .rejects.toThrow('initialize の reasoningEffort は空でない文字列である必要があります')
      await expect(ja.handleRequest('initialize', { cwd: '.', provider: 'raw', model: 'raw', maxTokens: 0 }))
        .rejects.toThrow('initialize の maxTokens は正の安全な整数である必要があります')
      await expect(ja.handleRequest('session/working-directory/get', { sessionId: '' }))
        .rejects.toThrow('working-directory リクエストには空でない sessionId が必要です')
      await expect(ja.handleRequest('session/working-directory/set', { sessionId: 'raw-id' }))
        .rejects.toThrow('working-directory set には文字列の path が必要です')

    } finally {
      await Promise.all([ja.shutdown(), en.shutdown()])
      serverTransport.close()
      clientTransport.close()
    }
  })
})
