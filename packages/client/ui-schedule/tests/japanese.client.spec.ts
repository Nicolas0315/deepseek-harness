/** Japanese schedule wording retains the stored timezone and cron day semantics. */
import { describe, expect, it } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { ja } from '../src/client/task-manager-locales.ts'
import {
  formatScheduleFrequency, formatScheduleNextRun, formatScheduleRelative, formatWeekdays, zoneLabel,
} from '../src/client/schedule-format.ts'
import { cronPreview, parseCronExpression } from '../src/client/task-cron.ts'
import type { ScheduleId, ScheduleRecord } from '@deepseek-ai/dsh-schedule/client'

const t = makeTranslate(ja)
const instant = '2026-01-15T00:00:00.000Z'

it('uses Japanese dates and respects the requested timezone', () => {
  expect(t('time.locale')).toBe('ja-JP')
  expect(formatScheduleNextRun(instant, t('time.locale'), 'Asia/Tokyo')).toContain('1月15日 9:00')
  expect(formatScheduleNextRun(instant, t('time.locale'), 'America/Los_Angeles')).toContain('1月14日 16:00')
  const zone = zoneLabel('Asia/Tokyo', t, Date.parse(instant))
  expect(zone).toContain('UTC+09:00')
  expect(zone).toContain('日本')
})

it('uses Japanese weekday and elapsed-duration labels', () => {
  expect(formatWeekdays([1, 3, 7], t)).toBe('月、水、日')
  expect(formatScheduleRelative(instant, Date.parse(instant) - 120_000, t)).toBe('2分後')
  const record: ScheduleRecord = {
    id: 'japanese-weekly' as ScheduleId, kind: 'weekly', title: '週次', prompt: '確認',
    weekdays: [1, 3], time: '09:30:00.000', timeZone: 'Asia/Tokyo', scheduledAt: instant,
  }
  expect(formatScheduleFrequency(record, t)).toContain('毎週')
  expect(formatScheduleFrequency(record, t)).toContain('09:30')
  expect(formatScheduleFrequency(record, t)).toContain('UTC+09:00')
})

describe('Japanese cron descriptions', () => {
  it.each([
    ['0 9 * * 1', '月曜日'],
    ['0 9 1 * 1', 'または'],
    ['0 9 */2 * 1', 'かつ'],
    ['*/5 * * * *', '5 分ごと'],
  ])('renders %s without losing its condition', (expression, wording) => {
    const parsed = parseCronExpression(expression)
    if (parsed === undefined) throw new Error(`Invalid test cron: ${expression}`)
    expect(cronPreview(parsed, t, t('time.locale'))).toContain(wording)
  })
})
