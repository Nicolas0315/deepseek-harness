/**
 * The one-shot app's command-line provider: it parses the task positional,
 * `--session-id`, `--json`, and `--help`, then publishes
 * {@link HEADLESS_STARTUP_SERVICE}. The runner is an ordinary consumer whose
 * lazy config waits for that service.
 * @module @deepseek-ai/dsh-headless/startup
 */

import { diagnosticMessages } from './diagnostics.ts'
import { Command, CommanderError } from 'commander'
import type { Context } from '@deepseek-ai/cordis'
import { parseCmdline, resolveCommandLocale } from '@deepseek-ai/dsh-cmdline'
import { boundJsonLine } from './json-stream.ts'
import { internals } from './startup-internals.ts'

/** Stable Cordis plugin name. */
export const name = 'headless-startup'

/** Services required before the task can be resolved. */
export const inject = ['cmdlineArgs']

/** Service provided by this plugin and injected by the one-shot runner. */
export const HEADLESS_STARTUP_SERVICE = 'headlessStartup'

/** What the runner row reads from {@link HEADLESS_STARTUP_SERVICE}. */
export interface HeadlessStartupValues {
  /** The task text this invocation asked for; absent when the runner reads stdin. */
  task: string | undefined
  /** Exact Session identity to adopt; absent for a fresh random identity. */
  sessionId: string | undefined
  /** Whether stdout carries the machine-readable event stream instead of final text. */
  json: boolean
}

/**
 * This app's command: the task positional, its options, and its help text.
 * @returns a fresh program, so one process can parse more than once (tests).
 */
function headlessCommand(messages: ReturnType<typeof diagnosticMessages>): Command {
  return new Command()
    .name('dsh --profile headless')
    .description(messages.answerOneTaskAndExitTheAnswerGoesTo)
    .helpOption('-h, --help', messages.showThisHelp)
    .option('--json', messages.writeNewlineDelimitedRunEventsToStdoutInsteadOf)
    .option('--session-id <id>', messages.adoptThePersistedSessionWithThisIdAnUnknown)
    .argument('[task...]', messages.theTaskTextMultipleWordsAreJoinedBySpaces)
    .addHelpText('after', messages.examplesDshProfileHeadlessRunTheTestsAnswerOne)
}

/**
 * Whether the raw invocation asks for the machine-readable stream. The scan
 * stops at `--` and skips a `--session-id` value, so a literal `--json` used as
 * an option value or a positional never installs the JSON error override.
 * @param argv - the invocation's raw arguments.
 * @returns whether `--json` is a real flag of this invocation.
 */
function jsonRequested(argv: readonly string[]): boolean {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--') return false
    if (argument === '--json') return true
    if (argument === '--session-id') index += 1
  }
  return false
}

/**
 * Parse and provide the one-shot task as an ordinary Cordis service. The
 * command's action publishes the task; a missing task on an interactive stdin
 * is a usage error, so on rejection (and on `--help`) nothing is provided.
 * @param ctx - plugin context carrying the command line.
 */
export function apply(ctx: Context): void {
  const messages = diagnosticMessages(resolveCommandLocale(ctx))
  const program = headlessCommand(messages)
  // The raw snapshot decides the JSON contract: Commander rejects a grammar
  // error (an unknown option, a missing option value) before the action runs,
  // and such a rejection still owes a --json caller the error event.
  if (jsonRequested(ctx.get('cmdlineArgs')?.get() ?? [])) {
    program.error = (message: string, errorOptions?: Parameters<Command['error']>[1]): never => {
      // The event message matches the runner's runtime errors, which carry no
      // commander `error: ` prefix.
      const payload = boundJsonLine({ type: 'error', message: message.replace(/^error: /, '') })
      internals.stdout.write(`${payload}\n`)
      // The JSON contract keeps stderr to `dsh:` diagnostics, so commander's
      // own print of this message must not run; throwing the same control-flow
      // error still leaves through the launcher's exit path.
      throw new CommanderError(1, errorOptions?.code ?? 'commander.error', message)
    }
  }
  program.action(() => {
    if (program.args.length > 1 && program.args.includes('-')) {
      program.error(messages.errorMustBeTheOnlyTaskArgument)
    }
    const joined = program.args.join(' ')
    if (program.args.length > 0 && joined.trim() === '') {
      program.error(messages.errorATaskIsRequiredForExampleDshProfile)
    }
    const task = program.args.length === 0 ? undefined : joined
    if (task === undefined && internals.stdinIsTty()) {
      program.error(messages.errorATaskIsRequiredForExampleDshProfile)
    }
    const options = program.opts<{ json?: boolean; sessionId?: string }>()
    // A SessionId is opaque, so whitespace is part of the identity: validate
    // emptiness on the trimmed value but hand the runner the exact string.
    const sessionId = options.sessionId
    if (sessionId !== undefined && sessionId.trim() === '') {
      program.error(messages.errorSessionIdRequiresANonEmptySessionId)
    }
    ctx.provide(HEADLESS_STARTUP_SERVICE, {
      task,
      sessionId,
      json: options.json === true,
    } satisfies HeadlessStartupValues)
  })
  parseCmdline(ctx, program)
}
