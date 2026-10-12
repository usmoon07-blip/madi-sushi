import { useCart } from '../store.jsx';
import SafeImg from './SafeImg.jsx';
import { useApp } from '../appState.jsx';
import { useT } from '../i18n.jsx';
import { haptic } from '../telegram.js';
import { HeartIcon, PlusIcon } from './Icons.jsx';
import Price from './Price.jsx';
import Stepper from './Stepper.jsx';

export default function ProductCard({ product }) {
  const cart = useCart();
  const app = useApp();
  const { pick } = useT();
  const qty = cart.qtyOf(product.id);
  const liked = app.favorites.has(product.id);
  const discount = product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
  const name = pick(product, 'name');

  return (
    <article className="card" onClick={() => app.openProduct(product)}>
      <div className="card__media">
        <SafeImg src={product.imageUrl} alt={name} />
        {discount > 0 && <span className="card__badge">−{discount}%</span>}
        <button
          type="button"
          className={`card__like ${liked ? 'is-liked' : ''}`}
          aria-label="♥"
          onClick={(e) => {
            e.stopPropagation();
            haptic.tap();
            app.toggleFavorite(product.id);
          }}
        >
          <HeartIcon filled={liked} width={18} height={18} />
        </button>
      </div>
      <div className="card__body">
        <h3 className="card__title">{name}</h3>
        <Price price={product.price} oldPrice={product.oldPrice} size="sm" />
        <div className="card__action">
          {qty > 0 ? (
            <Stepper value={qty} onChange={(v) => cart.setQty(product.id, v)} size="sm" />
          ) : (
            <button
              type="button"
              className="card__add"
              aria-label="+"
              onClick={(e) => {
                e.stopPropagation();
                haptic.tap();
                cart.add(product.id);
              }}
            >
              <PlusIcon width={18} height={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
