/** Source-owned English and Japanese human diagnostics. Parameters retain original diagnostic data. */

import { resolveDiagnosticLocale, type DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'

const english = {
  browserOsLauncherFailed: 'browser operating-system launcher exited with code ',
  webAppWebServerServiceMissingWhileResolvingWebRuntime: 'web-app: webServer service missing while resolving Web runtime',
  webAppBindAddressCarriesAnInterfaceZoneId: (value0: string) => `web-app: bind address ${value0} carries an interface zone id, which no URL can express; pass --public-url with the root browsers actually reach it through`,
  webAppDeepseekAiDshWebFrontendIsNot: 'web-app: @deepseek-ai/dsh-web-frontend is not resolvable from this composition',
  dshWebListeningOnOverPlainHTTPRestrictThis: (value0: string) => `dsh web: listening on ${value0} over plain HTTP; restrict this port to a trusted proxy or network`,
  dshWebOpeningTheDefaultBrowserPassNoOpen: 'dsh web: opening the default browser; pass --no-open to disable',
  webAppCouldNotOpenTheDefaultBrowserBecause: (value0: string) => `web-app: could not open the default browser because ${value0}; use the dsh web URL printed at startup`,
  mustNotContainASCIIWhitespaceOrControlCharacters: (value0: string) => `${value0} must not contain ASCII whitespace or control characters`,
  mustBeAnAbsoluteHttpOrHttpsURLOf: (value0: string) => `${value0} must be an absolute http or https URL of the form http(s)://host[/prefix]`,
  mustNotIncludeAQueryOrFragmentOr: (value0: string) => `${value0} must not include a query or fragment (? or #)`,
  mustNameAHostAfterHttpOrHttps: (value0: string) => `${value0} must name a host after http:// or https://`,
  mustNotIncludeCredentialsAUsernameOrPasswordBefore: (value0: string) => `${value0} must not include credentials (a username or password before @, including an empty user)`,
  mustBeAnAbsoluteHttpOrHttpsURL: (value0: string) => `${value0} must be an absolute http or https URL`,
  examplesDshProfileWebServeOnTheComposedHost: '\nExamples:\n  dsh --profile web                          serve on the composed host and port\n  dsh --profile web --no-open                serve without opening a browser\n  dsh --profile web --port 8080              serve on another port\n  dsh --profile web --host 10.0.0.7          bind one local interface address\n  dsh --profile web --public-url https://app.example/ui/ --trusted-host app.example\n                                             advertise a prefix-stripping HTTPS proxy entry and admit its authority\n  dsh --profile web --tls-cert ./server-chain.pem --tls-key ./server-key.pem\n                                             serve HTTPS with an existing certificate and key\n',
  unencryptedPEMPrivateKeyRequiresTlsCert: 'unencrypted PEM private key; requires --tls-cert',
  pemServerCertificateChainRequiresTlsKey: 'PEM server certificate chain; requires --tls-key',
  extraAuthorityTheApiBrowserTrustFenceAcceptsHost: 'extra authority the /api browser-trust fence accepts (host or host:port; repeatable)',
  advertiseThisHTTPSRootInThePrintedOpened: 'advertise this HTTP(S) root in the printed, opened, web-surface, and DSH_WEB_URL forms; grants no trust',
  listenPortPassToLetTheOSPickA: 'listen port; pass 0 to let the OS pick a free one',
  doNotOpenTheWebUIInTheDefault: 'do not open the Web UI in the default browser',
  bindAddressOneConcreteIPv4OrIPv6LiteralOf: 'bind address: one concrete IPv4 or IPv6 literal of a local interface; wildcard addresses are rejected',
  showThisHelp: 'show this help',
  serveTheDeepSeekHarnessBrowserUI: 'Serve the DeepSeek Harness browser UI.',
  errorHostIsAnUnspecifiedWildcardAddressWhichIs: (value0: string) => `error: --host ${value0} is an unspecified (wildcard) address, which is not supported: binding every interface would expose remote code execution to the network; bind one concrete IPv4 or IPv6 address instead`,
  errorPortMustBeANumberGot: (value0: string) => `error: --port must be a number, got ${value0}`,
  errorTlsCertAndTlsKeyMustBeSupplied: 'error: --tls-cert and --tls-key must be supplied together',
  error: (value0: string) => `error: ${value0}`,
  browserLauncherFailed: (value0: string) => `browser launcher exited with code ${value0}`,
}

type Messages = { [Key in keyof typeof english]: typeof english[Key] }

const japanese: Messages = {
  browserOsLauncherFailed: 'OS のブラウザー起動プロセスが次の終了コードで終了しました: ',
  webAppWebServerServiceMissingWhileResolvingWebRuntime: 'web-app: Web 実行環境の解決に必要な webServer サービスがありません',
  webAppBindAddressCarriesAnInterfaceZoneId: (value0: string) => `web-app: バインド先 ${value0} は URL で表現できないインターフェースのゾーン ID を含みます。ブラウザーからアクセスするルート URL を --public-url で指定してください`,
  webAppDeepseekAiDshWebFrontendIsNot: 'web-app: この構成から @deepseek-ai/dsh-web-frontend を解決できません',
  dshWebListeningOnOverPlainHTTPRestrictThis: (value0: string) => `dsh web: ${value0} で暗号化されていない HTTP 接続を受け付けています。このポートへのアクセスを信頼できるプロキシまたはネットワークに制限してください`,
  dshWebOpeningTheDefaultBrowserPassNoOpen: 'dsh web: 既定のブラウザーを開きます。無効にするには --no-open を指定してください',
  webAppCouldNotOpenTheDefaultBrowserBecause: (value0: string) => `web-app: 既定のブラウザーを開けませんでした（${value0}）。起動時に表示した dsh web の URL を使用してください`,
  mustNotContainASCIIWhitespaceOrControlCharacters: (value0: string) => `${value0} に ASCII 空白文字や制御文字を含めることはできません`,
  mustBeAnAbsoluteHttpOrHttpsURLOf: (value0: string) => `${value0} は http(s)://host[/prefix] 形式の絶対 HTTP または HTTPS URL にしてください`,
  mustNotIncludeAQueryOrFragmentOr: (value0: string) => `${value0} にクエリーやフラグメント（? または #）を含めることはできません`,
  mustNameAHostAfterHttpOrHttps: (value0: string) => `${value0} の http:// または https:// の後にホスト名を指定してください`,
  mustNotIncludeCredentialsAUsernameOrPasswordBefore: (value0: string) => `${value0} に認証情報を含めることはできません（空のユーザー名を含む、@ の前のユーザー名やパスワード）`,
  mustBeAnAbsoluteHttpOrHttpsURL: (value0: string) => `${value0} は絶対 HTTP または HTTPS URL にしてください`,
  examplesDshProfileWebServeOnTheComposedHost: '\n使用例:\n  dsh --profile web                          設定されたホストとポートで提供\n  dsh --profile web --no-open                ブラウザーを開かずに提供\n  dsh --profile web --port 8080              別のポートで提供\n  dsh --profile web --host 10.0.0.7          一つのローカルアドレスで接続を受け付ける\n  dsh --profile web --public-url https://app.example/ui/ --trusted-host app.example\n                                             パスの接頭辞を除去する HTTPS プロキシの入口を公開し、そのホストを許可\n  dsh --profile web --tls-cert ./server-chain.pem --tls-key ./server-key.pem\n                                             既存の証明書と秘密鍵で HTTPS を提供\n',
  unencryptedPEMPrivateKeyRequiresTlsCert: '暗号化されていない PEM 秘密鍵。--tls-cert が必要',
  pemServerCertificateChainRequiresTlsKey: 'PEM サーバー証明書チェーン。--tls-key が必要',
  extraAuthorityTheApiBrowserTrustFenceAcceptsHost: '/api のブラウザー信頼検証で追加許可するホスト（host または host:port、複数回指定可能）',
  advertiseThisHTTPSRootInThePrintedOpened: '表示、ブラウザー起動、web-surface、DSH_WEB_URL に使用する HTTP(S) ルート。信頼の許可にはならない',
  listenPortPassToLetTheOSPickA: '待ち受けポート。0 を指定すると OS が空きポートを選択',
  doNotOpenTheWebUIInTheDefault: '既定のブラウザーで Web UI を開かない',
  bindAddressOneConcreteIPv4OrIPv6LiteralOf: 'バインド先: ローカルインターフェースの具体的な IPv4 または IPv6 アドレス。ワイルドカードは禁止',
  showThisHelp: 'このヘルプを表示する',
  serveTheDeepSeekHarnessBrowserUI: 'DeepSeek Harness のブラウザー UI を提供します。',
  errorHostIsAnUnspecifiedWildcardAddressWhichIs: (value0: string) => `エラー: --host ${value0} は未指定アドレス（ワイルドカード）のため使用できません。全インターフェースでの待ち受けはネットワークへリモートコード実行を公開します。具体的な IPv4 または IPv6 アドレスを指定してください`,
  errorPortMustBeANumberGot: (value0: string) => `エラー: --port は数値で指定してください。指定値: ${value0}`,
  errorTlsCertAndTlsKeyMustBeSupplied: 'エラー: --tls-cert と --tls-key は一緒に指定してください',
  error: (value0: string) => `エラー: ${value0}`,
  browserLauncherFailed: (value0: string) => `ブラウザー起動プロセスが終了コード ${value0} で終了しました`,
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
