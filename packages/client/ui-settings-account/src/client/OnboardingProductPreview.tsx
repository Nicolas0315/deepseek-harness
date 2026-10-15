/** Decorative product previews keep illustration labels in the active dictionary. */
import {
  IconFolderOpenOutlineRegular, IconNewChatOutlineRegular, IconPlusOutlineRegular,
  IconSendOutlineRegular, IconUserOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { DesktopOnboardingProps } from './onboarding-contract.ts'
import css from './OnboardingProductPreview.module.css'

type PreviewProps = Pick<DesktopOnboardingProps, 't'> & {
  kind: 'welcome' | 'credit'
  className: string | undefined
}

function PreviewSidebar({ t }: Pick<DesktopOnboardingProps, 't'>) {
  return <div className={css.sidebar}>
    <strong className={css.brand}>{t('onboardingBrand')}</strong>
    <div className={css.newSession}><IconNewChatOutlineRegular />{t('onboardingPreviewNewSession')}</div>
    <div className={css.workspace}><IconFolderOpenOutlineRegular />{t('onboardingPreviewWorkspace')}</div>
    <div className={css.sessions}>
      <span>{t('onboardingPreviewSummary')}</span>
      <span>{t('onboardingPreviewMeeting')}</span>
      <span>{t('onboardingPreviewCode')}</span>
    </div>
  </div>
}

/** @param props - preview kind, localized labels, and existing artwork geometry. @returns a noninteractive decorative preview. */
export function OnboardingProductPreview({ kind, t, className = '' }: PreviewProps) {
  return <div className={`${css.preview} ${css[kind]} ${className}`} aria-hidden="true">
    <div className={css.window}>
      <PreviewSidebar t={t} />
      {kind === 'welcome' && <div className={css.conversation}>
        <div className={css.headline}>{t('onboardingPreviewHeadline')}</div>
        <div className={css.composer}>
          <div>{t('onboardingPreviewInput')}</div>
          <div className={css.composerTools}><IconPlusOutlineRegular /><IconSendOutlineRegular /></div>
        </div>
      </div>}
    </div>
    {kind === 'credit' && <div className={css.settings}>
      <div className={css.settingsTitle}>{t('settings')}</div>
      <div className={css.accountNav}><IconUserOutlineRegular />{t('nav')}</div>
      <div className={css.account}>
        <div className={css.accountIdentity}><IconUserOutlineRegular />{t('onboardingBrand')}</div>
        <div className={css.balance}>
          <div className={css.balanceReading}><span>{t('balance')}</span><strong>{t('onboardingPreviewBalance')}</strong></div>
          <div className={css.balanceActions}><span>{t('usage')}</span><span className={css.topUp}>{t('topUp')}</span></div>
        </div>
      </div>
    </div>}
  </div>
}
