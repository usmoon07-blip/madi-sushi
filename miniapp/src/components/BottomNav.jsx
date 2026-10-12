import { useCart } from '../store.jsx';
import { haptic } from '../telegram.js';
import { CartIcon, MenuIcon, UserIcon } from './Icons.jsx';

const TABS = [
  { id: 'menu', label: 'Menyu', Icon: MenuIcon },
  { id: 'cart', label: 'Savat', Icon: CartIcon },
  { id: 'profile', label: 'Profil', Icon: UserIcon },
];

export default function BottomNav({ tab, onChange }) {
  const { count } = useCart();
  return (
    <nav className="nav">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className={`nav__item ${tab === id ? 'is-active' : ''}`}
          onClick={() => {
            if (tab !== id) haptic.tap();
            onChange(id);
          }}
        >
          <span className="nav__icon">
            <Icon />
            {id === 'cart' && count > 0 && <span className="nav__badge">{count > 99 ? '99+' : count}</span>}
          </span>
          <span className="nav__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
