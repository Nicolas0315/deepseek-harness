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

const chinese: Messages = {
  pnpmWorkspaceYamlMustBeAYAMLMapping: 'pnpm-workspace.yaml 必须是 YAML 映射',
  allowbuildsMustBeAYAMLMapping: 'allowBuilds 必须是 YAML 映射',
  allowbuildsMustNotContainYAMLAnchorsOrAliases: 'allowBuilds 不得包含 YAML 锚点或别名',
  noRegistryWasAsked: '未查询任何 registry',
  officialBundleSourceDSHInstallationRequiresItsCompleteWorkspace: (value0: string, value1: string) => `官方 bundle ${value0}：源码 DSH 安装 ${value1} 需要完整的 workspace 检出目录`,
  officialBundleExpectedOneWorkspacePackageInFoundRestore: (value0: string, value1: string, value2: string) => `官方 bundle ${value0}：应在 ${value1} 中找到一个 workspace package，实际找到 ${value2} 个；请恢复检出目录并运行 pnpm install`,
  officialBundleMustDeclareAPublicBundleAtDSH: (value0: string, value1: string, value2: string) => `官方 bundle ${value0}：${value1} 必须在 DSH 版本 ${value2} 声明公开 bundle`,
  officialBundleBuiltRuntimeIsMissingInRunPnpm: (value0: string, value1: string, value2: string) => `官方 bundle ${value0}：${value1} 中缺少已构建的运行时；请在 ${value2} 中运行 pnpm install 和 pnpm run build`,
  officialBundleBundlePatchIsMissingRestoreTheCheckout: (value0: string, value1: string) => `官方 bundle ${value0}：缺少 bundle patch ${value1}；请恢复检出目录`,
  profilePatchMustBeAYAMLSequence: 'Profile patch 必须是 YAML 序列',
  aRegistryMustBeAnHttpSURL: (value0: string) => `registry 必须是 http(s) URL：${value0}`,
  plainDependency: (value0: string) => `dsh：警告：${value0} 未声明 dsh.bundle——已作为普通依赖安装，而非 profile 层
`,
  invalidRunRecord: (value0: string) => `dsh：${value0} 未命名 package 运行；此 profile 中不再有早先 package 操作运行后再删除它
`,
  activeRun: (value0: string, value1: string, value2: string) => `dsh：由早先 package 操作启动的进程 ${value0} 在此 profile 中仍运行，其父进程已结束；请等待或停止后重试。若进程 ${value1} 不是该 package 运行，请删除 ${value2}。
`,
  installationRejected: (value0: string, value1: string) => `
dsh：安装被拒绝：${value0}
dsh：${value1}。
`,
  nothingInstalled: '未安装任何内容',
  pnpmOutputCut: 'dsh：pnpm 进程结束后输出被截断\n',
  pnpmStalled: (value0: string) => `dsh：pnpm 已 ${value0}ms 没有输出，已终止
`,
  pnpmFailed: 'pnpm 失败',
  validateInstalledFailed: (value0: string, value1: string) => `无法验证已安装 package ${value0}：${value1}`,
  installedButDenied: (value0: string) => `
dsh：警告：${value0}
dsh：它将保持安装状态，但 profile 启动会拒绝它，直到授予这些精确版本的例外。
`,
  restoredInstallation: '已恢复 package.json、pnpm-lock.yaml 和 node_modules',
  restoreIncomplete: "已恢复 package.json 和 pnpm-lock.yaml，但无法重新安装 node_modules；请运行 'dsh plugin install'",
  profileInitialized: (value0: string, value1: string) => `dsh：已在 ${value1} 初始化 profile ${value0}
`,
  connectionTimeout: (value0: string, value1: string) => `dsh：连接 ${value0} 在 ${value1}ms 后超时
`,
  githubConnectionFailed: 'GitHub 连接检查失败',
  installCancelled: '安装已取消',
  missingTarball: 'tarball 不存在',
  missingPath: '路径不存在',
  unreadablePackage: (value0: string) => `该路径没有可读取的 package.json：${value0}`,
  unnamedPackage: 'package.json 未命名 package',
  alreadyInstalled: (value0: string) => `${value0} 已安装`,
  notBundle: (value0: string) => `${value0} 未声明 dsh.bundle`,
  viewTimeout: (value0: string) => `pnpm view 在 ${value0}ms 后超时`,
  viewFailed: (value0: string) => `pnpm view 以 ${value0} 退出`,
  viewUnreadable: (value0: string) => `无法读取 pnpm view 输出：${value0}`,
  viewNoPackage: 'pnpm view 未返回 package',
  pendingBuildsUnreadable: 'pnpm 失败后无法读取待批准构建',
  emptySpec: 'package spec 不得为空',
  absolutePathRequired: '本地路径必须是绝对路径',
  gitOrTarballRequired: 'URL 必须指向 git repository 或 tarball',
  invalidPackageName: '不是 registry 接受的 package 名称',
  emptyVersion: '@ 后的版本不得为空',
}

/**
 * Read one catalog without consulting process state.
 * @param locale - language captured by the caller.
 * @returns messages with matching keys and parameter lists.
 */
export function diagnosticCatalog(locale: DiagnosticLocale): Messages {
  return locale === 'ja' ? japanese : locale === 'zh' ? chinese : english
}
