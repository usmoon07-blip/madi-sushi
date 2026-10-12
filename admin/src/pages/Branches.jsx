import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';

const empty = { name: '', nameRu: '', address: '', phone: '', workHours: '', location: '', sortOrder: 0, isActive: true };
const coordsText = (b) => (b?.lat != null && b?.lon != null ? `${b.lat}, ${b.lon}` : '');
const mapUrl = (b) =>
  b.lat != null ? `https://yandex.uz/maps/?pt=${b.lon},${b.lat}&z=17&l=map` : `https://yandex.uz/maps/?text=${encodeURIComponent(b.address)}`;

function BranchForm({ branch, onSaved, onCancel }) {
  const [form, setForm] = useState(() => (branch ? { ...empty, ...branch, location: coordsText(branch) } : empty));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { name, nameRu, address, phone, workHours, location, sortOrder, isActive } = form;
    const payload = { name, nameRu, address, phone, workHours, location, sortOrder, isActive };
    try {
      if (branch) await api.updateBranch(branch.id, payload);
      else await api.createBranch(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form__grid">
        <label className="field">
          <span>🇺🇿 Filial nomi *</span>
          <input value={form.name} onChange={set('name')} required maxLength={60} placeholder="Foziltepa" />
        </label>
        <label className="field">
          <span>🇷🇺 Nomi (ruscha)</span>
          <input value={form.nameRu} onChange={set('nameRu')} maxLength={60} placeholder="Фозилтепа" />
        </label>
        <label className="field field--wide">
          <span>Manzil *</span>
          <input value={form.address} onChange={set('address')} required maxLength={200} placeholder="Toshkent, Foziltepa ko'chasi, 40" />
        </label>
        <label className="field field--wide">
          <span>Lokatsiya (ixtiyoriy)</span>
          <input value={form.location} onChange={set('location')} placeholder="41.2851, 69.2041 yoki Yandex Maps havolasi" />
          <small className="muted">Yandex Maps'da filialni toping → «Ulashish» → havolani shu yerga qo'ying. Mijozga xaritada aniq ko'rsatiladi.</small>
        </label>
        <label className="field">
          <span>Telefon</span>
          <input value={form.phone} onChange={set('phone')} maxLength={40} placeholder="+998 90 123 45 67" />
        </label>
        <label className="field">
          <span>Ish vaqti</span>
          <input value={form.workHours} onChange={set('workHours')} maxLength={60} placeholder="10:00 – 02:00" />
        </label>
        <label className="field">
          <span>Tartib raqami (kichigi oldinda)</span>
          <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          <span>Faol (mijozlarga ko'rinadi)</span>
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Bekor qilish
        </button>
        <button className="btn btn--primary" disabled={saving}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

export default function Branches() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () =>
    api
      .branches()
      .then((d) => setList(d.branches))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (b) => {
    setList((l) => l.map((x) => (x.id === b.id ? { ...x, isActive: !b.isActive } : x)));
    try {
      await api.updateBranch(b.id, { isActive: !b.isActive });
    } catch (e) {
      alert(e.message);
      load();
    }
  };

  const remove = async (b) => {
    if (!confirm(`"${b.name}" filiali o'chirilsinmi?\n\nEski buyurtmalar saqlanib qoladi. Vaqtincha yopish uchun "Faol" tugmasini o'chiring.`)) return;
    try {
      await api.deleteBranch(b.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Filiallar</h1>
          <p className="muted">Mijoz «Olib ketish»ni tanlaganda filialni tanlaydi. Profil → Filiallar bo'limida ham ko'rinadi.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Filial qo'shish
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Filial</th>
              <th>Manzil</th>
              <th>Telefon / ish vaqti</th>
              <th>Buyurtmalar</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list?.map((b) => (
              <tr key={b.id} className={b.isActive ? '' : 'row--inactive'}>
                <td>
                  <div className="strong">🏪 {b.name}</div>
                  {b.nameRu && <div className="muted small">🇷🇺 {b.nameRu}</div>}
                </td>
                <td>
                  <div>{b.address}</div>
                  <a className="small" href={mapUrl(b)} target="_blank" rel="noreferrer">
                    {b.lat != null ? '📍 Xaritada' : '⚠️ Lokatsiya kiritilmagan'}
                  </a>
                </td>
                <td>
                  <div>{b.phone || '—'}</div>
                  <div className="muted small">{b.workHours}</div>
                </td>
                <td>{b._count?.orders ?? 0}</td>
                <td>
                  <button type="button" className={`toggle ${b.isActive ? 'is-on' : ''}`} onClick={() => toggle(b)}>
                    <span className="toggle__knob" />
                    {b.isActive ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td className="nowrap actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(b)}>
                    ✎ Tahrirlash
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(b)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list && !list.length && <div className="empty">Filiallar yo'q — «+ Filial qo'shish» tugmasini bosing</div>}
        {!list && !error && <div className="empty">Yuklanmoqda...</div>}
      </div>
      {editing && (
        <Modal title={editing === 'new' ? 'Yangi filial' : 'Filialni tahrirlash'} onClose={() => setEditing(null)}>
          <BranchForm
            branch={editing === 'new' ? null : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
