/** HMR-owned diagnostics; interpolated paths, module identities, and external errors remain unchanged. */
import type { Context } from '@deepseek-ai/cordis'
import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import { launchEnvironmentOf } from '@deepseek-ai/dsh-launch-environment'

const english = {
  moduleMissing: (name: string, base: string) => `HMR cannot locate the loaded module for ${name} from ${base}`,
  pendingMissing: (url: string) => `HMR pending module is missing: ${url}`,
  ambiguous: 'HMR replacement is ambiguous for a plugin instance without a Loader entry',
  nested: 'HMR transactions cannot be nested',
  disposed: 'HMR is disposed',
  registered: (file: string) => `config path already registered: ${file}`,
  internals: '--expose-internals is required for HMR service',
  readiness: 'Profile HMR requires application readiness',
  restart: 'restart required: %s',
  previous: 'changed modules keep running their previous code until a restart: %o',
  watching: 'watching %o',
  watchingIn: 'watching %o in %s',
  baseMissing: 'HMR entry tree has no base URL',
  disposeFailed: 'failed to dispose plugin at %C',
  reload: 'reload plugin at %C',
  reloadFailed: 'failed to reload plugin at %C',
  stepFailed: '%s failed; module replacement was not completed',
  exclusive: 'HMR profile reconciliation must run inside runExclusive',
  profile: 'HMR profile reconciliation requires profileContext',
  compare: 'comparing loaded modules with disk',
  plan: 'planning module replacement',
  expire: 'expiring failed imports',
  evict: 'evicting dropped packages',
  record: 'recording loaded module files',
  watchParent: (path: string) => `config watch parent is not a directory: ${path}`,
  configFailed: 'config reload at %C failed',
  file: 'File',
}

/** Complete HMR diagnostic catalog, including logger formatting tokens. */
export type HmrMessages = typeof english

const chinese: HmrMessages = {
  moduleMissing: (name, base) => `HMR 无法找到从 ${base} 加载的模块 ${name}`,
  pendingMissing: url => `HMR 待处理模块不存在：${url}`,
  ambiguous: '没有 Loader 条目的插件实例无法唯一确定 HMR 替换目标',
  nested: 'HMR 事务不能嵌套',
  disposed: 'HMR 已释放',
  registered: file => `配置路径已注册：${file}`,
  internals: 'HMR 服务需要 --expose-internals',
  readiness: 'Profile HMR 需要应用启动就绪信号',
  restart: '需要重启：%s',
  previous: '更改的模块在重启前继续运行旧代码：%o',
  watching: '正在监听 %o',
  watchingIn: '正在监听 %o（位于 %s）',
  baseMissing: 'HMR 条目树缺少基准 URL',
  disposeFailed: '释放 %C 处的插件失败',
  reload: '重新加载 %C 处的插件',
  reloadFailed: '重新加载 %C 处的插件失败',
  stepFailed: '%s 失败；模块替换未完成',
  exclusive: 'HMR profile 重新组合必须在 runExclusive 内运行',
  profile: 'HMR profile 重新组合需要 profileContext',
  compare: '比较已加载模块与磁盘文件',
  plan: '规划模块替换',
  expire: '清除失败导入的缓存',
  evict: '移除已删除包的缓存',
  record: '记录已加载的模块文件',
  watchParent: path => `配置监听的父路径不是目录：${path}`,
  configFailed: '重新加载 %C 处的配置失败',
  file: '文件',
}

const japanese: HmrMessages = {
  moduleMissing: (name, base) => `HMRは ${base} から読み込まれたモジュール ${name} を見つけられません`,
  pendingMissing: url => `HMRの処理待ちモジュールがありません：${url}`,
  ambiguous: 'Loaderの項目がないプラグインのHMR置換先を一意に決定できません',
  nested: 'HMRのトランザクションは入れ子にできません',
  disposed: 'HMRは終了しています',
  registered: file => `設定パスは登録済みです：${file}`,
  internals: 'HMRサービスには --expose-internals が必要です',
  readiness: 'プロファイルのHMRにはアプリの起動完了通知が必要です',
  restart: '再起動が必要です：%s',
  previous: '変更されたモジュールは再起動まで以前のコードで動作します：%o',
  watching: '%o を監視しています',
  watchingIn: '%o を %s で監視しています',
  baseMissing: 'HMRの項目ツリーに基準URLがありません',
  disposeFailed: '%C のプラグインを終了できませんでした',
  reload: '%C のプラグインを再読み込みします',
  reloadFailed: '%C のプラグインを再読み込みできませんでした',
  stepFailed: '%s に失敗し、モジュールの置換を完了できませんでした',
  exclusive: 'HMRのプロファイル再構成は runExclusive 内で実行してください',
  profile: 'HMRのプロファイル再構成には profileContext が必要です',
  compare: '読み込み済みモジュールとディスク上のファイルの比較',
  plan: 'モジュール置換の計画',
  expire: '読み込みに失敗したモジュールのキャッシュ削除',
  evict: '削除されたパッケージのキャッシュ削除',
  record: '読み込み済みモジュールのファイル記録',
  watchParent: path => `設定監視の親パスがディレクトリではありません：${path}`,
  configFailed: '%C の設定を再読み込みできませんでした',
  file: 'ファイル',
}

/** Capture the launcher's diagnostic language for one HMR instance or standalone helper call.
 * @param ctx Context carrying the immutable launch environment, or its inherited-environment fallback.
 * @returns English, Chinese, or Japanese using the same precedence as app-boot.
 */
export function resolveHmrLocale(ctx: Context): DiagnosticLocale {
  const snapshot = launchEnvironmentOf(ctx)
  return resolveDiagnosticLocale({
    DSH_LANG: snapshot.get('DSH_LANG')?.value,
    LC_ALL: snapshot.get('LC_ALL')?.value,
    LC_MESSAGES: snapshot.get('LC_MESSAGES')?.value,
    LANG: snapshot.get('LANG')?.value,
  }, Intl.DateTimeFormat().resolvedOptions().locale)
}

/** Select source-owned HMR messages without changing diagnostic arguments.
 * @param language Captured diagnostic language.
 * @returns The complete catalog for that language.
 */
export function hmrMessages(language: DiagnosticLocale): HmrMessages {
  return { en: english, zh: chinese, ja: japanese }[language]
}
