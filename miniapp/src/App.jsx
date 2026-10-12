import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { api, setApiLang } from './api.js';
import { CartProvider, useToastListener } from './store.jsx';
import { AppContext, storedBranch, storedLocation, storedMode } from './appState.jsx';
import BranchSheet from './components/BranchSheet.jsx';
import { LangContext, guessLang } from './i18n.jsx';
import { onBackButton, tg } from './telegram.js';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
const MapPicker = lazy(() => import('./components/MapPicker.jsx'));
import { Toasts } from './components/Controls.jsx';
import Logo from './components/Logo.jsx';
import LocationGate from './pages/LocationGate.jsx';
import Home from './pages/Home.jsx';
import Menu from './pages/Menu.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import Profile from './pages/Profile.jsx';
import Success from './pages/Success.jsx';
import snapshot from './menu-snapshot.json';

const hasSnapshot = Array.isArray(snapshot.products) && snapshot.products.length > 0;
const RETRY_MS = 4000;
const LANG_KEY = 'madi_lang_v1';

const readLS = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const writeLS = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* ignore */
  }
};

const initialLang = () => {
  const saved = readLS(LANG_KEY);
  if (saved === 'uz' || saved === 'ru') return saved;
  return guessLang(tg?.initDataUnsafe?.user?.language_code);
};

const userLocation = (u) =>
  u && (u.lastAddress || u.lastLat != null) ? { lat: u.lastLat, lon: u.lastLon, address: u.lastAddress || '' } : null;

export default function App() {
  // Menyu nusxasi ilova bilan birga keladi: server uyg'onguncha mijoz menyuni ko'rib turadi
  const [data, setData] = useState(() =>
    hasSnapshot
      ? { products: snapshot.products, categories: snapshot.categories || [], settings: snapshot.settings, user: null }
      : null
  );
  const [error, setError] = useState('');
  const [lang, setLangState] = useState(initialLang);
  const [favorites, setFavorites] = useState(() => new Set());
  const [location, setLocationState] = useState(() => storedLocation.get());
  const [mode, setModeState] = useState(() => storedMode.get());
  const [branchId, setBranchId] = useState(() => storedBranch.get());
  const [branchesOpen, setBranchesOpen] = useState(false);
  // Har safar ilova ochilganda mijoz avval yetkazish yoki olib ketishni tanlaydi
  const [gateDone, setGateDone] = useState(false);
  const [tab, setTab] = useState('home');
  const [menuFocus, setMenuFocus] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [order, setOrder] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setApiLang(lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const load = useCallback(() => {
    setError('');
    return api
      .bootstrap()
      .then((d) => {
        setData(d);
        setFavorites(new Set(d.favorites || []));
        // Til: foydalanuvchi botda yoki ilovada tanlagani ustun
        if (d.user?.lang === 'uz' || d.user?.lang === 'ru') {
          setLangState(d.user.lang);
          writeLS(LANG_KEY, d.user.lang);
        }
        // Bu qurilmada manzil saqlanmagan bo'lsa — serverdagisini olamiz
        setLocationState((cur) => cur || userLocation(d.user));
        return true;
      })
      .catch((e) => {
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

  const goTab = useCallback((t) => {
    setTab(t);
    if (t !== 'menu') setMenuFocus(null);
    window.scrollTo({ top: 0 });
  }, []);

  // Telegram "orqaga" tugmasi: bosh sahifaga qaytaradi
  useEffect(() => {
    if (tab === 'home' || tab === 'profile' || sheet || addressOpen || branchesOpen || order) return undefined;
    return onBackButton(() => goTab('home'));
  }, [tab, sheet, addressOpen, branchesOpen, order, goTab]);

  const app = useMemo(() => {
    if (!data) return null;
    const branches = data.branches || [];
    // Tanlangan filial (o'chirilgan bo'lsa — birinchisi)
    const branch = branches.find((b) => b.id === branchId) || branches[0] || null;
    return {
      ...data,
      branches,
      branch,
      setBranch: (id) => {
        setBranchId(id);
        storedBranch.set(id);
      },
      openBranchPicker: () => setBranchesOpen(true),
      favorites,
      location,
      mode,
      setUser: (u) => setData((d) => ({ ...d, user: u })),
      reload: load,
      goTab,
      openMenu: (categoryId = null) => {
        setMenuFocus(categoryId);
        setTab('menu');
        if (!categoryId) window.scrollTo({ top: 0 });
      },
      openProduct: setSheet,
      // opts.onSaved — manzil saqlangach chaqiriladi (masalan, birinchi ekranda)
      openAddress: (opts = {}) => setAddressOpen(opts),
      openBranches: () => setBranchesOpen(true),
      setMode: (m) => {
        setModeState(m);
        storedMode.set(m);
      },
      setLocation: (loc) => {
        setLocationState(loc);
        storedLocation.set(loc);
        api.saveLocation(loc).catch(() => {});
      },
      finishGate: () => {
        setGateDone(true);
        window.scrollTo({ top: 0 });
      },
      toggleFavorite: (id) => {
        setFavorites((cur) => {
          const next = new Set(cur);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        api
          .toggleFavorite(id)
          .then((r) => setFavorites(new Set(r.favorites)))
          .catch(() => {});
      },
    };
  }, [data, favorites, location, mode, branchId, load, goTab]);

  const langCtx = useMemo(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        writeLS(LANG_KEY, l);
        setApiLang(l);
        api.setLang(l).catch(() => {});
      },
    }),
    [lang]
  );

  if (error && !data) {
    return (
      <div className="splash">
        <Logo size={96} />
        <p>{error}</p>
        <button type="button" className="btn btn--primary" onClick={load}>
          {lang === 'ru' ? 'Повторить' : 'Qayta urinish'}
        </button>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="splash">
        <Logo size={128} className="pulse" />
      </div>
    );
  }

  const showGate = !gateDone;

  return (
    <LangContext.Provider value={langCtx}>
      <AppContext.Provider value={app}>
        <CartProvider products={app.products}>
          {showGate ? (
            <LocationGate />
          ) : order ? (
            <Success
              order={order}
              onDone={() => {
                setOrder(null);
                goTab('home');
              }}
            />
          ) : (
            <>
              {tab === 'home' && <Home />}
              {tab === 'menu' && <Menu focusCategory={menuFocus} />}
              {tab === 'cart' && <Cart onSuccess={setOrder} />}
              {tab === 'orders' && <Orders />}
              {tab === 'profile' && <Profile />}
              <BottomNav tab={tab} onChange={goTab} />
              {sheet && <ProductSheet product={sheet} onClose={() => setSheet(null)} />}
            </>
          )}
          {addressOpen && (
            <Suspense fallback={<div className="mappick" />}>
              <MapPicker onClose={() => setAddressOpen(false)} onSaved={addressOpen.onSaved} />
            </Suspense>
          )}
          {branchesOpen && <BranchSheet onClose={() => setBranchesOpen(false)} />}
          <Toasts items={toasts} />
        </CartProvider>
      </AppContext.Provider>
    </LangContext.Provider>
  );
}
