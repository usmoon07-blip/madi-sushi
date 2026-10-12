import { useEffect, useState } from 'react';
import { useCart } from '../store.jsx';
import { haptic, onBackButton } from '../telegram.js';
import { money } from '../format.js';
import Price from './Price.jsx';
import Stepper from './Stepper.jsx';

export default function ProductSheet({ product, onClose }) {
  const cart = useCart();
  const inCart = cart.qtyOf(product.id);
  const [qty, setQty] = useState(inCart || 1);
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  useEffect(() => onBackButton(close), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const submit = () => {
    haptic.success();
    cart.setQty(product.id, qty);
    close();
  };

  return (
    <div className={`sheet ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true">
      <div className="sheet__backdrop" onClick={close} />
      <div className="sheet__panel">
        <div className="sheet__handle" />
        <div className="sheet__scroll">
          <div className="sheet__media">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="card__ph">🍣</div>}
          </div>
          <div className="sheet__content">
            <span className="eyebrow">{product.category}</span>
            <h2 className="sheet__title">{product.name}</h2>
            <Price price={product.price} oldPrice={product.oldPrice} size="lg" />
            {product.description && <p className="sheet__desc">{product.description}</p>}
            {product.ingredients?.length > 0 && (
              <>
                <h4 className="sheet__subtitle">Tarkibi</h4>
                <ul className="bullets">
                  {product.ingredients.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
        <div className="sheet__footer">
          <Stepper value={qty} onChange={setQty} min={inCart ? 0 : 1} size="lg" />
          <button type="button" className="btn btn--primary btn--grow" onClick={submit}>
            {qty === 0 ? "Savatdan o'chirish" : `${inCart ? 'Yangilash' : "Qo'shish"} · ${money(product.price * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
