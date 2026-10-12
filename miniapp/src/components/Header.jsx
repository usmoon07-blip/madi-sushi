import { useState } from 'react';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { haptic } from '../telegram.js';
import { ChevronIcon } from './Icons.jsx';
import Logo from './Logo.jsx';

// Yuqori qism: brend, manzil va "Kuryer orqali / Olib ketish" tanlovi
export default function Header() {
  const { t } = useT();
  const app = useApp();
  const [modeOpen, setModeOpen] = useState(false);
  const isPickup = app.mode === 'PICKUP';
  const address = isPickup ? app.settings.pickupAddress : app.location?.address || t('chooseAddress');

  return (
    <header className="hdr">
      <div className="hdr__brand">
        <Logo size={44} />
        <div>
          <div className="brand__name">MADI SUSHI</div>
          <div className="brand__sub">{t('hello', app.user?.firstName || t('guest'))}</div>
        </div>
      </div>
      <div className="hdr__row">
        <button type="button" className="hdr__addr" onClick={() => (isPickup ? app.openBranches() : app.openAddress())}>
          <span className="hdr__addr-label">{isPickup ? t('pickupFrom') : t('deliveryTo')}</span>
          <span className="hdr__addr-value">
            <span>{address}</span>
            <ChevronIcon dir="down" width={16} height={16} />
          </span>
        </button>
        <div className="mode">
          <button type="button" className="mode__btn" onClick={() => setModeOpen((v) => !v)}>
            {isPickup ? t('pickup') : t('courier')}
            <ChevronIcon dir="down" width={16} height={16} />
          </button>
          {modeOpen && (
            <>
              <div className="mode__backdrop" onClick={() => setModeOpen(false)} />
              <div className="mode__menu">
                {[
                  { v: 'DELIVERY', label: `🛵 ${t('courier')}` },
                  { v: 'PICKUP', label: `🏃 ${t('pickup')}` },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    className={app.mode === o.v ? 'is-active' : ''}
                    onClick={() => {
                      haptic.tap();
                      app.setMode(o.v);
                      setModeOpen(false);
                      if (o.v === 'DELIVERY' && !app.location) app.openAddress();
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {!app.settings.isOpen && <div className="notice">{t('closedNotice')}</div>}
    </header>
  );
}
