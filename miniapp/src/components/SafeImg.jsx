import { useState } from 'react';
import { mediaUrl } from '../api.js';

// Rasm ochilmasa (internet sekin yoki fayl yo'q) — bo'sh joy o'rniga belgi ko'rsatiladi
export default function SafeImg({ src, alt = '', className, loading = 'lazy', fallback = '🍣' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={`img-fallback ${className || ''}`}>{fallback}</span>;
  return <img className={className} src={mediaUrl(src)} alt={alt} loading={loading} onError={() => setFailed(true)} />;
}
