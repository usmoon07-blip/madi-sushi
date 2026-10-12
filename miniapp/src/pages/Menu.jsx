import { useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard.jsx';
import { money } from '../format.js';

export default function Menu({ products, settings, user, onOpenProduct }) {
  const categories = useMemo(() => [...new Set(products.map((p) => p.category))], [products]);
  const [active, setActive] = useState('all');

  const groups = useMemo(() => {
    const list = active === 'all' ? categories : [active];
    return list.map((c) => ({ category: c, items: products.filter((p) => p.category === c) })).filter((g) => g.items.length);
  }, [active, categories, products]);

  return (
    <div className="page">
      <header className="top">
        <div className="brand">
          <span className="brand__mark">鮨</span>
          <div>
            <div className="brand__name">MADI SUSHI</div>
            <div className="brand__sub">Salom, {user?.firstName || 'mehmon'} 👋</div>
          </div>
        </div>
      </header>

      {!settings.isOpen && <div className="notice">⏸ Hozir buyurtmalar qabul qilinmayapti. Menyuni ko'rishingiz mumkin.</div>}

      <section className="hero">
        <div className="hero__glow" />
        <span className="eyebrow eyebrow--light">Premium sushi bar</span>
        <h1 className="hero__title">
          Yangi tayyorlangan
          <br />
          sushi — <em>eshigingizgacha</em>
        </h1>
        {settings.freeDeliveryFrom > 0 && (
          <p className="hero__text">{money(settings.freeDeliveryFrom)} dan yuqori buyurtmalarga yetkazib berish bepul</p>
        )}
        <div className="hero__roll" aria-hidden="true">
          <span />
        </div>
      </section>

      <div className="chips" role="tablist">
        {[{ id: 'all', label: 'Hammasi' }, ...categories.map((c) => ({ id: c, label: c }))].map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${active === c.id ? 'is-active' : ''}`}
            onClick={() => setActive(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.category} className="section">
          <h2 className="section__title">{g.category}</h2>
          <div className="grid">
            {g.items.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpenProduct} />
            ))}
          </div>
        </section>
      ))}

      {!products.length && <div className="empty">Menyu hozircha bo'sh</div>}
    </div>
  );
}
