/**
 * The web app's command-line provider: it parses the `dsh --profile web` flag
 * family (`--host`, `--port`, `--public-url`, `--trusted-host`, `--no-open`, TLS)
 * and its `--help` text, then provides the immutable values as
 * {@link WEB_STARTUP_SERVICE}. Ordinary rows inject that service before
 * reading it from lazy config.
 * @module @deepseek-ai/dsh-web-app/startup
 */

import { diagnosticMessages } from './diagnostics.ts'
import { Command } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline, resolveCommandLocale } from '@deepseek-ai/dsh-cmdline'
import { isWildcardHost, type TlsConfig } from '@deepseek-ai/dsh-host-webserver'
import { parsePublicUrl } from './public-url.ts'

/** Stable Cordis plugin name. */
export const name = 'web-startup'

/** Services required before the flags can be resolved. */
export const inject = ['cmdlineArgs']

/** Service provided by this ordinary plugin and injected by flag-configured rows. */
export const WEB_STARTUP_SERVICE = 'webStartup'

/** What the web rows read from {@link WEB_STARTUP_SERVICE}. */
export interface WebStartupValues {
  /** Whether this invocation opens the default browser after startup. */
  openBrowser: boolean
  /** `--host`, absent when the invocation did not name one. */
  host?: string
  /** `--port`, absent when the invocation did not name one. */
  port?: number
  /**
   * `--public-url`, absent when not specified: the advertised HTTP(S) root.
   * See [public deployments](../README.md#public-deployments).
   */
  publicUrl?: string
  /** Explicit `--trusted-host` authorities, in argument order. */
  trustedHosts: string[]
  /** Server certificate chain and unencrypted private key supplied together. */
  tls?: TlsConfig
}

/** The web flag family, as commander parsed it. */
interface WebOptions {
  host?: string
  open: boolean
  port?: string
  publicUrl?: string
  trustedHost?: string[]
  tlsCert?: string
  tlsKey?: string
}

/**
 * This app's command: its flags, its description, and its help text.
 * @returns a fresh program, so one process can parse more than once (tests).
 */
function webCommand(messages: ReturnType<typeof diagnosticMessages>): Command {
  return new Command()
    .name('dsh --profile web')
    .description(messages.serveTheDeepSeekHarnessBrowserUI)
    .helpOption('-h, --help', messages.showThisHelp)
    .option('--host <host>', messages.bindAddressOneConcreteIPv4OrIPv6LiteralOf)
    .option('--no-open', messages.doNotOpenTheWebUIInTheDefault)
    .option('--port <port>', messages.listenPortPassToLetTheOSPickA)
    .option('--public-url <url>', messages.advertiseThisHTTPSRootInThePrintedOpened)
    .option('--trusted-host <authority...>', messages.extraAuthorityTheApiBrowserTrustFenceAcceptsHost)
    .option('--tls-cert <file>', messages.pemServerCertificateChainRequiresTlsKey)
    .option('--tls-key <file>', messages.unencryptedPEMPrivateKeyRequiresTlsCert)
    .addHelpText('after', messages.examplesDshProfileWebServeOnTheComposedHost)
}

/**
 * Parse and provide the Web invocation as an ordinary Cordis service. The
 * command's action publishes the flags this invocation named. Invalid flags,
 * including an unpaired TLS certificate or key, are usage errors; rejection
 * and `--help` provide no service.
 * @param ctx - plugin context carrying the command line.
 */
export function apply(ctx: Context): void {
  const messages = diagnosticMessages(resolveCommandLocale(ctx))
  const program = webCommand(messages)
  program.action(() => {
    const options = program.opts<WebOptions>()
    if (options.host !== undefined && isWildcardHost(options.host)) {
      program.error(messages.errorHostIsAnUnspecifiedWildcardAddressWhichIs(options.host))
    }
    if (options.port !== undefined && !/^\d+$/.test(options.port)) {
      program.error(messages.errorPortMustBeANumberGot(JSON.stringify(options.port)))
    }
    let tls: TlsConfig | undefined
    if (options.tlsCert !== undefined && options.tlsKey !== undefined) {
      tls = { certFile: options.tlsCert, keyFile: options.tlsKey }
    } else if (options.tlsCert !== undefined || options.tlsKey !== undefined) {
      program.error(messages.errorTlsCertAndTlsKeyMustBeSupplied)
    }
    if (options.publicUrl !== undefined) {
      try {
        parsePublicUrl(options.publicUrl, '--public-url', messages)
      } catch (error) {
        program.error(messages.error((error as Error).message))
      }
    }
    ctx.provide(WEB_STARTUP_SERVICE, {
      openBrowser: options.open,
      ...options.host !== undefined && { host: options.host },
      ...options.port !== undefined && { port: Number(options.port) },
      ...options.publicUrl !== undefined && { publicUrl: options.publicUrl },
      ...tls !== undefined && { tls },
      trustedHosts: options.trustedHost ?? [],
    } satisfies WebStartupValues)
  })
  parseCmdline(ctx, program)
}
