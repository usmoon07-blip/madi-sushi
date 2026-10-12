import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import Header from '../components/Header.jsx';
import CategoryTiles from '../components/CategoryTiles.jsx';
import ProductCard from '../components/ProductCard.jsx';

const HIT_ID = 'hit';

// To'liq menyu: rasmli kategoriya qatori + kategoriyalarga ajratilgan bo'limlar
export default function Menu({ focusCategory }) {
  const { t, pick } = useT();
  const app = useApp();
  const [active, setActive] = useState(focusCategory || null);
  const sectionRefs = useRef({});

  const groups = useMemo(() => {
    const list = [];
    const hits = app.products.filter((p) => p.isHit);
    if (hits.length) list.push({ id: HIT_ID, name: t('hits'), items: hits, imageUrl: '' });
    for (const c of app.categories) {
      const items = app.products.filter((p) => p.categoryId === c.id);
      if (items.length) list.push({ id: c.id, name: pick(c, 'name'), items, imageUrl: c.imageUrl });
    }
    const known = new Set(app.categories.map((c) => c.id));
    const other = app.products.filter((p) => !known.has(p.categoryId));
    if (other.length) list.push({ id: 'other', name: '🍽', items: other, imageUrl: '' });
    return list;
  }, [app.products, app.categories, pick, t]);

  const tiles = groups.map((g) => ({ id: g.id, nameUz: g.name, imageUrl: g.imageUrl, emoji: g.id === HIT_ID ? '⭐' : '🍽' }));

  const scrollTo = (id, smooth = true) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (focusCategory) setTimeout(() => scrollTo(focusCategory, false), 30);
  }, [focusCategory]);

  // Qaysi bo'lim ko'rinayotganini kuzatib, tepadagi plitkani belgilash
  useEffect(() => {
    const onScroll = () => {
      let current = groups[0]?.id;
      for (const g of groups) {
        const el = sectionRefs.current[g.id];
        if (el && el.getBoundingClientRect().top < 170) current = g.id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [groups]);

  return (
    <div className="page">
      <Header />
      <div className="tiles-bar">
        <CategoryTiles categories={tiles} variant="row" active={active} onSelect={(c) => scrollTo(c.id)} />
      </div>
      {groups.map((g) => (
        <section key={g.id} className="section" ref={(el) => (sectionRefs.current[g.id] = el)}>
          <h2 className="section__title">{g.id === HIT_ID ? `${g.name} ⭐` : g.name}</h2>
          <div className="grid">
            {g.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
      {!groups.length && <div className="empty">{t('menuEmpty')}</div>}
    </div>
  );
}
