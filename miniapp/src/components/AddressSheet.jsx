import { useEffect, useState } from 'react';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { onBackButton } from '../telegram.js';
import LocationForm from './LocationForm.jsx';
import { PinIcon } from './Icons.jsx';

export default function AddressSheet({ onClose }) {
  const { t } = useT();
  const app = useApp();
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };
  useEffect(() => onBackButton(close), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`sheet ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={close} />
      <div className="sheet__panel sheet__panel--form">
        <div className="sheet__handle" />
        <h2 className="sheet__heading">{t('addressSheetTitle')}</h2>
        {app.location?.address && (
          <div className="current-addr">
            <PinIcon width={18} height={18} />
            <span>{app.location.address}</span>
          </div>
        )}
        <LocationForm
          primaryLabel={t('detectAgain')}
          initialAddress={app.location?.lat == null ? app.location?.address || '' : ''}
          onDone={(loc) => {
            app.setLocation(loc);
            app.setMode('DELIVERY');
            close();
          }}
        />
      </div>
    </div>
  );
}
