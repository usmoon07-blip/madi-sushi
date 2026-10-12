import { useState } from 'react';
import { api } from '../api.js';
import { useT } from '../i18n.jsx';
import { getLocation, haptic, openLocationSettings } from '../telegram.js';
import { PinIcon } from './Icons.jsx';

// Lokatsiyani aniqlash (matn ko'rinishidagi manzil bilan) yoki manzilni qo'lda yozish
export default function LocationForm({ onDone, primaryLabel, initialAddress = '' }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [manual, setManual] = useState(false);
  const [text, setText] = useState(initialAddress);

  const detect = async () => {
    haptic.tap();
    setBusy(true);
    setError('');
    try {
      const pos = await getLocation();
      let address = `${pos.lat.toFixed(5)}, ${pos.lon.toFixed(5)}`;
      try {
        address = (await api.geocode(pos.lat, pos.lon)).address;
      } catch {
        /* koordinata matni qoladi */
      }
      haptic.success();
      onDone({ lat: pos.lat, lon: pos.lon, address });
    } catch (err) {
      haptic.error();
      if (err.message === 'denied') {
        setError(t('gateDenied'));
        openLocationSettings();
      } else setError(t('gateFailed'));
      setManual(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="locform">
      <button type="button" className="btn btn--primary btn--block btn--tall" onClick={detect} disabled={busy}>
        <PinIcon width={20} height={20} />
        {busy ? t('gateLocating') : primaryLabel || t('gateSend')}
      </button>
      {error && <p className="locform__error">{error}</p>}
      {manual ? (
        <div className="locform__manual">
          <textarea rows={2} value={text} maxLength={300} placeholder={t('gateManualPh')} onChange={(e) => setText(e.target.value)} />
          <button type="button" className="btn btn--outline btn--block" disabled={!text.trim()} onClick={() => onDone({ lat: null, lon: null, address: text.trim() })}>
            {t('save')}
          </button>
        </div>
      ) : (
        <button type="button" className="link locform__toggle" onClick={() => setManual(true)}>
          {t('gateManual')}
        </button>
      )}
    </div>
  );
}
