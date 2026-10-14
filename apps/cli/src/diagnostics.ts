/** Source-owned English and Japanese human diagnostics. Parameters retain original diagnostic data. */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  selectAProfileOnlyOnce: 'select a profile only once',
  errorProfileDesktopIsManagedExclusivelyByTheElectron: 'error: profile "desktop" is managed exclusively by the Electron application',
  errorPatchNeedsAPath: 'error: --patch needs a path',
  errorFromDefaultProfileNeedsAName: 'error: --from-default-profile needs a name',
  errorDumpConfigDumpDefaultConfigAndDumpConfig: 'error: --dump-config, --dump-default-config, and --dump-config-schema are mutually exclusive',
  errorConfigDumpsTakeNoAppArgumentsGot: (value0: string) => `error: config dumps take no app arguments, got ${value0}`,
  errorDumpDefaultConfigPrintsTheBundleLayersAnd: 'error: --dump-default-config prints the bundle layers and takes no --patch',
  printTheProfileTreeWithoutItsUserLayerOr: 'print the profile tree without its user layer or --patch overlays and exit',
  printJSONSchemaForProfileEntriesAndPatchesWithout: 'print JSON Schema for profile entries and patches without mounting',
  printTheComposedProfileTreeAndExit: 'print the composed profile tree and exit',
  extraPatchListOverlayAppliedAfterTheProfileLayer: 'extra patch-list overlay applied after the profile layer (repeatable)',
  initializeANewCustomProfileFromAShippedProfile: 'initialize a new custom profile from a shipped profile template',
  theProfileUnderDSHHOMEProfilesToBoot: 'the profile under $DSH_HOME/profiles to boot',
  argumentsForTheBootedProfileSAppSeeDsh: "arguments for the booted profile's app (see: dsh --profile <name> --help)",
  dshBootADeepSeekHarnessProfileAnOrderedStack: 'dsh: boot a DeepSeek Harness profile — an ordered stack of plugin-bundle patch layers under your own overrides.',
  outputTheVersionNumber: 'output the version number',
  errorProfileNameIsRequired: 'error: --profile <name> is required',
  errorProfileNeedsAName: 'error: --profile needs a name',
  manageAProfileSPluginsByForwardingTheRemaining: "manage a profile's plugins by forwarding the remaining arguments to pnpm in the profile directory",
  pnpmArgumentsForwardedVerbatimAddPkgRemovePkgWhy: 'pnpm arguments, forwarded verbatim (add <pkg>, remove <pkg>, why <pkg>, ...)',
  theProfileWhosePluginsToManageInitializedOnFirst: 'the profile whose plugins to manage (initialized on first use)',
  showThisHelp: 'show this help',
  errorPluginNeedsPnpmArgumentsToForwardEG: 'error: plugin needs pnpm arguments to forward (e.g. add <package>)',
  dshNoInvocationResolved: 'dsh: no invocation resolved',
  dshUnhandledInvocationMode: (value0: string) => `dsh: unhandled invocation mode ${value0}`,
  openDeepSeekHarnessDesktopOnceToInitializeItsProfile: 'Open DeepSeek Harness Desktop once to initialize its profile, then fully quit it before running dsh plugin --profile desktop.',
  unexpectedArgument: (value0: string) => `unexpected argument ${value0}`,
  usageDshPluginVersionExemptions: 'usage: dsh plugin version-exemptions',
  usageDshPluginPackageVersionDshVersionExact: (value0: string, value1: string) => `usage: dsh plugin ${value0} <package@version> --dsh-version <exact>${value1}`,
  unknownDefaultProfileExpectedOneOf: (value0: string, value1: string, value2: string) => `${value0}: unknown default profile ${value1}; expected one of ${value2}`,
  profileIsShippedAndCannotBeACustomProfile: (value0: string, value1: string) => `${value0}: profile ${value1} is shipped and cannot be a custom profile target; omit --from-default-profile to use it`,
  profileAlreadyExistsAtOmitFromDefaultProfileTo: (value0: string, value1: string, value2: string) => `${value0}: profile ${value1} already exists at ${value2}; omit --from-default-profile to use it`,
  profileDirectoryAlreadyExistsChooseAnUnusedProfileName: (value0: string, value1: string) => `${value0}: profile directory ${value1} already exists; choose an unused profile name`,
  profileInitializationFailedAndCouldNotBeRemoved: (value0: string, value1: string) => `${value0}: profile initialization failed and ${value1} could not be removed`,
  dshProfileCleanupFailed: 'dsh: profile cleanup failed',
  dshProfileStartupAndCleanupFailed: 'dsh: profile startup and cleanup failed',
  launcherExamples: "\nExamples:\n  dsh web                                   boot the web profile (same as: dsh --profile web)\n  dsh rescue --from-default-profile web\n                                            create rescue from the shipped web template, then boot it\n  dsh headless \"run the tests\"              answer one task, print the result, and exit\n  dsh tui --patch ./extra.yml               boot a custom profile with one extra overlay\n  dsh tui --resume <session>                arguments after the launcher flags reach the app\n  dsh web --help                            the web app's own flags and help\n  dsh plugin --profile tui add <package>    install a plugin into the tui profile\n",
  compatibilityRisk: 'dsh: warning: allowing incompatible plugin versions can break the application or corrupt data. Approval applies only to the exact package and DSH versions.\n',
  warning: (value0: string) => `dsh: warning: ${value0}
`,
  allowed: 'allowed',
  revoked: 'revoked',
  exemptionChanged: (value0: string, value1: string, value2: string) => `dsh: ${value0} ${value1} for DSH ${value2}
`,
  pnpmMissing: 'dsh: pnpm was not found; install pnpm and make it available on PATH.\n',
  acceptVersionRisk: (value0: string, value1: string, value2: string, value3: string) => `dsh: to accept the risk, run: dsh plugin --profile ${value0} allow-version ${value1}@${value2} --dsh-version ${value3} --accept-risk
`,
  pluginFailed: (value0: string) => `dsh: plugin command failed; diagnostics: ${value0}
`,
  gitBuildApproval: (value0: string) => `dsh: git-hosted plugins build on install via their prepare script, which pnpm blocks until allowed — add the exact key pnpm printed above under allowBuilds in ${value0}, then re-run
`,
  diagnosticWarning: 'WARNING: Raw diagnostics may contain configuration or credential values from plugin errors. Review before sharing.\n\n',
  diagnosticSaveFailed: (value0: string, value1: string) => `
dsh: warning: could not write startup diagnostics: ${value0}
Full diagnostics:
${value1}`,
  diagnosticSaved: (value0: string) => `
Full diagnostics: ${value0}
`,
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  selectAProfileOnlyOnce: 'プロファイルは一度だけ指定してください',
  errorProfileDesktopIsManagedExclusivelyByTheElectron: 'エラー: プロファイル "desktop" は Electron アプリケーションが専用で管理します',
  errorPatchNeedsAPath: 'エラー: --patch にパスを指定してください',
  errorFromDefaultProfileNeedsAName: 'エラー: --from-default-profile に名前を指定してください',
  errorDumpConfigDumpDefaultConfigAndDumpConfig: 'エラー: --dump-config、--dump-default-config、--dump-config-schema は同時に指定できません',
  errorConfigDumpsTakeNoAppArgumentsGot: (value0: string) => `エラー: 設定ダンプにはアプリの引数を指定できません。指定された引数: ${value0}`,
  errorDumpDefaultConfigPrintsTheBundleLayersAnd: 'エラー: --dump-default-config はバンドルの設定だけを出力するため --patch を指定できません',
  printTheProfileTreeWithoutItsUserLayerOr: 'ユーザー設定と --patch を除いたプロファイル設定を出力して終了する',
  printJSONSchemaForProfileEntriesAndPatchesWithout: 'プラグインを起動せず、プロファイルのエントリーとパッチの JSON Schema を出力する',
  printTheComposedProfileTreeAndExit: '合成したプロファイル設定を出力して終了する',
  extraPatchListOverlayAppliedAfterTheProfileLayer: 'プロファイル設定の後に適用する追加パッチ（複数回指定可能）',
  initializeANewCustomProfileFromAShippedProfile: '同梱テンプレートから新しいカスタムプロファイルを作成する',
  theProfileUnderDSHHOMEProfilesToBoot: '起動する $DSH_HOME/profiles 内のプロファイル',
  argumentsForTheBootedProfileSAppSeeDsh: '起動するアプリへの引数（参照: dsh --profile <name> --help）',
  dshBootADeepSeekHarnessProfileAnOrderedStack: 'dsh: DeepSeek Harness のプロファイルを起動します。バンドルのパッチを順に適用し、ユーザー設定で上書きします。',
  outputTheVersionNumber: 'バージョン番号を表示する',
  errorProfileNameIsRequired: 'エラー: --profile <name> が必要です',
  errorProfileNeedsAName: 'エラー: --profile に名前を指定してください',
  manageAProfileSPluginsByForwardingTheRemaining: 'プロファイル内で残りの引数を pnpm に渡してプラグインを管理する',
  pnpmArgumentsForwardedVerbatimAddPkgRemovePkgWhy: 'そのまま渡す pnpm の引数（add <pkg>、remove <pkg>、why <pkg> など）',
  theProfileWhosePluginsToManageInitializedOnFirst: 'プラグインを管理するプロファイル（初回利用時に作成）',
  showThisHelp: 'このヘルプを表示する',
  errorPluginNeedsPnpmArgumentsToForwardEG: 'エラー: plugin には pnpm に渡す引数が必要です（例: add <package>）',
  dshNoInvocationResolved: 'dsh: 実行する操作を決定できませんでした',
  dshUnhandledInvocationMode: (value0: string) => `dsh: 未対応の実行モード ${value0}`,
  openDeepSeekHarnessDesktopOnceToInitializeItsProfile: 'DeepSeek Harness Desktop を一度開いてプロファイルを作成し、完全に終了してから dsh plugin --profile desktop を実行してください。',
  unexpectedArgument: (value0: string) => `未対応の引数 ${value0}`,
  usageDshPluginVersionExemptions: '使い方: dsh plugin version-exemptions',
  usageDshPluginPackageVersionDshVersionExact: (value0: string, value1: string) => `使い方: dsh plugin ${value0} <package@version> --dsh-version <exact>${value1}`,
  unknownDefaultProfileExpectedOneOf: (value0: string, value1: string, value2: string) => `${value0}: 不明な同梱プロファイル ${value1}。次から選択してください: ${value2}`,
  profileIsShippedAndCannotBeACustomProfile: (value0: string, value1: string) => `${value0}: ${value1} は同梱プロファイルのためカスタムプロファイルの作成先にできません。利用する場合は --from-default-profile を省略してください`,
  profileAlreadyExistsAtOmitFromDefaultProfileTo: (value0: string, value1: string, value2: string) => `${value0}: プロファイル ${value1} は ${value2} に既に存在します。利用する場合は --from-default-profile を省略してください`,
  profileDirectoryAlreadyExistsChooseAnUnusedProfileName: (value0: string, value1: string) => `${value0}: プロファイルのディレクトリ ${value1} は既に存在します。未使用の名前を選んでください`,
  profileInitializationFailedAndCouldNotBeRemoved: (value0: string, value1: string) => `${value0}: プロファイルの作成に失敗し、${value1} も削除できませんでした`,
  dshProfileCleanupFailed: 'dsh: プロファイルの終了処理に失敗しました',
  dshProfileStartupAndCleanupFailed: 'dsh: プロファイルの起動と終了処理に失敗しました',
  launcherExamples: '\n使用例:\n  dsh web                                   web プロファイルを起動（dsh --profile web と同じ）\n  dsh rescue --from-default-profile web\n                                            同梱の web テンプレートから rescue を作成して起動\n  dsh headless "テストを実行"              一つのタスクに回答し、結果を出力して終了\n  dsh tui --patch ./extra.yml               追加パッチを適用してカスタムプロファイルを起動\n  dsh tui --resume <session>                起動元のオプション以降の引数をアプリへ渡す\n  dsh web --help                            web アプリ独自のオプションとヘルプ\n  dsh plugin --profile tui add <package>    tui プロファイルにプラグインをインストール\n',
  compatibilityRisk: 'dsh: 警告: 非互換のプラグインを許可するとアプリの障害やデータ破損が生じる可能性があります。許可は正確なプラグインと DSH のバージョンの組み合わせだけに適用されます。\n',
  warning: (value0: string) => `dsh: 警告: ${value0}
`,
  allowed: '許可しました',
  revoked: '取り消しました',
  exemptionChanged: (value0: string, value1: string, value2: string) => `dsh: DSH ${value2} に対する ${value1} の例外を${value0}
`,
  pnpmMissing: 'dsh: pnpm が見つかりません。pnpm をインストールし、PATH から実行できるようにしてください。\n',
  acceptVersionRisk: (value0: string, value1: string, value2: string, value3: string) => `dsh: リスクを了承して例外を許可する場合は次を実行してください: dsh plugin --profile ${value0} allow-version ${value1}@${value2} --dsh-version ${value3} --accept-risk
`,
  pluginFailed: (value0: string) => `dsh: プラグインの操作に失敗しました。診断ログ: ${value0}
`,
  gitBuildApproval: (value0: string) => `dsh: Git からのプラグインはインストール時に prepare スクリプトでビルドします。許可するまで pnpm が実行を禁止します。上に pnpm が表示した正確なキーを ${value0} の allowBuilds に追加して、再実行してください。
`,
  diagnosticWarning: '警告: 診断原文には、プラグインのエラーに含まれる設定値や認証情報が記録される可能性があります。共有する前に内容を確認してください。\n\n',
  diagnosticSaveFailed: (value0: string, value1: string) => `
dsh: 警告: 起動時の診断を書き込めませんでした: ${value0}
診断の全文:
${value1}`,
  diagnosticSaved: (value0: string) => `
診断の全文: ${value0}
`,
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
