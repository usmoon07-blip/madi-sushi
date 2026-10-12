import { useRef, useState } from 'react';
import { api } from '../api.js';

// Rasmni yuklashdan oldin kichraytiramiz (1000px, WEBP) — bazada kam joy egallaydi
async function shrinkImage(file, max = 1000) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file;
    return new File([blob], 'image.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}

const empty = { name: '', category: '', description: '', ingredients: '', price: '', oldPrice: '', imageUrl: '', sortOrder: 0, isActive: true };

export default function ProductForm({ product, categories, onSaved, onCancel }) {
  const [form, setForm] = useState(() =>
    product ? { ...empty, ...product, ingredients: (product.ingredients || []).join('\n'), oldPrice: product.oldPrice ?? '' } : empty
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await api.upload(await shrinkImage(file));
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      ingredients: form.ingredients,
      price: form.price,
      oldPrice: form.oldPrice,
      imageUrl: form.imageUrl,
      sortOrder: form.sortOrder,
      isActive: form.isActive,
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
      <div className="form__image">
        <div className="preview">{form.imageUrl ? <img src={form.imageUrl} alt="" /> : <span>🍣</span>}</div>
        <div className="form__image-actions">
          <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? 'Yuklanmoqda...' : '📷 Rasm yuklash'}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
          <label className="field">
            <span>yoki rasm havolasi (URL)</span>
            <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
          </label>
        </div>
      </div>

      <div className="form__grid">
        <label className="field">
          <span>Nomi *</span>
          <input value={form.name} onChange={set('name')} required maxLength={80} placeholder="Filadelfiya" />
        </label>
        <label className="field">
          <span>Kategoriya *</span>
          <input value={form.category} onChange={set('category')} required list="categories" maxLength={40} placeholder="Rollar" />
          <datalist id="categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>Yangi narx (so'm) *</span>
          <input value={form.price} onChange={set('price')} required inputMode="numeric" placeholder="89000" />
        </label>
        <label className="field">
          <span>Eski narx (ixtiyoriy, chizilgan holda chiqadi)</span>
          <input value={form.oldPrice} onChange={set('oldPrice')} inputMode="numeric" placeholder="99000" />
        </label>
      </div>

      <label className="field">
        <span>Ta'rifi</span>
        <textarea rows={2} value={form.description} onChange={set('description')} maxLength={500} />
      </label>
      <label className="field">
        <span>Tarkibi (har birini yangi qatordan yozing)</span>
        <textarea rows={4} value={form.ingredients} onChange={set('ingredients')} placeholder={'Losos\nKrem-pishloq\nBodring'} />
      </label>

      <div className="form__grid">
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
