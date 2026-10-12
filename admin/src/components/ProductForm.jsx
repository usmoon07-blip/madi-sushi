import { useState } from 'react';
import { api } from '../api.js';
import ImageField from './ImageField.jsx';

const empty = {
  name: '',
  nameRu: '',
  categoryId: '',
  description: '',
  descriptionRu: '',
  ingredients: '',
  ingredientsRu: '',
  price: '',
  oldPrice: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
  isHit: false,
};

const lines = (arr) => (arr || []).join('\n');

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          ...empty,
          ...product,
          categoryId: product.categoryId ?? '',
          ingredients: lines(product.ingredients),
          ingredientsRu: lines(product.ingredientsRu),
          oldPrice: product.oldPrice ?? '',
        }
      : { ...empty, categoryId: categories[0]?.id ?? '' }
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      nameRu: form.nameRu,
      categoryId: Number(form.categoryId),
      description: form.description,
      descriptionRu: form.descriptionRu,
      ingredients: form.ingredients,
      ingredientsRu: form.ingredientsRu,
      price: form.price,
      oldPrice: form.oldPrice,
      imageUrl: form.imageUrl,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
      isHit: form.isHit,
    };
    try {
      const res = product ? await api.updateProduct(product.id, payload) : await api.createProduct(payload);
      onSaved(res.product);
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
          <input value={form.name} onChange={set('name')} required maxLength={80} placeholder="Filadelfiya" />
        </label>
        <label className="field">
          <span>🇷🇺 Nomi (ruscha)</span>
          <input value={form.nameRu} onChange={set('nameRu')} maxLength={80} placeholder="Филадельфия" />
        </label>
        <label className="field">
          <span>Kategoriya *</span>
          <select value={form.categoryId} onChange={set('categoryId')} required>
            <option value="" disabled>
              Tanlang...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameUz}
                {c.isActive ? '' : ' (nofaol)'}
              </option>
            ))}
          </select>
        </label>
        <div className="form__grid form__grid--tight">
          <label className="field">
            <span>Yangi narx *</span>
            <input value={form.price} onChange={set('price')} required inputMode="numeric" placeholder="89000" />
          </label>
          <label className="field">
            <span>Eski narx</span>
            <input value={form.oldPrice} onChange={set('oldPrice')} inputMode="numeric" placeholder="99000" />
          </label>
        </div>
      </div>

      <div className="form__grid">
        <label className="field">
          <span>🇺🇿 Ta'rifi</span>
          <textarea rows={2} value={form.description} onChange={set('description')} maxLength={500} />
        </label>
        <label className="field">
          <span>🇷🇺 Ta'rifi (ruscha)</span>
          <textarea rows={2} value={form.descriptionRu} onChange={set('descriptionRu')} maxLength={500} />
        </label>
        <label className="field">
          <span>🇺🇿 Tarkibi (har biri yangi qatordan)</span>
          <textarea rows={4} value={form.ingredients} onChange={set('ingredients')} placeholder={'Losos\nKrem-pishloq\nBodring'} />
        </label>
        <label className="field">
          <span>🇷🇺 Tarkibi (ruscha)</span>
          <textarea rows={4} value={form.ingredientsRu} onChange={set('ingredientsRu')} placeholder={'Лосось\nСливочный сыр\nОгурец'} />
        </label>
      </div>
      <p className="muted small">Ruscha maydonlar bo'sh qolsa, rus tilidagi mijozlarga o'zbekchasi ko'rsatiladi.</p>

      <div className="form__grid form__grid--3">
        <label className="field">
          <span>Tartib raqami (kichigi oldinda)</span>
          <input type="number" value={form.sortOrder} onChange={set('sortOrder')} />
        </label>
        <label className="check">
          <input type="checkbox" checked={form.isHit} onChange={set('isHit')} />
          <span>⭐ Xit savdo (bosh sahifada)</span>
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
