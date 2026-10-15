// @vitest-environment jsdom
/** Onboarding previews localize visible labels without changing setup actions. */
import { createRef } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { OnboardingWelcomeStep } from '../src/client/OnboardingWelcomeStep.tsx'
import { OnboardingPurposeStep } from '../src/client/OnboardingPurposeStep.tsx'
import { OnboardingCreditStep } from '../src/client/OnboardingCreditStep.tsx'
import { en, ja, zh } from '../src/client/locales.ts'

afterEach(cleanup)

it('shows a Japanese welcome preview instead of the English artwork', () => {
  const { container } = render(<OnboardingWelcomeStep locale="ja" t={key => ja[key]}
    heading={createRef<HTMLHeadingElement>()} busy={false} onStart={() => {}} />)
  expect(screen.getByRole('heading', { name: 'DeepSeek Harness へようこそ' })).toBeTruthy()
  expect(container.querySelector('img')).toBeNull()
  const preview = screen.getByText('新しいセッション').closest('[aria-hidden="true"]')
  expect(preview).not.toBeNull()
  expect(preview?.textContent).toContain('既定のワークスペース')
  expect(preview?.textContent).toContain('四半期データを集計')
  expect(preview?.textContent).toContain('作りたいものを説明してください')
  expect(preview?.querySelector('button, input, a, [tabindex]')).toBeNull()
  expect(screen.getByRole('button', { name: ja.onboardingStart })).toBeTruthy()
})

it('shows Japanese account and balance labels instead of the English credit artwork', () => {
  const { container } = render(<OnboardingCreditStep locale="ja" t={key => ja[key]}
    heading={createRef<HTMLHeadingElement>()} busy={false} funded={false} canRecharge
    onContinue={() => {}} onRecharge={() => {}} onLater={() => {}} />)
  expect(container.querySelector('img')).toBeNull()
  const preview = screen.getByText(ja.balance).closest('[aria-hidden="true"]')
  expect(preview).not.toBeNull()
  expect(preview?.textContent).toContain(ja.nav)
  expect(preview?.textContent).toContain(ja.usage)
  expect(preview?.textContent).toContain(ja.topUp)
  expect(preview?.querySelector('button, input, a, [tabindex]')).toBeNull()
  expect(screen.getByRole('button', { name: ja.onboardingTopUp })).toBeTruthy()
})

it.each([['en', en, ''], ['zh', zh, '-zh']] as const)('retains the %s light and dark artwork', (locale, copy, suffix) => {
  const { container, rerender } = render(<OnboardingWelcomeStep locale={locale} t={key => copy[key]}
    heading={createRef<HTMLHeadingElement>()} busy={false} onStart={() => {}} />)
  expect(Array.from(container.querySelectorAll('img'), image => image.getAttribute('src'))).toEqual([
    expect.stringContaining(`onboarding-welcome${suffix}.webp`),
    expect.stringContaining(`onboarding-welcome${suffix}-dark.webp`),
  ])
  rerender(<OnboardingCreditStep locale={locale} t={key => copy[key]}
    heading={createRef<HTMLHeadingElement>()} busy={false} funded={false} canRecharge
    onContinue={() => {}} onRecharge={() => {}} onLater={() => {}} />)
  expect(Array.from(container.querySelectorAll('img'), image => image.getAttribute('src'))).toEqual([
    expect.stringContaining(`onboarding-recharge${suffix}.webp`),
    expect.stringContaining(`onboarding-recharge${suffix}-dark.webp`),
  ])
})

it('places the product name between the Japanese purpose question and its particle', () => {
  render(<OnboardingPurposeStep t={key => ja[key]} heading={createRef<HTMLHeadingElement>()}
    busy={false} purpose={null} onSelect={() => {}} onContinue={() => {}} />)
  expect(screen.getByRole('heading', { name: 'どんな作業を DeepSeek Harness に手伝ってもらいますか？' })).toBeTruthy()
})
