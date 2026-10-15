/**
 * Canonical public HTTP(S) root parsing shared by this bundle's `publicUrl`
 * config and its CLI startup provider.
 * @module @deepseek-ai/dsh-web-app/public-url
 */

import { diagnosticMessages } from './diagnostics.ts'

/**
 * Parse the advertised public HTTP(S) root of a prefix-stripping proxy
 * deployment, rejecting the hazards WHATWG URL parsing would accept on its own,
 * then normalize the path to end in `/`.
 * @param value - advertised public HTTP(S) root.
 * @param label - field name or CLI flag included in rejection messages.
 * @param messages - diagnostic catalog captured by the calling application.
 * @returns the parsed URL with a trailing-slash pathname.
 * @throws when the value is not a usable advertised root, naming the reason.
 */
export function parsePublicUrl(value: string, label = 'publicUrl', messages = diagnosticMessages()): URL {
  if (/[\u0000-\u0020\u007f]/u.test(value)) {
    throw new Error(messages.mustNotContainASCIIWhitespaceOrControlCharacters(label))
  }
  if (!/^https?:\/\//iu.test(value)) {
    throw new Error(messages.mustBeAnAbsoluteHttpOrHttpsURLOf(label))
  }
  if (value.includes('?') || value.includes('#')) {
    throw new Error(messages.mustNotIncludeAQueryOrFragmentOr(label))
  }
  // Userinfo lives in the raw authority (before the first path slash); the
  // empty-authority forms (`https://`, `https:///ui`, `http:///ui`) fail here too.
  const [authority = ''] = value.slice(value.indexOf('://') + 3).split(/[/\\]/, 1)
  if (authority === '') {
    throw new Error(messages.mustNameAHostAfterHttpOrHttps(label))
  }
  if (authority.includes('@')) {
    throw new Error(messages.mustNotIncludeCredentialsAUsernameOrPasswordBefore(label))
  }
  const url = URL.parse(value)
  if (url === null) throw new Error(messages.mustBeAnAbsoluteHttpOrHttpsURL(label))
  if (!url.pathname.endsWith('/')) url.pathname += '/'
  return url
}
