import { money } from '../format.js';

export default function Price({ price, oldPrice, size = 'md' }) {
  return (
    <div className={`price price--${size}`}>
      <span className="price__new">{money(price)}</span>
      {oldPrice > price && <span className="price__old">{money(oldPrice)}</span>}
    </div>
  );
}
