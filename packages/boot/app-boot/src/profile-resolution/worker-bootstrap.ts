/** Install the inherited runtime resolution in one Harness-owned Worker. */

import type { DiagnosticLocale } from '@deepseek-ai/dsh-diagnostic-locale'
import { getEnvironmentData } from 'node:worker_threads'
import { installRuntimeInterception } from './resolver.ts'
import type { RuntimeResolution } from '../profile.ts'

const registration = getEnvironmentData(
  '@deepseek-ai/dsh-app-boot/profile-resolution',
) as {
  resolution: RuntimeResolution
  locale: DiagnosticLocale
} | undefined
if (registration !== undefined) installRuntimeInterception(registration.resolution, registration.locale)
