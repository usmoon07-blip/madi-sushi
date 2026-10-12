import { useMemo } from 'react';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import Header from '../components/Header.jsx';
import CategoryTiles from '../components/CategoryTiles.jsx';
import ProductCard from '../components/ProductCard.jsx';

// Bosh sahifa: manzil + usul, qizil "Menyu" bloki (kategoriyalar), faqat xit savdo
export default function Home() {
  const { t, money } = useT();
  const app = useApp();
  const hits = useMemo(() => app.products.filter((p) => p.isHit), [app.products]);
  const categories = useMemo(
    () => app.categories.filter((c) => app.products.some((p) => p.categoryId === c.id)),
    [app.categories, app.products]
  );

  return (
    <div className="page">
      <Header />

      <section className="menu-block">
        <div className="menu-block__glow" />
        <h2 className="menu-block__title">{t('menu')}</h2>
        <CategoryTiles categories={categories} onSelect={(c) => app.openMenu(c.id)} />
        <button type="button" className="menu-block__link" onClick={() => app.openMenu()}>
          {t('toMenu')}
        </button>
      </section>

      {app.settings.freeDeliveryFrom > 0 && app.mode === 'DELIVERY' && (
        <p className="promo-line">🛵 {t('freeDeliveryFrom', money(app.settings.freeDeliveryFrom))}</p>
      )}

      {hits.length > 0 && (
        <section className="section">
          <h2 className="section__title section__title--center">{t('hits')} ⭐</h2>
          <div className="grid">
            {hits.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
