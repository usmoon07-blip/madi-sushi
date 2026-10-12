import { useEffect, useState } from 'react';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { haptic, onBackButton, openLink } from '../telegram.js';
import { yandexMapUrl, yandexSearchUrl } from '../format.js';
import { CheckIcon, StoreIcon } from './Icons.jsx';

export const branchMapUrl = (b) => (b.lat != null && b.lon != null ? yandexMapUrl(b.lat, b.lon) : yandexSearchUrl(b.address));

// Olib ketish uchun filial tanlash
export default function BranchSheet({ onClose }) {
  const { t, pick } = useT();
  const app = useApp();
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  useEffect(() => onBackButton(close), []); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (b) => {
    haptic.tap();
    app.setBranch(b.id);
    app.setMode('PICKUP');
    close();
  };

  return (
    <div className={`sheet ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={close} />
      <div className="sheet__panel sheet__panel--form">
        <div className="sheet__handle" />
        <h2 className="sheet__heading">{t('chooseBranch')}</h2>
        <div className="branch-list">
          {app.branches.map((b) => {
            const active = app.branch?.id === b.id;
            return (
              <div key={b.id} className={`branch-opt ${active ? 'is-active' : ''}`}>
                <button type="button" className="branch-opt__main" onClick={() => choose(b)}>
                  <span className="branch-opt__icon">{active ? <CheckIcon width={18} height={18} /> : <StoreIcon width={18} height={18} />}</span>
                  <span className="branch-opt__body">
                    <span className="branch-opt__name">{pick(b, 'name') || b.name}</span>
                    <span className="branch-opt__addr">{b.address}</span>
                    {b.workHours && <span className="muted small">🕒 {b.workHours}</span>}
                  </span>
                </button>
                <button type="button" className="link branch-opt__map" onClick={() => openLink(branchMapUrl(b))}>
                  {t('openInMaps')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
