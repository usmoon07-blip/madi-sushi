import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { CartProvider, useToastListener } from './store.jsx';
import { onBackButton } from './telegram.js';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import { Toasts } from './components/Controls.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Profile from './pages/Profile.jsx';
import Success from './pages/Success.jsx';
import snapshot from './menu-snapshot.json';

const hasSnapshot = Array.isArray(snapshot.products) && snapshot.products.length > 0;
const RETRY_MS = 4000;

export default function App() {
  // Menyu nusxasi ilova bilan birga keladi: server uyg'onguncha mijoz menyuni ko'rib turadi
  const [data, setData] = useState(() =>
    hasSnapshot ? { products: snapshot.products, settings: snapshot.settings, user: null, fromSnapshot: true } : null
  );
  const [error, setError] = useState('');
  const [tab, setTab] = useState('menu');
  const [sheet, setSheet] = useState(null);
  const [order, setOrder] = useState(null);
  const [toasts, setToasts] = useState([]);

  const load = useCallback(() => {
    setError('');
    return api
      .bootstrap()
      .then((d) => {
        setData(d);
        return true;
      })
      .catch((e) => {
        // Nusxa bor bo'lsa xatolik ko'rsatilmaydi — mijoz menyuni ko'rib turadi
        if (!hasSnapshot) setError(e.message);
        return e.status === 401 ? 'stop' : false;
      });
  }, []);

  // Server uxlab yotgan bo'lsa (bepul tarif), uyg'onguncha jimgina qayta urinamiz
  useEffect(() => {
    let cancelled = false;
    let timer;
    const attempt = async (n) => {
      const ok = await load();
      if (cancelled || ok === true || ok === 'stop' || !hasSnapshot || n >= 30) return;
      timer = setTimeout(() => attempt(n + 1), RETRY_MS);
    };
    attempt(1);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  useToastListener(
    useCallback((t) => {
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 3200);
    }, [])
  );

  // Telegram "orqaga" tugmasi: savat/profildan menyuga qaytaradi
  useEffect(() => {
    if (tab === 'menu' || sheet || order) return undefined;
    return onBackButton(() => setTab('menu'));
  }, [tab, sheet, order]);

  const goTab = (t) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  if (error && !data) {
    return (
      <div className="splash">
        <div className="brand__mark brand__mark--lg">鮨</div>
        <p>{error}</p>
        <button type="button" className="btn btn--primary" onClick={load}>
          Qayta urinish
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="splash">
        <div className="brand__mark brand__mark--lg spin">鮨</div>
        <div className="splash__name">MADI SUSHI</div>
      </div>
    );
  }

  const { products, settings, user } = data;
  const setUser = (u) => setData((d) => ({ ...d, user: u }));

  return (
    <CartProvider products={products}>
      {order ? (
        <Success
          order={order}
          onDone={() => {
            setOrder(null);
            goTab('menu');
          }}
        />
      ) : (
        <>
          {tab === 'menu' && <Menu products={products} settings={settings} user={user} onOpenProduct={setSheet} />}
          {tab === 'cart' && (
            <Cart
              products={products}
              settings={settings}
              user={user}
              onUserChange={setUser}
              onGoMenu={() => goTab('menu')}
              onReload={load}
              onSuccess={setOrder}
            />
          )}
          {tab === 'profile' && (
            <Profile user={user} settings={settings} products={products} onUserChange={setUser} onGoCart={() => goTab('cart')} />
          )}
          <BottomNav tab={tab} onChange={goTab} />
          {sheet && <ProductSheet product={sheet} onClose={() => setSheet(null)} />}
        </>
      )}
      <Toasts items={toasts} />
    </CartProvider>
  );
}
