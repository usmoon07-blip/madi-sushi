import SafeImg from './SafeImg.jsx';
import { useT } from '../i18n.jsx';

// Rasmli kategoriya plitkalari (bosh sahifadagi qizil blok va menyu tepasidagi qator)
export default function CategoryTiles({ categories, onSelect, variant = 'grid', active }) {
  const { pick } = useT();
  return (
    <div className={`tiles tiles--${variant}`}>
      {categories.map((c) => (
        <button key={c.id} type="button" className={`tile ${active === c.id ? 'is-active' : ''}`} onClick={() => onSelect(c)}>
          <span className="tile__img"><SafeImg src={c.imageUrl} fallback={c.emoji || '🍣'} /></span>
          <span className="tile__name">{pick(c, 'name')}</span>
        </button>
      ))}
    </div>
  );
}
