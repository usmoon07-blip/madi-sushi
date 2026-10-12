import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal from '../components/Modal.jsx';
import ImageField from '../components/ImageField.jsx';

const empty = { nameUz: '', nameRu: '', imageUrl: '', sortOrder: 0, isActive: true };

function CategoryForm({ category, onSaved, onCancel }) {
  const [form, setForm] = useState(() => (category ? { ...empty, ...category } : empty));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { nameUz: form.nameUz, nameRu: form.nameRu, imageUrl: form.imageUrl, sortOrder: form.sortOrder, isActive: form.isActive };
    try {
      if (category) await api.updateCategory(category.id, payload);
      else await api.createCategory(payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <ImageField value={form.imageUrl} onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))} onError={setError} onBusy={setUploading} />
      <div className="form__grid">
        <label className="field">
          <span>🇺🇿 Nomi *</span>
          <input value={form.nameUz} onChange={set('nameUz')} required maxLength={40} placeholder="Rollar" />
        </label>
        <label className="field">
          <span>🇷🇺 Nomi (ruscha)</span>
          <input value={form.nameRu} onChange={set('nameRu')} maxLength={40} placeholder="Роллы" />
        </label>
        <label className="field">
          <span>Tartib raqami (kichigi oldinda)</span>
          <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
          <span>Faol (menyuda ko'rinadi)</span>
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Bekor qilish
        </button>
        <button className="btn btn--primary" disabled={saving || uploading}>
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

export default function Categories() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = () =>
    api
      .categories()
      .then((d) => setList(d.categories))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (c) => {
    setList((l) => l.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
    try {
      await api.updateCategory(c.id, { isActive: !c.isActive });
    } catch (e) {
      alert(e.message);
      load();
    }
  };

  const remove = async (c) => {
    const n = c._count?.products || 0;
    const msg = n
      ? `"${c.nameUz}" o'chirilsinmi?\n\nUndagi ${n} ta mahsulot o'chmaydi, lekin kategoriyasiz qoladi — ularni boshqa kategoriyaga o'tkazing.\nVaqtincha yashirish uchun "Faol" tugmasini o'chiring.`
      : `"${c.nameUz}" o'chirilsinmi?`;
    if (!confirm(msg)) return;
    try {
      await api.deleteCategory(c.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kategoriyalar</h1>
          <p className="muted">Bosh sahifadagi qizil «Menyu» blokida rasmi bilan ko'rinadi</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Yangi kategoriya
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Rasm</th>
              <th>Nomi</th>
              <th>Mahsulotlar</th>
              <th>Tartib</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list?.map((c) => (
              <tr key={c.id} className={c.isActive ? '' : 'row--inactive'}>
                <td>
                  <div className="thumb">{c.imageUrl ? <img src={c.imageUrl} alt="" /> : '🍣'}</div>
                </td>
                <td>
                  <div className="strong">{c.nameUz}</div>
                  {c.nameRu && <div className="muted small">🇷🇺 {c.nameRu}</div>}
                </td>
                <td>{c._count?.products ?? 0}</td>
                <td>{c.sortOrder}</td>
                <td>
                  <button type="button" className={`toggle ${c.isActive ? 'is-on' : ''}`} onClick={() => toggle(c)}>
                    <span className="toggle__knob" />
                    {c.isActive ? 'Faol' : 'Nofaol'}
                  </button>
                </td>
                <td className="nowrap actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(c)}>
                    ✎ Tahrirlash
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(c)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list && !list.length && <div className="empty">Kategoriyalar yo'q</div>}
        {!list && !error && <div className="empty">Yuklanmoqda...</div>}
      </div>
      {editing && (
        <Modal title={editing === 'new' ? 'Yangi kategoriya' : 'Kategoriyani tahrirlash'} onClose={() => setEditing(null)}>
          <CategoryForm
            category={editing === 'new' ? null : editing}
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
