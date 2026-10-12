import { useEffect, useState } from 'react';
import { auth, setUnauthorizedHandler } from './api.js';
import Login from './pages/Login.jsx';
import Orders from './pages/Orders.jsx';
import Products from './pages/Products.jsx';
import Settings from './pages/Settings.jsx';
import Categories from './pages/Categories.jsx';
import Branches from './pages/Branches.jsx';
import Reviews from './pages/Reviews.jsx';
import KitchenPrinter from './components/KitchenPrinter.jsx';
import logo from './assets/logo.webp';

const PAGES = [
  { id: 'orders', label: 'Buyurtmalar', icon: '🧾' },
  { id: 'products', label: 'Mahsulotlar', icon: '🍣' },
  { id: 'categories', label: 'Kategoriyalar', icon: '🗂' },
  { id: 'branches', label: 'Filiallar', icon: '🏪' },
  { id: 'reviews', label: 'Otzivlar', icon: '⭐' },
  { id: 'settings', label: 'Sozlamalar', icon: '⚙️' },
];

export default function App() {
  const [token, setToken] = useState(auth.get());
  const [page, setPage] = useState(() => (location.hash.slice(1) in { orders: 1, products: 1, categories: 1, branches: 1, reviews: 1, settings: 1 } ? location.hash.slice(1) : 'orders'));
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => setUnauthorizedHandler(() => setToken('')), []);
  useEffect(() => {
    location.hash = page;
  }, [page]);
  useEffect(() => {
    document.title = activeCount ? `(${activeCount}) Madi Sushi — Admin` : 'Madi Sushi — Admin';
  }, [activeCount]);

  if (!token) return <Login onLogin={(t) => (auth.set(t), setToken(t))} />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <img className="logo__mark" src={logo} alt="Madi Sushi" />
          <div>
            <div className="logo__name">MADI SUSHI</div>
            <div className="logo__sub">Boshqaruv paneli</div>
          </div>
        </div>
        <nav className="menu">
          {PAGES.map((p) => (
            <button key={p.id} type="button" className={`menu__item ${page === p.id ? 'is-active' : ''}`} onClick={() => setPage(p.id)}>
              <span>{p.icon}</span>
              {p.label}
              {p.id === 'orders' && activeCount > 0 && <span className="menu__badge">{activeCount}</span>}
            </button>
          ))}
        </nav>
        <KitchenPrinter />
        <button
          type="button"
          className="menu__item menu__logout"
          onClick={() => {
            auth.set('');
            setToken('');
          }}
        >
          <span>↩</span> Chiqish
        </button>
      </aside>
      <main className="main">
        {/* Buyurtmalar sahifasi yashirin holda ham ishlab turadi — yangi buyurtma ovozi hamisha eshitiladi */}
        <div hidden={page !== 'orders'}>
          <Orders onActiveCount={setActiveCount} visible={page === 'orders'} />
        </div>
        {page === 'products' && <Products />}
        {page === 'categories' && <Categories />}
        {page === 'branches' && <Branches />}
        {page === 'reviews' && <Reviews />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
