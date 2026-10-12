import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { beep } from '../sound.js';
import { printReceipt, printerConfig } from '../printing.js';
import { NEXT_STATUS, STATUSES, formatDate, money, statusOf, yandexNavi, yandexRoute } from '../format.js';

const FILTERS = [
  { value: 'ACTIVE', label: 'Faol' },
  { value: 'NEW', label: 'Yangi' },
  { value: 'ACCEPTED', label: 'Tayyorlanmoqda' },
  { value: 'ON_WAY', label: "Yo'lda" },
  { value: 'DONE', label: 'Yakunlangan' },
  { value: 'CANCELLED', label: 'Bekor' },
  { value: '', label: 'Hammasi' },
];
const POLL_MS = 5000;

export default function Orders({ onActiveCount, visible }) {
  const [filter, setFilter] = useState('ACTIVE');
  const [orders, setOrders] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [fresh, setFresh] = useState(new Set());
  const lastSeenId = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api.orders(filter);
      setOrders(data.orders);
      setStats(data.stats);
      onActiveCount(data.stats.active);
      setError('');
      // Yangi buyurtma kelganini aniqlash
      const { lastId } = data.stats;
      if (lastSeenId.current !== null && lastId > lastSeenId.current) {
        beep();
        const since = lastSeenId.current;
        setFresh((s) => new Set([...s, ...Array.from({ length: lastId - since }, (_, i) => since + i + 1)]));
      }
      lastSeenId.current = Math.max(lastSeenId.current ?? 0, lastId);
    } catch (e) {
      setError(e.message);
    }
  }, [filter, onActiveCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const changeStatus = async (order, status) => {
    if (status === 'CANCELLED' && !confirm(`#${order.id} buyurtmani bekor qilasizmi? Mijozga xabar boradi.`)) return;
    setBusy(order.id);
    try {
      await api.setStatus(order.id, status);
      setFresh((s) => {
        const n = new Set(s);
        n.delete(order.id);
        return n;
      });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const reprint = async (order) => {
    const config = printerConfig.get();
    if (config?.printerIp) {
      setBusy(order.id);
      try {
        await api.printNow(order.id);
      } catch (e) {
        alert(e.message);
      } finally {
        setBusy(null);
      }
    } else {
      printReceipt(order, { paperWidth: config?.paperWidth || 80, copies: 1, reprint: true });
    }
  };

  if (!visible && !orders) return null;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Buyurtmalar</h1>
          <p className="muted">Har {POLL_MS / 1000} soniyada avtomatik yangilanadi · yangi buyurtmada ovozli signal</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={load}>
          ⟳ Yangilash
        </button>
      </div>

      {stats && (
        <div className="stats">
          <div className="stat">
            <span className="stat__label">Bugungi buyurtmalar</span>
            <span className="stat__value">{stats.todayOrders}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Bugungi tushum</span>
            <span className="stat__value">{money(stats.todayRevenue)}</span>
          </div>
          <div className="stat stat--accent">
            <span className="stat__label">Yangi</span>
            <span className="stat__value">{stats.counts.NEW || 0}</span>
          </div>
          <div className="stat">
            <span className="stat__label">Jarayonda</span>
            <span className="stat__value">{(stats.counts.ACCEPTED || 0) + (stats.counts.ON_WAY || 0)}</span>
          </div>
        </div>
      )}

      <div className="tabs">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" className={`tab ${filter === f.value ? 'is-active' : ''}`} onClick={() => setFilter(f.value)}>
            {f.label}
            {f.value && f.value !== 'ACTIVE' && stats?.counts[f.value] ? <span className="tab__count">{stats.counts[f.value]}</span> : null}
          </button>
        ))}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Mijoz</th>
              <th>Tarkibi</th>
              <th>Yetkazish</th>
              <th>To'lov</th>
              <th>Jami</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => {
              const st = statusOf(o.status);
              const next = NEXT_STATUS[o.status];
              const isDelivery = o.deliveryType === 'DELIVERY';
              return (
                <tr key={o.id} className={`${o.status === 'NEW' ? 'row--new' : ''} ${fresh.has(o.id) ? 'row--fresh' : ''}`}>
                  <td>
                    <div className="strong">#{o.id}</div>
                    <div className="muted small nowrap">{formatDate(o.createdAt)}</div>
                    <button type="button" className="btn btn--ghost btn--xs" disabled={busy === o.id} onClick={() => reprint(o)} title="Chekni chop etish">
                      🖨 Chek
                    </button>
                  </td>
                  <td>
                    <div className="strong">{o.customerName}</div>
                    <a className="phone" href={`tel:${o.phone.replace(/\s/g, '')}`}>
                      {o.phone}
                    </a>
                    {o.user?.username && (
                      <a className="muted small block" href={`https://t.me/${o.user.username}`} target="_blank" rel="noreferrer">
                        @{o.user.username}
                      </a>
                    )}
                  </td>
                  <td>
                    <ul className="items">
                      {o.items.map((i) => (
                        <li key={i.productId}>
                          <span>{i.name}</span> <b>×{i.qty}</b>
                        </li>
                      ))}
                    </ul>
                    {o.comment && <div className="comment">💬 {o.comment}</div>}
                  </td>
                  <td className="addr">
                    <div className="strong">{isDelivery ? '🛵 Yetkazib berish' : '🏃 Olib ketish'}</div>
                    {isDelivery && (
                      <>
                        <div className="small">{o.address || 'Faqat lokatsiya'}</div>
                        {o.addressNote && <div className="muted small">🏠 {o.addressNote}</div>}
                        <div className="map-links">
                          <a className="btn btn--map" href={yandexRoute(o)} target="_blank" rel="noreferrer">
                            🗺 Yandex Maps
                          </a>
                          {o.lat != null && (
                            <a className="btn btn--map btn--map-alt" href={yandexNavi(o)}>
                              🧭 Navigator
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </td>
                  <td className="nowrap">{o.paymentType === 'CARD' ? '💳 Karta' : '💵 Naqd'}</td>
                  <td className="nowrap">
                    <div className="strong">{money(o.total)}</div>
                    {o.deliveryFee > 0 && <div className="muted small">yetkazish: {money(o.deliveryFee)}</div>}
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`pill pill--${st.tone}`}>{st.label}</span>
                      {next && (
                        <button type="button" className="btn btn--primary btn--sm" disabled={busy === o.id} onClick={() => changeStatus(o, next.value)}>
                          {next.value === 'ON_WAY' && !isDelivery ? 'Tayyor' : next.label}
                        </button>
                      )}
                      <select value={o.status} disabled={busy === o.id} onChange={(e) => changeStatus(o, e.target.value)}>
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders && !orders.length && <div className="empty">Bu bo'limda buyurtmalar yo'q</div>}
        {!orders && !error && <div className="empty">Yuklanmoqda...</div>}
      </div>
    </div>
  );
}
