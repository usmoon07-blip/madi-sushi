import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { SAMPLE_ORDER, device, printReceipt, printerConfig, usePrinterConfig } from '../printing.js';

const PRINT_MODES = [
  { value: 'NEW', label: 'Yangi buyurtma kelishi bilan' },
  { value: 'ACCEPTED', label: '«Qabul qilish» bosilganda' },
  { value: 'OFF', label: "O'chirilgan" },
];

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
  const [connection, setConnection] = useState('USB');
  const [testing, setTesting] = useState(false);
  const [cloud, setCloud] = useState(false);
  usePrinterConfig(); // "shu kompyuter" belgisi o'zgarsa qayta chizish uchun
  const isKitchen = device.isKitchen();

  useEffect(() => {
    api
      .settings()
      .then(({ settings, serverMode }) => {
        setForm({ ...settings, cards: settings.cards || [] });
        setCloud(serverMode === 'cloud');
        setConnection(settings.printerIp && serverMode !== 'cloud' ? 'NETWORK' : 'USB');
      })
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
        printMode: form.printMode,
        paperWidth: form.paperWidth,
        printCopies: form.printCopies,
        printerIp: connection === 'NETWORK' ? form.printerIp : '',
      });
      setForm({ ...settings, cards: settings.cards || [] });
      printerConfig.set({ ...settings, printerError: null });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const testPrint = async () => {
    if (connection === 'USB') {
      printReceipt({ ...SAMPLE_ORDER, createdAt: new Date().toISOString() }, { paperWidth: form.paperWidth, copies: 1 });
      return;
    }
    setTesting(true);
    try {
      await api.printTest();
      alert('Sinov cheki printerga yuborildi ✅');
    } catch (err) {
      alert(err.message);
    } finally {
      setTesting(false);
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
        <div>
          <h3>🖨 Oshxona cheki</h3>
          <p className="muted small">Buyurtma kelganda oshxona printerida chek avtomatik chiqadi</p>
        </div>
        <div className="form__grid form__grid--3">
          <label className="field">
            <span>Chek qachon chiqsin</span>
            <select value={form.printMode} onChange={set('printMode')}>
              {PRINT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Qog'oz kengligi</span>
            <select value={form.paperWidth} onChange={set('paperWidth')}>
              <option value={80}>80 mm</option>
              <option value={58}>58 mm</option>
            </select>
          </label>
          <label className="field">
            <span>Nechta nusxa</span>
            <select value={form.printCopies} onChange={set('printCopies')}>
              <option value={1}>1 ta</option>
              <option value={2}>2 ta (oshxona + kuryer)</option>
              <option value={3}>3 ta</option>
            </select>
          </label>
        </div>

        <div className="field">
          <span>Printer qanday ulangan</span>
          <div className="choice">
            {[
              {
                value: 'USB',
                title: 'Oshxona kompyuteri orqali',
                text: "Printer Windows'ga o'rnatilgan (USB yoki LAN). Chekni shu kompyuterdagi admin panel chiqaradi.",
              },
              {
                value: 'NETWORK',
                title: 'Tarmoq printeri (IP)',
                text: cloud
                  ? "Server internetda turgani uchun ichki tarmoqdagi printerga ulana olmaydi. «Oshxona kompyuteri orqali» ni tanlang."
                  : "Printerning IP manzili bor. Server chekni to'g'ridan-to'g'ri yuboradi.",
              },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={cloud && c.value === 'NETWORK'}
                className={`choice__item ${connection === c.value ? 'is-active' : ''}`}
                onClick={() => {
                  setSaved(false);
                  setConnection(c.value);
                }}
              >
                <b>{c.title}</b>
                <span>{c.text}</span>
              </button>
            ))}
          </div>
        </div>

        {connection === 'NETWORK' ? (
          <label className="field">
            <span>Printer IP manzili (printerdan chiqadigan «self-test» chekida yozilgan)</span>
            <input value={form.printerIp} onChange={set('printerIp')} placeholder="192.168.1.100" required />
          </label>
        ) : (
          <div className="kitchen-device">
            <div>
              <b>Shu kompyuter — oshxona kompyuteri</b>
              <p className="muted small">
                Faqat printer ulangan kompyuterda yoqing. Admin panel shu kompyuterda doim ochiq tursin.
              </p>
            </div>
            <button type="button" className={`toggle toggle--lg ${isKitchen ? 'is-on' : ''}`} onClick={() => device.setKitchen(!isKitchen)}>
              <span className="toggle__knob" />
              {isKitchen ? 'Yoqilgan' : "O'chiq"}
            </button>
          </div>
        )}

        <div className="row-actions">
          <button type="button" className="btn btn--ghost" onClick={testPrint} disabled={testing}>
            {testing ? 'Yuborilmoqda...' : '🧾 Sinov cheki'}
          </button>
          {connection === 'NETWORK' && <span className="muted small">Avval «Saqlash» ni bosing</span>}
        </div>
        {connection === 'USB' && (
          <p className="hint">
            💡 Chek oynasiz (avtomatik) chiqishi uchun admin panelni maxsus Chrome yorlig'i orqali oching — qo'llanma README faylida.
          </p>
        )}
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
