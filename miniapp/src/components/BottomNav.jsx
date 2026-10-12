import { useCart } from '../store.jsx';
import { useT } from '../i18n.jsx';
import { haptic } from '../telegram.js';
import { CartIcon, HomeIcon, ReceiptIcon, UserIcon } from './Icons.jsx';

const TABS = [
  { id: 'home', label: 'navHome', Icon: HomeIcon },
  { id: 'cart', label: 'navCart', Icon: CartIcon },
  { id: 'orders', label: 'navOrders', Icon: ReceiptIcon },
  { id: 'profile', label: 'navProfile', Icon: UserIcon },
];

export default function BottomNav({ tab, onChange }) {
  const { count } = useCart();
  const { t } = useT();
  return (
    <nav className="nav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav__item ${tab === id || (id === 'home' && tab === 'menu') ? 'is-active' : ''}`}
          onClick={() => {
            if (tab !== id) haptic.tap();
            onChange(id);
          }}
        >
          <span className="nav__icon">
            <Icon />
            {id === 'cart' && count > 0 && <span className="nav__badge">{count > 99 ? '99+' : count}</span>}
          </span>
          <span className="nav__label">{t(label)}</span>
        </button>
      ))}
    </nav>
  );
}
