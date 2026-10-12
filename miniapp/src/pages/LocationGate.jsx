import { hasLocation, useApp } from '../appState.jsx';
import { LANG_NAMES, useT } from '../i18n.jsx';
import Logo from '../components/Logo.jsx';

// Ilova birinchi ochilganda: avval lokatsiya so'raladi
export default function LocationGate() {
  const { t, lang, setLang } = useT();
  const app = useApp();
  const saved = hasLocation(app.location);

  return (
    <div className="gate">
      <div className="gate__lang">
        {Object.entries(LANG_NAMES).map(([code, name]) => (
          <button key={code} type="button" className={lang === code ? 'is-active' : ''} onClick={() => setLang(code)}>
            {name}
          </button>
        ))}
      </div>
      <div className="gate__hero">
        <Logo size={150} className="gate__logo" />
        <h1>{t('gateTitle')}</h1>
        <p>{t('gateText')}</p>
      </div>
      <div className="gate__actions">
        {saved && (
          <button
            type="button"
            className="gate__saved"
            onClick={() => {
              app.setMode('DELIVERY');
              app.finishGate();
            }}
          >
            <span className="gate__saved-label">{t('gateSaved')}</span>
            <span className="gate__saved-addr">📍 {app.location.address || `${app.location.lat}, ${app.location.lon}`}</span>
          </button>
        )}
        <button type="button" className="btn btn--primary btn--block btn--tall" onClick={() => app.openAddress({ onSaved: app.finishGate })}>
          {t('pickOnMap')}
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => {
            app.setMode('PICKUP');
            app.finishGate();
          }}
        >
          🏃 {t('gatePickup')}
        </button>
      </div>
    </div>
  );
}
