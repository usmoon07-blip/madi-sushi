import { useCart } from '../store.jsx';
import { mediaUrl } from '../api.js';
import { haptic } from '../telegram.js';
import { PlusIcon } from './Icons.jsx';
import Price from './Price.jsx';
import Stepper from './Stepper.jsx';

export default function ProductCard({ product, onOpen }) {
  const cart = useCart();
  const qty = cart.qtyOf(product.id);
  const discount = product.oldPrice > product.price ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;

  return (
    <article className="card" onClick={() => onOpen(product)}>
      <div className="card__media">
        {product.imageUrl ? <img src={mediaUrl(product.imageUrl)} alt={product.name} loading="lazy" /> : <div className="card__ph">🍣</div>}
        {discount > 0 && <span className="card__badge">−{discount}%</span>}
      </div>
      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <Price price={product.price} oldPrice={product.oldPrice} size="sm" />
        <div className="card__action">
          {qty > 0 ? (
            <Stepper value={qty} onChange={(v) => cart.setQty(product.id, v)} size="sm" />
          ) : (
            <button
              type="button"
              className="card__add"
              aria-label="Savatga qo'shish"
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
