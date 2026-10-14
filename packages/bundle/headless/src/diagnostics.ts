/** Source-owned English and Japanese human diagnostics. Parameters retain original diagnostic data. */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  headlessSummaryCannotReadSeqBelowCapturedLength: (value0: string, value1: string) => `headless summary cannot read seq ${value0} below captured length ${value1}`,
  headlessAdoptionCannotReadSeqBelowCapturedLength: (value0: string, value1: string) => `headless adoption cannot read seq ${value0} below captured length ${value1}`,
  sessionRecordsAMalformedAgentPresetSelectedEventAnd: (value0: string) => `session "${value0}" records a malformed agent-preset/selected event and cannot be adopted`,
  sessionRunsUnderAgentPresetWhichTheOneShot: (value0: string, value1: string) => `session "${value0}" runs under agent preset "${value1}", which the one-shot runner does not compose`,
  sessionIsASubagentOrForkedSessionAndCannot: (value0: string) => `session "${value0}" is a subagent or forked session and cannot be driven directly`,
  sessionRecordedNoWorkingDirectorySoItCannotBe: (value0: string) => `session "${value0}" recorded no working directory, so it cannot be adopted`,
  sessionWasRecordedInNot: (value0: string, value1: string, value2: string) => `session "${value0}" was recorded in "${value1}", not "${value2}"`,
  headlessSessionIdRequiresTheSessionPersistenceServiceTheSession: 'headless --session-id requires the sessionPersistence service; the Session would not survive this process',
  headlessSessionIdRequiresTheSessionQueryServiceDshBase: 'headless --session-id requires the sessionQuery service; dsh-base provides it',
  sessionIsLiveInThisProcessSoTheOne: (value0: string) => `session "${value0}" is live in this process, so the one-shot runner cannot own an exclusive run interval`,
  sessionDoesNotExistOmitSessionIdToStart: (value0: string) => `session "${value0}" does not exist; omit --session-id to start a new Session`,
  headlessRunnerSessionIdMustNotBeBlank: 'headless-runner: sessionId must not be blank',
  aTaskIsRequiredForExampleDshProfileHeadless: 'a task is required, for example: dsh --profile headless "run the tests"',
  headlessRunnerTheLauncherMustProvideCtxAppExitBefore: 'headless-runner: the launcher must provide ctx.appExit before the tree mounts',
  examplesDshProfileHeadlessRunTheTestsAnswerOne: '\nExamples:\n  dsh --profile headless "run the tests"          answer one task and exit\n  echo "run the tests" | dsh --profile headless   read the task from stdin\n  dsh --profile headless --json "run the tests"   emit machine-readable run events\n  dsh --profile headless --session-id session-… "continue"   resume an existing Session\n',
  theTaskTextMultipleWordsAreJoinedBySpaces: 'the task text; multiple words are joined by spaces, and `-` reads stdin',
  adoptThePersistedSessionWithThisIdAnUnknown: 'adopt the persisted Session with this id; an unknown id is an error',
  writeNewlineDelimitedRunEventsToStdoutInsteadOf: 'write newline-delimited run events to stdout instead of the final message',
  showThisHelp: 'show this help',
  answerOneTaskAndExitTheAnswerGoesTo: 'Answer one task and exit; the answer goes to stdout and diagnostics to stderr.',
  errorMustBeTheOnlyTaskArgument: 'error: `-` must be the only task argument',
  errorATaskIsRequiredForExampleDshProfile: 'error: a task is required, for example: dsh --profile headless "run the tests"',
  errorSessionIdRequiresANonEmptySessionId: 'error: --session-id requires a non-empty session id',
  reasoning: 'dsh: reasoning:\n',
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  headlessSummaryCannotReadSeqBelowCapturedLength: (value0: string, value1: string) => `headless の集計で、記録済みの長さ ${value1} より前の seq ${value0} を読み取れません`,
  headlessAdoptionCannotReadSeqBelowCapturedLength: (value0: string, value1: string) => `headless の再開で、記録済みの長さ ${value1} より前の seq ${value0} を読み取れません`,
  sessionRecordsAMalformedAgentPresetSelectedEventAnd: (value0: string) => `セッション "${value0}" の agent-preset/selected イベントが不正なため再開できません`,
  sessionRunsUnderAgentPresetWhichTheOneShot: (value0: string, value1: string) => `セッション "${value0}" はエージェントプリセット "${value1}" を使用しますが、この単発実行には含まれていません`,
  sessionIsASubagentOrForkedSessionAndCannot: (value0: string) => `セッション "${value0}" はサブエージェントまたは分岐したセッションのため直接実行できません`,
  sessionRecordedNoWorkingDirectorySoItCannotBe: (value0: string) => `セッション "${value0}" に作業ディレクトリの記録がないため再開できません`,
  sessionWasRecordedInNot: (value0: string, value1: string, value2: string) => `セッション "${value0}" の作業ディレクトリは "${value1}" と記録されており、"${value2}" ではありません`,
  headlessSessionIdRequiresTheSessionPersistenceServiceTheSession: 'headless の --session-id には sessionPersistence サービスが必要です。この構成ではプロセス終了後にセッションが残りません',
  headlessSessionIdRequiresTheSessionQueryServiceDshBase: 'headless の --session-id には sessionQuery サービスが必要です。dsh-base に含まれています',
  sessionIsLiveInThisProcessSoTheOne: (value0: string) => `セッション "${value0}" はこのプロセスで実行中のため、単発実行が独占して操作することはできません`,
  sessionDoesNotExistOmitSessionIdToStart: (value0: string) => `セッション "${value0}" は存在しません。新規セッションを開始するには --session-id を省略してください`,
  headlessRunnerSessionIdMustNotBeBlank: 'headless-runner: sessionId を空にすることはできません',
  aTaskIsRequiredForExampleDshProfileHeadless: 'タスクが必要です。例: dsh --profile headless "テストを実行"',
  headlessRunnerTheLauncherMustProvideCtxAppExitBefore: 'headless-runner: 起動元はプラグインの読み込み前に ctx.appExit を提供する必要があります',
  examplesDshProfileHeadlessRunTheTestsAnswerOne: '\n使用例:\n  dsh --profile headless "テストを実行"          タスクに回答して終了\n  echo "テストを実行" | dsh --profile headless   標準入力からタスクを読み取り\n  dsh --profile headless --json "テストを実行"   機械可読の実行イベントを出力\n  dsh --profile headless --session-id session-… "続けて"   既存セッションを再開\n',
  theTaskTextMultipleWordsAreJoinedBySpaces: 'タスクの本文。複数の単語は空白で連結し、`-` は標準入力を読み取る',
  adoptThePersistedSessionWithThisIdAnUnknown: '指定 ID の保存済みセッションを再開する。存在しない ID はエラー',
  writeNewlineDelimitedRunEventsToStdoutInsteadOf: '最終メッセージの代わりに改行区切りの実行イベントを標準出力へ書き出す',
  showThisHelp: 'このヘルプを表示する',
  answerOneTaskAndExitTheAnswerGoesTo: '一つのタスクに回答して終了します。回答は標準出力、診断は標準エラー出力に書き出します。',
  errorMustBeTheOnlyTaskArgument: 'エラー: `-` を指定するときは他のタスク引数を指定できません',
  errorATaskIsRequiredForExampleDshProfile: 'エラー: タスクが必要です。例: dsh --profile headless "テストを実行"',
  errorSessionIdRequiresANonEmptySessionId: 'エラー: --session-id に空でないセッション ID を指定してください',
  reasoning: 'dsh: 推論:\n',
}

/**
 * Select one complete diagnostic catalog for an operation.
 * @param locale - captured invocation language; direct API callers default to their process locale.
 * @returns the English or Japanese catalog with identical keys and parameter lists.
 */
export function diagnosticMessages(
  locale: DiagnosticLocale = resolveDiagnosticLocale(process.env, Intl.DateTimeFormat().resolvedOptions().locale),
): Messages {
  return locale === 'ja' ? japanese : english
}
