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

export default function ImageField({ value, onChange, onError, onBusy }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    onBusy?.(true);
    onError?.('');
    try {
      const { url } = await api.upload(await shrinkImage(file));
      onChange(url);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setUploading(false);
      onBusy?.(false);
      e.target.value = '';
    }
  };

  return (
    <div className="form__image">
      <div className="preview">{value ? <img src={value} alt="" /> : <span>🍣</span>}</div>
      <div className="form__image-actions">
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? 'Yuklanmoqda...' : '📷 Rasm yuklash'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} />
        <label className="field">
          <span>yoki rasm havolasi (URL)</span>
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        </label>
      </div>
    </div>
  );
}
