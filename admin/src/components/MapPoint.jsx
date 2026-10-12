import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api.js';

const TASHKENT = [41.3111, 69.2797];
const pinIcon = L.divIcon({ className: 'map-point__pin', html: '<span></span>', iconSize: [30, 42], iconAnchor: [15, 42] });

// Xaritada bosib yoki pinni surib aniq nuqta tanlanadi
export default function MapPoint({ value, onChange }) {
  const el = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const place = (lat, lon, zoom) => {
    const m = map.current;
    if (!m) return;
    if (!marker.current) {
      marker.current = L.marker([lat, lon], { draggable: true, icon: pinIcon }).addTo(m);
      marker.current.on('dragend', () => {
        const p = marker.current.getLatLng();
        onChange(p.lat, p.lng);
      });
    } else marker.current.setLatLng([lat, lon]);
    if (zoom) m.setView([lat, lon], zoom);
  };

  useEffect(() => {
    const m = L.map(el.current, { attributionControl: true }).setView(value ? [value.lat, value.lon] : TASHKENT, value ? 17 : 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(m);
    m.attributionControl.setPrefix(false);
    m.on('click', (e) => {
      place(e.latlng.lat, e.latlng.lng);
      onChange(e.latlng.lat, e.latlng.lng);
    });
    map.current = m;
    if (value) place(value.lat, value.lon);
    setTimeout(() => m.invalidateSize(), 200);
    return () => m.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Matn maydoniga koordinata yozilsa — pin ham siljiydi
  useEffect(() => {
    if (!value || !marker.current) return;
    const p = marker.current.getLatLng();
    if (Math.abs(p.lat - value.lat) > 1e-6 || Math.abs(p.lng - value.lon) > 1e-6) place(value.lat, value.lon, 17);
  }, [value?.lat, value?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return setResults([]);
    const t = setTimeout(() => api.searchAddress(q).then((r) => setResults(r.results || [])).catch(() => setResults([])), 600);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="map-point">
      <div className="map-point__search">
        <input value={query} placeholder="Manzilni qidirish (masalan: Foziltepa 40)" onChange={(e) => setQuery(e.target.value)} />
        {results.length > 0 && (
          <div className="map-point__results">
            {results.map((r) => (
              <button
                key={`${r.lat},${r.lon}`}
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  map.current?.setView([r.lat, r.lon], 17);
                }}
              >
                {r.address}
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={el} className="map-point__map" />
      <small className="muted">Xaritada filial turgan joyni bosing — qizil pin qo'yiladi. Pinni surib aniqlashtirish mumkin.</small>
    </div>
  );
}
