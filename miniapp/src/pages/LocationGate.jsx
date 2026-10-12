import { useApp } from '../appState.jsx';
import { LANG_NAMES, useT } from '../i18n.jsx';
import LocationForm from '../components/LocationForm.jsx';
import { PinIcon } from '../components/Icons.jsx';

// Ilova birinchi ochilganda: avval lokatsiya so'raladi
export default function LocationGate() {
  const { t, lang, setLang } = useT();
  const app = useApp();

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
        <div className="gate__pin">
          <PinIcon width={44} height={44} />
        </div>
        <div className="brand__name">MADI SUSHI</div>
        <h1>{t('gateTitle')}</h1>
        <p>{t('gateText')}</p>
      </div>
      <div className="gate__actions">
        <LocationForm
          onDone={(loc) => {
            app.setLocation(loc);
            app.setMode('DELIVERY');
            app.finishGate();
          }}
        />
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
