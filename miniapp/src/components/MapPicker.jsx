import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { getLocation, haptic, onBackButton, openLocationSettings } from '../telegram.js';
import { ChevronIcon } from './Icons.jsx';

const TASHKENT = [41.3111, 69.2797];
const TILE_URL = import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const coordsText = (lat, lon) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

// Yangi manzil: xaritada pin ostidagi joy tanlanadi, keyin podyezd/qavat/xonadon/domofon so'raladi
export default function MapPicker({ onClose, onSaved }) {
  const { t } = useT();
  const app = useApp();
  const saved = app.location;
  const hasSavedCoords = saved?.lat != null && saved?.lon != null;

  const [step, setStep] = useState('map');
  const [center, setCenter] = useState(hasSavedCoords ? { lat: saved.lat, lon: saved.lon } : null);
  const [address, setAddress] = useState(hasSavedCoords ? saved.address || '' : '');
  const [resolving, setResolving] = useState(false);
  const [moving, setMoving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    address: '',
    entrance: saved?.entrance || '',
    floor: saved?.floor || '',
    apartment: saved?.apartment || '',
    intercom: saved?.intercom || '',
  });

  const mapEl = useRef(null);
  const map = useRef(null);
  const geoSeq = useRef(0);
  const skipNextResolve = useRef(false);

  const back = () => (step === 'details' ? setStep('map') : onClose());
  useEffect(() => onBackButton(back), [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pin ostidagi manzilni aniqlash (xarita to'xtagach)
  const resolve = (lat, lon) => {
    const seq = ++geoSeq.current;
    setResolving(true);
    api
      .geocode(lat, lon)
      .then((r) => seq === geoSeq.current && setAddress(r.address))
      .catch(() => seq === geoSeq.current && setAddress(coordsText(lat, lon)))
      .finally(() => seq === geoSeq.current && setResolving(false));
  };

  const locate = async () => {
    haptic.tap();
    setLocating(true);
    setGeoError('');
    try {
      const pos = await getLocation();
      map.current?.setView([pos.lat, pos.lon], 17);
    } catch (err) {
      setGeoError(err.message === 'denied' ? t('gateDenied') : t('gateFailed'));
      if (err.message === 'denied') openLocationSettings();
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    const m = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView(
      hasSavedCoords ? [saved.lat, saved.lon] : TASHKENT,
      hasSavedCoords ? 17 : 12
    );
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    m.attributionControl.setPrefix(false);
    let timer;
    m.on('movestart', () => {
      setMoving(true);
      clearTimeout(timer);
    });
    m.on('moveend', () => {
      setMoving(false);
      const c = m.getCenter();
      setCenter({ lat: c.lat, lon: c.lng });
      if (skipNextResolve.current) {
        skipNextResolve.current = false;
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(() => resolve(c.lat, c.lng), 450);
    });
    map.current = m;
    if (!hasSavedCoords) locate();
    return () => {
      clearTimeout(timer);
      m.remove();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Qidiruv: yozish to'xtagach so'rov yuboriladi
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return undefined;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      api
        .searchAddress(q)
        .then((r) => setResults(r.results || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const pickResult = (r) => {
    haptic.tap();
    setQuery('');
    setResults([]);
    setAddress(r.address);
    skipNextResolve.current = true;
    map.current?.setView([r.lat, r.lon], 17);
  };

  const goDetails = () => {
    if (!center) return;
    haptic.tap();
    setForm((f) => ({ ...f, address: address || coordsText(center.lat, center.lon) }));
    setStep('details');
  };

  const save = () => {
    haptic.success();
    const clean = (v) => v.trim().slice(0, 40);
    const loc = {
      lat: center.lat,
      lon: center.lon,
      address: form.address.trim().slice(0, 300) || coordsText(center.lat, center.lon),
      entrance: clean(form.entrance),
      floor: clean(form.floor),
      apartment: clean(form.apartment),
      intercom: clean(form.intercom),
    };
    app.setLocation(loc);
    app.setMode('DELIVERY');
    onSaved?.(loc);
    onClose();
  };

  const field = (key, label, props = {}) => (
    <label className="field">
      <span className="field__label">{label}</span>
      <input value={form[key]} maxLength={40} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="mappick" role="dialog" aria-modal="true">
      <div className="mappick__head">
        <button type="button" className="subhead__back" onClick={back} aria-label={t('back')}>
          <ChevronIcon dir="left" />
        </button>
        <h2>{step === 'map' ? t('newAddress') : t('addressDetails')}</h2>
      </div>

      <div className={`mappick__body ${step === 'details' ? 'is-hidden' : ''}`}>
        <div className="mappick__search">
          <input value={query} placeholder={t('searchAddressPh')} onChange={(e) => setQuery(e.target.value)} enterKeyHint="search" />
          {(results.length > 0 || (searching && query.trim().length >= 3)) && (
            <div className="mappick__results">
              {searching && !results.length && <div className="mappick__result muted">{t('searching')}</div>}
              {results.map((r) => (
                <button key={`${r.lat},${r.lon}`} type="button" className="mappick__result" onClick={() => pickResult(r)}>
                  {r.address}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mappick__map">
          <div ref={mapEl} className="mappick__leaflet" />
          <div className={`mappick__pin ${moving ? 'is-moving' : ''}`} aria-hidden="true">
            <span className="mappick__pin-head" />
            <span className="mappick__pin-leg" />
            <span className="mappick__pin-shadow" />
          </div>
          <button type="button" className="mappick__locate" onClick={locate} disabled={locating}>
            ➤ {locating ? t('gateLocating') : t('detectMe')}
          </button>
        </div>
        <div className="mappick__foot">
          {geoError && <p className="locform__error">{geoError}</p>}
          <div className="mappick__addr">{moving || resolving ? t('gateLocating') : address || t('moveMapHint')}</div>
          <button type="button" className="btn btn--primary btn--block btn--tall" disabled={!center || moving} onClick={goDetails}>
            {t('continue')}
          </button>
        </div>
      </div>

      {step === 'details' && (
        <div className="mappick__details">
          <label className="field">
            <span className="field__label">{t('address')}</span>
            <textarea rows={2} maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <div className="mappick__grid">
            {field('entrance', t('entrance'), { inputMode: 'numeric' })}
            {field('floor', t('floor'), { inputMode: 'numeric' })}
            {field('apartment', t('apartment'))}
            {field('intercom', t('intercom'))}
          </div>
          <p className="muted small">{t('detailsHint')}</p>
          <button type="button" className="btn btn--primary btn--block btn--tall" disabled={!form.address.trim()} onClick={save}>
            {t('saveAddress')}
          </button>
        </div>
      )}
    </div>
  );
}
