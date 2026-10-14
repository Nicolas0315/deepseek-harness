/** Pure diagnostic catalogs shared by Host operations and browser-safe registry parsing. */
import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  pnpmWorkspaceYamlMustBeAYAMLMapping: 'pnpm-workspace.yaml must be a YAML mapping',
  allowbuildsMustBeAYAMLMapping: 'allowBuilds must be a YAML mapping',
  allowbuildsMustNotContainYAMLAnchorsOrAliases: 'allowBuilds must not contain YAML anchors or aliases',
  noRegistryWasAsked: 'no registry was asked',
  officialBundleSourceDSHInstallationRequiresItsCompleteWorkspace: (value0: string, value1: string) => `Official bundle ${value0}: source DSH installation ${value1} requires its complete workspace checkout`,
  officialBundleExpectedOneWorkspacePackageInFoundRestore: (value0: string, value1: string, value2: string) => `Official bundle ${value0}: expected one workspace package in ${value1}, found ${value2}; restore the checkout and run pnpm install`,
  officialBundleMustDeclareAPublicBundleAtDSH: (value0: string, value1: string, value2: string) => `Official bundle ${value0}: ${value1} must declare a public bundle at DSH version ${value2}`,
  officialBundleBuiltRuntimeIsMissingInRunPnpm: (value0: string, value1: string, value2: string) => `Official bundle ${value0}: built runtime is missing in ${value1}; run pnpm install and pnpm run build in ${value2}`,
  officialBundleBundlePatchIsMissingRestoreTheCheckout: (value0: string, value1: string) => `Official bundle ${value0}: bundle patch ${value1} is missing; restore the checkout`,
  profilePatchMustBeAYAMLSequence: 'Profile patch must be a YAML sequence',
  aRegistryMustBeAnHttpSURL: (value0: string) => `a registry must be an http(s) URL: ${value0}`,
  plainDependency: (value0: string) => `dsh: warning: ${value0} declares no dsh.bundle — installed as a plain dependency, not a profile layer
`,
  invalidRunRecord: (value0: string) => `dsh: ${value0} does not name a package run; delete it once no earlier package operation is still running in this profile
`,
  activeRun: (value0: string, value1: string, value2: string) => `dsh: process ${value0}, started by an earlier package operation whose own process ended, is still running in this profile; wait for it or stop it, then retry. If process ${value1} is not that package run, delete ${value2}.
`,
  installationRejected: (value0: string, value1: string) => `
dsh: installation rejected: ${value0}
dsh: ${value1}.
`,
  nothingInstalled: 'nothing was installed',
  pnpmOutputCut: 'dsh: pnpm output was cut short after its process exited\n',
  pnpmStalled: (value0: string) => `dsh: pnpm printed nothing for ${value0}ms and was terminated
`,
  pnpmFailed: 'pnpm failed',
  validateInstalledFailed: (value0: string, value1: string) => `Cannot validate installed package ${value0}: ${value1}`,
  installedButDenied: (value0: string) => `
dsh: warning: ${value0}
dsh: it stays installed but profile startup denies it until you grant an exemption for those exact versions.
`,
  restoredInstallation: 'restored package.json, pnpm-lock.yaml, and node_modules',
  restoreIncomplete: "restored package.json and pnpm-lock.yaml, but node_modules could not be reinstalled; run 'dsh plugin install'",
  profileInitialized: (value0: string, value1: string) => `dsh: initialized profile ${value0} at ${value1}
`,
  connectionTimeout: (value0: string, value1: string) => `dsh: connection to ${value0} timed out after ${value1}ms
`,
  githubConnectionFailed: 'GitHub connection check failed',
  installCancelled: 'Installation cancelled',
  missingTarball: 'the tarball does not exist',
  missingPath: 'the path does not exist',
  unreadablePackage: (value0: string) => `no readable package.json at the path: ${value0}`,
  unnamedPackage: 'the package.json names no package',
  alreadyInstalled: (value0: string) => `${value0} is already installed`,
  notBundle: (value0: string) => `${value0} declares no dsh.bundle`,
  viewTimeout: (value0: string) => `pnpm view timed out after ${value0}ms`,
  viewFailed: (value0: string) => `pnpm view exited with ${value0}`,
  viewUnreadable: (value0: string) => `unreadable pnpm view output: ${value0}`,
  viewNoPackage: 'pnpm view answered no package',
  pendingBuildsUnreadable: 'Could not read pending build approvals after pnpm failed',
  emptySpec: 'the package spec must not be empty',
  absolutePathRequired: 'a local path must be absolute',
  gitOrTarballRequired: 'a URL must point at a git repository or a tarball',
  invalidPackageName: 'not a package name the registry accepts',
  emptyVersion: 'a version after @ must not be empty',
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  pnpmWorkspaceYamlMustBeAYAMLMapping: 'pnpm-workspace.yaml は YAML マッピングにしてください',
  allowbuildsMustBeAYAMLMapping: 'allowBuilds は YAML マッピングにしてください',
  allowbuildsMustNotContainYAMLAnchorsOrAliases: 'allowBuilds に YAML のアンカーやエイリアスを含めることはできません',
  noRegistryWasAsked: 'レジストリへの問い合わせが行われていません',
  officialBundleSourceDSHInstallationRequiresItsCompleteWorkspace: (value0: string, value1: string) => `公式バンドル ${value0}: DSH のソースインストール ${value1} にはワークスペース全体のチェックアウトが必要です`,
  officialBundleExpectedOneWorkspacePackageInFoundRestore: (value0: string, value1: string, value2: string) => `公式バンドル ${value0}: ${value1} にあるワークスペースパッケージは一つ必要ですが、${value2} 個見つかりました。チェックアウトを復元して pnpm install を実行してください`,
  officialBundleMustDeclareAPublicBundleAtDSH: (value0: string, value1: string, value2: string) => `公式バンドル ${value0}: ${value1} は DSH バージョン ${value2} の公開バンドルを宣言する必要があります`,
  officialBundleBuiltRuntimeIsMissingInRunPnpm: (value0: string, value1: string, value2: string) => `公式バンドル ${value0}: ${value1} にビルド済みの実行ファイルがありません。${value2} で pnpm install と pnpm run build を実行してください`,
  officialBundleBundlePatchIsMissingRestoreTheCheckout: (value0: string, value1: string) => `公式バンドル ${value0}: バンドルのパッチ ${value1} がありません。チェックアウトを復元してください`,
  profilePatchMustBeAYAMLSequence: 'プロファイルのパッチは YAML のシーケンスにしてください',
  aRegistryMustBeAnHttpSURL: (value0: string) => `レジストリは HTTP(S) URL にしてください: ${value0}`,
  plainDependency: (value0: string) => `dsh: 警告: ${value0} は dsh.bundle を宣言していないため、プロファイルの設定ではなく通常の依存パッケージとしてインストールしました
`,
  invalidRunRecord: (value0: string) => `dsh: ${value0} はパッケージ操作の実行記録ではありません。このプロファイルで以前のパッケージ操作が実行中でないことを確認してから削除してください
`,
  activeRun: (value0: string, value1: string, value2: string) => `dsh: 以前のパッケージ操作が開始したプロセス ${value0} が、このプロファイルでまだ実行中です。操作の親プロセスは終了しています。完了を待つか停止してから再実行してください。プロセス ${value1} がその操作と無関係であれば ${value2} を削除してください。
`,
  installationRejected: (value0: string, value1: string) => `
dsh: インストールを拒否しました: ${value0}
dsh: ${value1}。
`,
  nothingInstalled: '何もインストールしていません',
  pnpmOutputCut: 'dsh: pnpm プロセスの終了後に出力の読み取りを打ち切りました\n',
  pnpmStalled: (value0: string) => `dsh: pnpm が ${value0}ms 出力しなかったため停止しました
`,
  pnpmFailed: 'pnpm に失敗しました',
  validateInstalledFailed: (value0: string, value1: string) => `インストール済みパッケージ ${value0} を検証できません: ${value1}`,
  installedButDenied: (value0: string) => `
dsh: 警告: ${value0}
dsh: インストールは維持しますが、正確なバージョンの例外を許可するまでプロファイルの起動時に使用を拒否します。
`,
  restoredInstallation: 'package.json、pnpm-lock.yaml、node_modules を復元しました',
  restoreIncomplete: "package.json と pnpm-lock.yaml を復元しましたが、node_modules を再インストールできませんでした。'dsh plugin install' を実行してください",
  profileInitialized: (value0: string, value1: string) => `dsh: プロファイル ${value0} を ${value1} に作成しました
`,
  connectionTimeout: (value0: string, value1: string) => `dsh: ${value0} への接続が ${value1}ms でタイムアウトしました
`,
  githubConnectionFailed: 'GitHub への接続確認に失敗しました',
  installCancelled: 'インストールをキャンセルしました',
  missingTarball: 'tarball が存在しません',
  missingPath: 'パスが存在しません',
  unreadablePackage: (value0: string) => `このパスの package.json を読み取れません: ${value0}`,
  unnamedPackage: 'package.json にパッケージ名がありません',
  alreadyInstalled: (value0: string) => `${value0} はインストール済みです`,
  notBundle: (value0: string) => `${value0} は dsh.bundle を宣言していません`,
  viewTimeout: (value0: string) => `pnpm view が ${value0}ms でタイムアウトしました`,
  viewFailed: (value0: string) => `pnpm view が終了コード ${value0} で終了しました`,
  viewUnreadable: (value0: string) => `pnpm view の出力を読み取れません: ${value0}`,
  viewNoPackage: 'pnpm view がパッケージを返しませんでした',
  pendingBuildsUnreadable: 'pnpm の失敗後にビルド許可待ちの一覧を読み取れませんでした',
  emptySpec: 'パッケージの指定を空にすることはできません',
  absolutePathRequired: 'ローカルパスは絶対パスで指定してください',
  gitOrTarballRequired: 'URL は Git リポジトリまたは tarball を指定してください',
  invalidPackageName: 'レジストリが受け付けるパッケージ名ではありません',
  emptyVersion: '@ の後にバージョンを指定してください',
}

/**
 * Read one catalog without consulting process state.
 * @param locale - language captured by the caller.
 * @returns messages with matching keys and parameter lists.
 */
export function diagnosticCatalog(locale: DiagnosticLocale): Messages {
  return locale === 'ja' ? japanese : english
}
