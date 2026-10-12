import { useEffect, useState } from 'react';
import { api } from '../api.js';

const formatCard = (v) =>
  String(v)
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .settings()
      .then(({ settings }) => setForm({ ...settings, cards: settings.cards || [] }))
      .catch((e) => setError(e.message));
  }, []);

  if (!form) return <div className="empty">{error || 'Yuklanmoqda...'}</div>;

  const set = (k) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  };
  const setCard = (i, k, v) => {
    setSaved(false);
    setForm((f) => ({ ...f, cards: f.cards.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { settings } = await api.saveSettings({
        cards: form.cards,
        deliveryFee: form.deliveryFee,
        freeDeliveryFrom: form.freeDeliveryFrom,
        minOrder: form.minOrder,
        pickupAddress: form.pickupAddress,
        contactPhone: form.contactPhone,
        isOpen: form.isOpen,
      });
      setForm({ ...settings, cards: settings.cards || [] });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="page-head">
        <div>
          <h1>Sozlamalar</h1>
          <p className="muted">O'zgarishlar Mini App'da darhol ko'rinadi</p>
        </div>
        <button className="btn btn--primary" disabled={saving}>
          {saving ? 'Saqlanmoqda...' : saved ? '✓ Saqlandi' : 'Saqlash'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}

      <section className="box">
        <div className="box__head">
          <div>
            <h3>Buyurtma qabul qilish</h3>
            <p className="muted small">O'chirilsa, mijozlar menyuni ko'radi, lekin buyurtma bera olmaydi</p>
          </div>
          <button
            type="button"
            className={`toggle toggle--lg ${form.isOpen ? 'is-on' : ''}`}
            onClick={() => setForm((f) => ({ ...f, isOpen: !f.isOpen }))}
          >
            <span className="toggle__knob" />
            {form.isOpen ? 'Ochiq' : 'Yopiq'}
          </button>
        </div>
      </section>

      <section className="box">
        <div className="box__head">
          <div>
            <h3>💳 Karta raqamlari</h3>
            <p className="muted small">Mijoz «Karta» orqali to'lashni tanlaganda shu kartalar ko'rsatiladi</p>
          </div>
          {form.cards.length < 5 && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setForm((f) => ({ ...f, cards: [...f.cards, { number: '', holder: '', bank: 'Uzcard' }] }))}
            >
              + Karta qo'shish
            </button>
          )}
        </div>
        {!form.cards.length && <p className="muted">Hali karta qo'shilmagan</p>}
        {form.cards.map((c, i) => (
          <div key={i} className="card-row">
            <label className="field">
              <span>Karta raqami</span>
              <input value={c.number} onChange={(e) => setCard(i, 'number', formatCard(e.target.value))} placeholder="8600 0000 0000 0000" required inputMode="numeric" />
            </label>
            <label className="field">
              <span>Karta egasi</span>
              <input value={c.holder} onChange={(e) => setCard(i, 'holder', e.target.value)} placeholder="ISM FAMILIYA" />
            </label>
            <label className="field">
              <span>Turi</span>
              <select value={c.bank} onChange={(e) => setCard(i, 'bank', e.target.value)}>
                {['Uzcard', 'Humo', 'Visa', 'Mastercard'].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--danger btn--sm card-row__del"
              onClick={() => setForm((f) => ({ ...f, cards: f.cards.filter((_, j) => j !== i) }))}
            >
              O'chirish
            </button>
          </div>
        ))}
      </section>

      <section className="box">
        <h3>🛵 Yetkazib berish</h3>
        <div className="form__grid form__grid--3">
          <label className="field">
            <span>Yetkazib berish narxi (so'm)</span>
            <input value={form.deliveryFee} onChange={set('deliveryFee')} inputMode="numeric" />
          </label>
          <label className="field">
            <span>Shu summadan bepul (0 = hech qachon)</span>
            <input value={form.freeDeliveryFrom} onChange={set('freeDeliveryFrom')} inputMode="numeric" />
          </label>
          <label className="field">
            <span>Minimal buyurtma (so'm)</span>
            <input value={form.minOrder} onChange={set('minOrder')} inputMode="numeric" />
          </label>
        </div>
      </section>

      <section className="box">
        <h3>📍 Filial</h3>
        <div className="form__grid">
          <label className="field">
            <span>Olib ketish manzili</span>
            <input value={form.pickupAddress} onChange={set('pickupAddress')} />
          </label>
          <label className="field">
            <span>Aloqa telefoni</span>
            <input value={form.contactPhone} onChange={set('contactPhone')} placeholder="+998 90 123 45 67" />
          </label>
        </div>
      </section>
    </form>
  );
}
